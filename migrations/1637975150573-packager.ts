import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { typeDefsString } from '../imports/router/packager.js';

const debug = Debug('deeplinks:migrations:packager');
const log = debug.extend('log');
const error = debug.extend('error');

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

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
  await api.query({
    type: 'add_remote_schema',
    args: {
      name: 'packager',
      definition: {
        url: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/packager`,
        headers: [{ name: 'x-hasura-client', value: 'deeplinks-packager' }],
        forward_client_headers: true,
        timeout_seconds: 60
      },
    }
  });
  await api.metadata({
    type: "add_remote_schema_permissions",
    args: {
      remote_schema: 'packager',
      role: 'link',
      definition: {
        schema: typeDefsString,
      },
    },
  });
};

export const down = async () => {
  log('down');
  await api.query({
    type: 'remove_remote_schema',
    args: {
      name: 'packager',
    },
  });
};
