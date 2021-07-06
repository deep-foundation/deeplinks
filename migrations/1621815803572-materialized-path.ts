import { generateApolloClient } from '@deepcase/hasura/client';
import Debug from 'debug';
import { up as upTable, down as downTable } from '@deepcase/materialized-path/table';
import { up as upRels, down as downRels } from '@deepcase/materialized-path/relationships';
import { Trigger } from '@deepcase/materialized-path/trigger';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { permissions } from '../imports/permission';

const debug = Debug('deepcase:deepgraph:migrations:materialized-path');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const MP_TABLE_NAME = 'dc_dg_mp';

const trigger = Trigger({
  mpTableName: MP_TABLE_NAME,
  graphTableName: LINKS_TABLE_NAME,
  id_type: 'bigint',
  iteratorInsertDeclare: 'groupRow RECORD;',
  iteratorInsertBegin: `FOR groupRow IN (
    SELECT
    mpGroup.*
    FROM
    ${LINKS_TABLE_NAME} as mpGroup,
    ${LINKS_TABLE_NAME} as mpInclude
    WHERE
    mpInclude."type_id" = 22 AND
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
    mpInclude."type_id" = 22 AND
    mpInclude."to_id" = OLD.type_id AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = 21
  ) LOOP`,
  iteratorDeleteEnd: 'END LOOP;',
  groupDelete: 'groupRow."id"',
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
  await permissions(api, LINKS_TABLE_NAME, {"_or":[{"type_id":{"_eq":"14"}},{"type_id":{"_eq":"1"}},{"_by_item":{"_and":[{"path_item":{"_and":[{"type_id":{"_eq":11}},{"from":{"_and":[{"out":{"_and":[{"type_id":{"_eq":10}},{"_by_path_item":{"item_id":{"_eq":"X-Hasura-User-Id"}}}]}},{"type_id":{"_eq":9}}]}}]}}]}},{"_by_item":{"path_item_id":{"_eq":"X-Hasura-User-Id"}}}]});
  await api.sql(trigger.upFunctionIsRoot());
  await api.sql(trigger.upFunctionWillRoot());
  await api.sql(trigger.upFunctionInsertNode());
  await api.sql(trigger.upFunctionDeleteNode());
  await api.sql(trigger.upTriggerDelete());
  await api.sql(trigger.upTriggerInsert());
};

export const down = async () => {
  debug('down');
  await api.sql(trigger.downTriggerDelete());
  await api.sql(trigger.downTriggerInsert());
  await api.sql(trigger.downFunctionInsertNode());
  await api.sql(trigger.downFunctionDeleteNode());
  await api.sql(trigger.downFunctionIsRoot());
  await api.sql(trigger.downFunctionWillRoot());
  await downRels({
    MP_TABLE: MP_TABLE_NAME,
    GRAPH_TABLE: LINKS_TABLE_NAME,
  });
  await downTable({
    MP_TABLE: MP_TABLE_NAME,
  });
};
