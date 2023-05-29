import { HasuraApi } from '@deep-foundation/hasura/api.js';
import Debug from 'debug';
import { typeDefsString as gs } from '../imports/router/guest.js';
import { typeDefsString as js } from '../imports/router/jwt.js';

const debug = Debug('deeplinks:migrations:jwt');
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
      name: 'jwt',
      definition: {
        url: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/jwt`,
        headers: [{ name: 'x-hasura-client', value: 'deeplinks-jwt' }],
        forward_client_headers: true,
        timeout_seconds: 120
      },
    }
  });
  await api.query({
    type: 'add_remote_schema',
    args: {
      name: 'guest',
      definition: {
        url: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/guest`,
        headers: [{ name: 'x-hasura-client', value: 'deeplinks-guest' }],
        forward_client_headers: true,
        timeout_seconds: 60
      },
    }
  });
  await api.metadata({
    type: "add_remote_schema_permissions",
    args: {
      remote_schema: 'guest',
      role: 'link',
      definition: {
        schema: gs,
      },
    },
  });
  await api.metadata({
    type: "add_remote_schema_permissions",
    args: {
      remote_schema: 'guest',
      role: 'undefined',
      definition: {
        schema: gs,
      },
    },
  });
  await api.metadata({
    type: "add_remote_schema_permissions",
    args: {
      remote_schema: 'jwt',
      role: 'link',
      definition: {
        schema: js,
      },
    },
  });
  await api.metadata({
    type: "add_remote_schema_permissions",
    args: {
      remote_schema: 'jwt',
      role: 'undefined',
      definition: {
        schema: js,
      },
    },
  });
};

export const down = async () => {
  log('down');
  await api.query({
    type: 'remove_remote_schema',
    args: {
      name: 'jwt',
    },
  });
  await api.query({
    type: 'remove_remote_schema',
    args: {
      name: 'guest',
    },
  });
};
