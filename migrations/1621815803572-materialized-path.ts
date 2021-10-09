import { generateApolloClient } from '@deepcase/hasura/client';
import Debug from 'debug';
import { up as upTable, down as downTable } from '@deepcase/materialized-path/table';
import { up as upRels, down as downRels } from '@deepcase/materialized-path/relationships';
import { Trigger } from '@deepcase/materialized-path/trigger';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { generatePermissionWhere, permissions } from '../imports/permission';
import { sql } from '@deepcase/hasura/sql';

const debug = Debug('deepcase:deeplinks:migrations:materialized-path');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
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
    mpGroup.*
    FROM
    ${LINKS_TABLE_NAME} as mpGroup,
    ${LINKS_TABLE_NAME} as mpInclude
    WHERE
    mpInclude."type_id" IN (22,23,24) AND
    mpInclude."to_id" = NEW.type_id AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = 21
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
    mpInclude."type_id" IN (22,23,24) AND
    mpInclude."to_id" = OLD.type_id AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = 21
  ) LOOP`,
  iteratorDeleteEnd: 'END LOOP;',
  groupDelete: 'groupRow."id"',

  // TODO optimize duplicating equal selects

  isAllowSpreadFromCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = 22 AND
    l.from_id = groupRow.id AND
    l.to_id = CURRENT.id
  )`,
  isAllowSpreadCurrentTo: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = 22 AND
    l.from_id = groupRow.id AND
    l.to_id = CURRENT.id
  )`,

  isAllowSpreadToCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = 23 AND
    l.from_id = groupRow.id AND
    l.to_id = CURRENT.id
  )`,
  isAllowSpreadCurrentFrom: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = 23 AND
    l.from_id = groupRow.id AND
    l.to_id = CURRENT.id
  )`,

  isAllowSpreadToInCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = 23 AND
    l.from_id = groupRow.id AND
    l.to_id = flowLink.id
  )`,
  isAllowSpreadCurrentFromOut: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = 23 AND
    l.from_id = groupRow.id AND
    l.to_id = flowLink.id
  )`,

  isAllowSpreadFromOutCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = 23 AND
    l.from_id = groupRow.id AND
    l.to_id = flowLink.id
  )`,
  isAllowSpreadCurrentToIn: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id = 23 AND
    l.from_id = groupRow.id AND
    l.to_id = flowLink.id
  )`,
});

export const up = async () => {
  debug('up');
  await upTable({
    MP_TABLE: MP_TABLE_NAME,
  });
  await upRels({
    MP_TABLE: MP_TABLE_NAME,
    GRAPH_TABLE: LINKS_TABLE_NAME,
  });
  await permissions(api, MP_TABLE_NAME);
  await permissions(api, LINKS_TABLE_NAME, {
    select: generatePermissionWhere(15),
    insert: {}, // generatePermissionWhere(16),
    update: {}, // generatePermissionWhere(17),
    delete: generatePermissionWhere(18),
  });
  await api.sql(trigger.upFunctionInsertNode());
  await api.sql(trigger.upFunctionDeleteNode());
  await api.sql(trigger.upTriggerDelete());
  await api.sql(trigger.upTriggerInsert());
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__insert__function() RETURNS TRIGGER AS $trigger$ BEGIN
    IF ([23,24,25].includes(NEW."type_id")) THEN
      PERFORM ${MP_TABLE_NAME}__insert_link__function_core(${LINKS_TABLE_NAME}.*)
      FROM ${LINKS_TABLE_NAME} WHERE type_id=NEW."to_id";
    END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__delete__function() RETURNS TRIGGER AS $trigger$
  DECLARE groupRow RECORD;
  BEGIN
    -- if delete link - is group include link
    IF ([23,24,25].includes(OLD."type_id")) THEN
      SELECT ${LINKS_TABLE_NAME}.* INTO groupRow FROM ${LINKS_TABLE_NAME} WHERE "id"=OLD."from_id" AND "type_id" = 21;
      PERFORM ${MP_TABLE_NAME}__delete_link__function_core(${LINKS_TABLE_NAME}.*, groupRow)
      FROM ${LINKS_TABLE_NAME} WHERE type_id=OLD."to_id";
    END IF;
    RETURN OLD;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__insert__trigger AFTER INSERT ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__insert__function();`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__delete__trigger AFTER DELETE ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__delete__function();`);
};

export const down = async () => {
  debug('down');
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__insert__function;`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__delete__function;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__insert__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__delete__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(trigger.downTriggerDelete());
  await api.sql(trigger.downTriggerInsert());
  await api.sql(trigger.downFunctionInsertNode());
  await api.sql(trigger.downFunctionDeleteNode());
  await downRels({
    MP_TABLE: MP_TABLE_NAME,
    GRAPH_TABLE: LINKS_TABLE_NAME,
  });
  await downTable({
    MP_TABLE: MP_TABLE_NAME,
  });
};
