import Debug from 'debug';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { generateDown, generateUp } from '../imports/type-table';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { DeepClient } from '../imports/client';

const debug = Debug('deeplinks:migrations:type-table-bool-exp');

export const TABLE_NAME = 'bool_exp';

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export const up = async () => {
  debug('up');
  await (generateUp({
    schemaName: SCHEMA,
    tableName: TABLE_NAME,
    customColumnsSql: 'gql text, sql text',
    linkRelation: 'bool_exp',
    linksTableName: LINKS_TABLE_NAME,
    api,
    deep,
  })());
  await api.query({
    type: 'create_event_trigger',
    args: {
      name: 'bool_exp',
      table: TABLE_NAME,
      webhook: `${process.env.DEEPLINKS_URL}/api/bool_exp`,
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
  await api.query({
    type: 'delete_event_trigger',
    args: {
      name: 'bool_exp',
    },
  });
  await (generateDown({
    schemaName: SCHEMA,
    tableName: TABLE_NAME,
    customColumnsSql: 'gql text, sql text',
    linkRelation: 'bool_exp',
    linksTableName: LINKS_TABLE_NAME,
    api,
    deep,
  })());
};