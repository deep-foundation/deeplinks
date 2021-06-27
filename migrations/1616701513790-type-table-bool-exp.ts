import Debug from 'debug';
import { generateDown, generateUp } from '../imports/type-table';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';

const debug = Debug('deepcase:deepgraph:migrations:type-table-bool-exp');

export const TABLE_NAME = 'dc_dg_bool_exp';

export const up = async () => {
  debug('up');
  await (generateUp({
    schemaName: SCHEMA,
    tableName: TABLE_NAME,
    customColumnsSql: 'gql text, sql text',
    linkRelation: 'bool_exp',
    linksTableName: LINKS_TABLE_NAME,
    api,
  })());
  await api.query({
    type: 'create_event_trigger',
    args: {
      name: 'dc_dg_bool_exp',
      table: TABLE_NAME,
      webhook: `${process.env.MIGRATIONS_DEEPGRAPH_APP_URL}/api/eh/bool_exp`,
      insert: {
        columns: "*",
        payload: '*',
      },
      update: {
        columns: '*',
        payload: '*',
      },
      delete: {
        columns: '*'
      },
      replace: false,
    },
  });
};

export const down = async () => {
  debug('down');
  await (generateDown({
    schemaName: SCHEMA,
    tableName: TABLE_NAME,
    customColumnsSql: 'gql text, sql text',
    linkRelation: 'bool_exp',
    linksTableName: LINKS_TABLE_NAME,
    api,
  })());
  await api.query({
    type: 'delete_event_trigger',
    args: {
      name: 'dc_dg_bool_exp',
    },
  });
};