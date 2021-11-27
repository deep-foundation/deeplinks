import { HasuraApi } from '@deep-foundation/hasura/api';
import Debug from 'debug';

const debug = Debug('deeplinks:migrations:packager');

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const up = async () => {
  debug('up');
  await api.query({
    type: 'add_remote_schema',
    args: {
      name: 'packager',
      definition: {
        url: `${process.env.MIGRATIONS_DEEPLINKS_APP_URL}/api/packager`,
        headers: [{ name: 'x-hasura-client', value: 'deeplinks-packager' }],
        forward_client_headers: true,
        timeout_seconds: 60
      },
    }
  });
};

export const down = async () => {
  debug('down');
  await api.query({
    type: 'remove_remote_schema',
    args: {
      name: 'packager',
    },
  });
};
