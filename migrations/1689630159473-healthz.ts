import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { api, SCHEMA } from './1616701513782-links.js';

const debug = Debug('deeplinks:migrations:healthz');
const log = debug.extend('log');
const error = debug.extend('error');

export const HEALTHZ_VIEW_NAME = 'healthz';

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export const up = async () => {
  log('up');
  log('view');

  await api.sql(sql`CREATE VIEW ${HEALTHZ_VIEW_NAME} AS SELECT 'ok'::text as "status";`);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: HEALTHZ_VIEW_NAME,
    },
  });
  await api.query({
    type: 'create_select_permission',
    args: {
      table: HEALTHZ_VIEW_NAME,
      role: 'undefined',
      permission: {
        columns: '*',
        filter: {},
        limit: 999,
        allow_aggregations: true
      }
    }
  });
};

export const down = async () => {
  log('down');
  log('view');
  await api.query({
    type: 'drop_select_permission',
    args: {
      table: HEALTHZ_VIEW_NAME,
      role: 'undefined',
    }
  });
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: HEALTHZ_VIEW_NAME,
      },
      cascade: true,
    },
  });
  await api.sql(sql`
    DROP VIEW IF EXISTS ${HEALTHZ_VIEW_NAME} CASCADE;
  `);
};