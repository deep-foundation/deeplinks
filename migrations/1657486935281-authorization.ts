import { HasuraApi } from '@deep-foundation/hasura/api.js';
import Debug from 'debug';
import { typeDefsString as as } from '../imports/router/authorization.js';

const debug = Debug('deeplinks:migrations:authorization');
const log = debug.extend('log');
const error = debug.extend('error');

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const up = async () => {
  log('up');
  await api.query({
    type: 'add_remote_schema',
    args: {
      name: 'authorization',
      definition: {
        url: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/authorization`,
        headers: [{ name: 'x-hasura-client', value: 'deeplinks-authorization' }],
        forward_client_headers: true,
        timeout_seconds: 120
      },
    }
  });
  await api.metadata({
    type: "add_remote_schema_permissions",
    args: {
      remote_schema: 'authorization',
      role: 'link',
      definition: {
        schema: as,
      },
    },
  });
  await api.metadata({
    type: "add_remote_schema_permissions",
    args: {
      remote_schema: 'authorization',
      role: 'undefined',
      definition: {
        schema: as,
      },
    },
  });
};

export const down = async () => {
  log('down');
  await api.query({
    type: 'remove_remote_schema',
    args: {
      name: 'authorization',
    },
  });
};
