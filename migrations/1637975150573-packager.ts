import { HasuraApi } from '@deep-foundation/hasura/api';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { DeepClient } from '../imports/client';
import { typeDefsString } from '../imports/router/packager';

const debug = Debug('deeplinks:migrations:packager');
const log = debug.extend('log');
const error = debug.extend('error');

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

  await deep.insert({ 
    type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
    string: { data: { value: 
`async ({ deep, gql, data: { newLink, promiseId } }) => {
  const query = await deep.select({
    id: newLink.to_id,
    type_id: await deep.id('@deep-foundation/core', 'PackagerQuery'),
  });
  const address = query?.data?.[0]?.value?.value;
  if (!address) {
    return { error: 'No address' };
  }
  const result = await deep.apolloClient.query({
    query: gql\`query PACKAGE_INSTALL($address: String!) {
      packager_install(input: { address: $address }) {
        ids
        packageId
        errors
      }
    }\`,
    variables: {
      address,
    },
  });
  if (result?.data?.packager_install?.errors?.length) return result?.data?.packager_install;
  await deep.insert({
    type_id: await deep.id('@deep-foundation/core', 'PromiseOut'),
    from_id: promiseId,
    to_id: result?.data?.packager_install?.packageId,
    string: { data: { value: 'package' } },
  });
  return result?.data?.packager_install;
}`
    } },
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
    string: { data: { value:
`async ({ deep, gql, data: { newLink, promiseId } }) => {
  try {
    const query = await deep.select({
      id: newLink.to_id,
      type_id: await deep.id('@deep-foundation/core', 'PackagerQuery'),
    });
    const address = query?.data?.[0]?.value?.value;
    if (!address) {
      return { error: 'No address' };
    }
    const id = newLink.from_id;
    const result = await deep.apolloClient.query({
      query: gql\`query PACKAGE_PUBLISH($address: String!, $id: Int) {
        packager_publish(input: { address: $address, id: $id }) {
          address
          errors
        }
      }\`,
      variables: {
        address,
        id,
      },
    });
    if (!result?.data?.packager_publish || result?.data?.packager_publish?.errors?.length) return result;
    const newAddress = result?.data?.packager_publish?.address;
    const out = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'PromiseOut'),
      from_id: promiseId,
      ...(
          newAddress != address
          ? { to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'PackagerQuery'),
              string: { data: { value: newAddress } },
          } } }
          : { to_id: query?.data?.[0]?.id }
      ),
      string: { data: { value: 'package' } },
    });
    return result?.data?.packager_publish;
  } catch(e) {
    return e;
  }
}`
    } },
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
  log('down');
  await api.query({
    type: 'remove_remote_schema',
    args: {
      name: 'packager',
    },
  });
};
