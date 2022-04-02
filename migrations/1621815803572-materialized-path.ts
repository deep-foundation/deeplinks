import { HasuraApi } from '@deep-foundation/hasura/api';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { sql } from '@deep-foundation/hasura/sql';
import { down as downRels, up as upRels } from '@deep-foundation/materialized-path/relationships';
import { down as downTable, up as upTable } from '@deep-foundation/materialized-path/table';
import { Trigger } from '@deep-foundation/materialized-path/trigger';
import Debug from 'debug';
import { GLOBAL_ID_ANY, GLOBAL_ID_INCLUDE_DOWN, GLOBAL_ID_INCLUDE_NODE, GLOBAL_ID_INCLUDE_UP, GLOBAL_ID_TREE } from '../imports/client';
import { SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';

const debug = Debug('deeplinks:migrations:materialized-path');
const log = debug.extend('log');
const error = debug.extend('error');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const MP_TABLE_NAME = 'mp';

const trigger = Trigger({
  mpTableName: MP_TABLE_NAME,
  graphTableName: LINKS_TABLE_NAME,
  id_type: 'bigint',
  iteratorInsertDeclare: 'groupRow RECORD;',
  iteratorDeleteArgumentSend: 'groupRow',
  iteratorDeleteArgumentGet: 'groupRow RECORD',
  iteratorInsertBegin: `FOR groupRow IN (
    SELECT
    DISTINCT mpGroup."id"
    FROM
    ${LINKS_TABLE_NAME} as mpGroup,
    ${LINKS_TABLE_NAME} as mpInclude
    WHERE
    mpInclude."type_id" IN (${GLOBAL_ID_INCLUDE_DOWN},${GLOBAL_ID_INCLUDE_UP},${GLOBAL_ID_INCLUDE_NODE}) AND
    mpInclude."to_id" IN (NEW.type_id, ${GLOBAL_ID_ANY}) AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = ${GLOBAL_ID_TREE} AND
    ((groupid != 0 AND groupid = mpGroup."id") OR groupid = 0)
    ) LOOP`,
  iteratorInsertEnd: 'END LOOP;',
  groupInsert: 'groupRow."id"',
  iteratorDeleteDeclare: 'groupRow RECORD;',
  iteratorDeleteBegin: `FOR groupRow IN (
    SELECT
    mpGroup.*
    FROM
    ${LINKS_TABLE_NAME} as mpGroup,
    ${LINKS_TABLE_NAME} as mpInclude
    WHERE
    mpInclude."type_id" IN (${GLOBAL_ID_INCLUDE_DOWN},${GLOBAL_ID_INCLUDE_UP},${GLOBAL_ID_INCLUDE_NODE}) AND
    mpInclude."to_id" IN (OLD.type_id, ${GLOBAL_ID_ANY}) AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = ${GLOBAL_ID_TREE}
  ) LOOP`,
  iteratorDeleteEnd: 'END LOOP;',
  groupDelete: 'groupRow."id"',

  // TODO optimize duplicating equal selects

  isAllowSpreadFromCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${GLOBAL_ID_INCLUDE_DOWN}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
  )`,
  isAllowSpreadCurrentTo: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${GLOBAL_ID_INCLUDE_DOWN}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
    AND
    EXISTS (SELECT * FROM ${LINKS_TABLE_NAME} as child, ${LINKS_TABLE_NAME} as include WHERE
      child."id" = CURRENT."to_id" AND
      include."type_id" IN (${GLOBAL_ID_INCLUDE_DOWN},${GLOBAL_ID_INCLUDE_UP},${GLOBAL_ID_INCLUDE_NODE}) AND
      include."from_id" = groupRow.id AND
      include."to_id" IN (child.type_id, ${GLOBAL_ID_ANY})
    )
  )`,

  isAllowSpreadToCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = ${GLOBAL_ID_INCLUDE_UP} AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
  )`,
  isAllowSpreadCurrentFrom: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = ${GLOBAL_ID_INCLUDE_UP} AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
    AND
    EXISTS (SELECT * FROM ${LINKS_TABLE_NAME} as child, ${LINKS_TABLE_NAME} as include WHERE
      child."id" = CURRENT."from_id" AND
      include."type_id" IN (${GLOBAL_ID_INCLUDE_DOWN},${GLOBAL_ID_INCLUDE_UP},${GLOBAL_ID_INCLUDE_NODE}) AND
      include."from_id" = groupRow.id AND
      include."to_id" IN (child.type_id, ${GLOBAL_ID_ANY})
    )
  )`,

  isAllowSpreadToInCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = ${GLOBAL_ID_INCLUDE_DOWN} AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${GLOBAL_ID_ANY})
  )`,
  isAllowSpreadCurrentFromOut: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = ${GLOBAL_ID_INCLUDE_DOWN} AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${GLOBAL_ID_ANY})
  )`,

  isAllowSpreadFromOutCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = ${GLOBAL_ID_INCLUDE_UP} AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${GLOBAL_ID_ANY})
  )`,
  isAllowSpreadCurrentToIn: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = ${GLOBAL_ID_INCLUDE_UP} AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${GLOBAL_ID_ANY})
  )`,
});

export const up = async () => {
  log('up');
  await upTable({
    MP_TABLE: MP_TABLE_NAME, customColumns: '',
    api,
  });
  await upRels({
    SCHEMA,
    MP_TABLE: MP_TABLE_NAME,
    GRAPH_TABLE: LINKS_TABLE_NAME,
    api,
  });
  await api.sql(trigger.upFunctionInsertNode());
  await api.sql(trigger.upFunctionDeleteNode());
  await api.sql(trigger.upTriggerDelete());
  await api.sql(trigger.upTriggerInsert());
  await api.sql(sql`select create_btree_indexes_for_all_columns('${SCHEMA}', '${MP_TABLE_NAME}');`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__insert__function() RETURNS TRIGGER AS $trigger$ BEGIN
    IF (NEW."type_id" IN (${GLOBAL_ID_INCLUDE_DOWN},${GLOBAL_ID_INCLUDE_UP},${GLOBAL_ID_INCLUDE_NODE})) THEN
      PERFORM ${MP_TABLE_NAME}__insert_link__function_core(${LINKS_TABLE_NAME}.*, NEW."from_id")
      FROM ${LINKS_TABLE_NAME} WHERE type_id=NEW."to_id" OR NEW."to_id"=${GLOBAL_ID_ANY};
    END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__delete__function() RETURNS TRIGGER AS $trigger$
  DECLARE groupRow RECORD;
  BEGIN
    -- if delete link - is group include link
    IF (OLD."type_id" IN (${GLOBAL_ID_INCLUDE_DOWN},${GLOBAL_ID_INCLUDE_UP},${GLOBAL_ID_INCLUDE_NODE})) THEN
      SELECT ${LINKS_TABLE_NAME}.* INTO groupRow FROM ${LINKS_TABLE_NAME} WHERE "id"=OLD."from_id" AND "type_id" = ${GLOBAL_ID_TREE};
      PERFORM ${MP_TABLE_NAME}__delete_link__function_core(${LINKS_TABLE_NAME}.*, groupRow)
      FROM ${LINKS_TABLE_NAME} WHERE type_id=OLD."to_id" OR OLD."to_id"=${GLOBAL_ID_ANY};
    END IF;
    RETURN OLD;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__insert__trigger AFTER INSERT ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__insert__function();`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__delete__trigger AFTER DELETE ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__delete__function();`);
};

export const down = async () => {
  log('down');
  log('dropInclude');
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__insert__function CASCADE;`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__delete__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__insert__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__delete__trigger ON "${LINKS_TABLE_NAME}";`);
  log('dropRels');
  await downRels({
    MP_TABLE: MP_TABLE_NAME,
    GRAPH_TABLE: LINKS_TABLE_NAME,
    api,
  });
  log('dropTrigger');
  await api.sql(trigger.downFunctionInsertNode());
  await api.sql(trigger.downFunctionDeleteNode());
  await api.sql(trigger.downTriggerDelete());
  await api.sql(trigger.downTriggerInsert());
  log('dropTable');
  await downTable({
    MP_TABLE: MP_TABLE_NAME,
    api,
  });
};
