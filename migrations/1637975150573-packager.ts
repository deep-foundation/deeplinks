import { HasuraApi } from '@deep-foundation/hasura/api';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { DeepClient } from '../imports/client';
import { typeDefsString } from '../imports/router/packager';

const debug = Debug('deeplinks:migrations:packager');

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

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

  await deep.insert({ 
    type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
    string: { data: { value: `
    async ({ deep, gql, data: { promiseId } }) => {
      const result = await deep.apolloClient.query({
        query: gql\`query PACKAGE_INSTALL {
          packager_install(input: {address: "4cf14e3e58f4e96f7e7914b963ecdd29", type: "gist", version: "0.0.1"}) {
            ids
            packageId
            errors
          }
        }\`,
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'PromiseOut'),
        from_id: promiseId,
        to_id: result?.data?.packager_install?.packageId,
        string: { data: { value: 'package' } },
      });
      return result?.data?.packager_install;
    }
  ` } },
    in: { data: {
      type_id: await deep.id('@deep-foundation/core', 'Handler'),
      from_id: await deep.id('@deep-foundation/core', 'dockerSupportsJs'),
      in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'HandleInsert'),
          from_id: await deep.id('@deep-foundation/core', 'PackagerInstall'),
      } },
    } },
  }, { name: 'HANDLE_INSERT_INSTALL_HANDLER' });

  await deep.insert({ 
    type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
    string: { data: { value: `(arg) => {console.log(arg); return {result: 7}}` } },
    in: { data: {
      type_id: await deep.id('@deep-foundation/core', 'Handler'),
      from_id: await deep.id('@deep-foundation/core', 'dockerSupportsJs'),
      in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'HandleInsert'),
          from_id: await deep.id('@deep-foundation/core', 'PackagerPublish'),
      } },
    } },
  }, { name: 'HANDLE_INSERT_PUBLISH_HANDLER' });
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
  debug('down');
  await api.query({
    type: 'remove_remote_schema',
    args: {
      name: 'packager',
    },
  });
};
