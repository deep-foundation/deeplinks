import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import { gql } from "@apollo/client";
import { Packager } from "../imports/packager";

const GIST_URL = process.env.GIST_URL;

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const root = new DeepClient({ apolloClient });

let adminToken: string;
let deep: any;

beforeAll(async () => {
  const { linkId, token } = await root.jwt({ linkId: await root.id('@deep-foundation/core', 'system', 'admin') });
  adminToken = token;
  deep = new DeepClient({ deep: root, token: adminToken, linkId });
});

const demoPackage = {
  "package": {
    "name": "gist-package-test",
    "version": "0.0.1"
  },
  "data": [
    {
      "id": 1,
      "package": {
        "dependencyId": 1,
        "containValue": "Any"
      }
    },
    {
      "id": "1",
      "type": "1",
      "from": 8,
      "to": 8
    },
    {
      "id": "2",
      "type": "1",
      "value": { "value": "File" }
    }
  ],
  "errors": [],
  "dependencies": { "1": { "name": "@deep-foundation/core" } }
};

describe('packager', () => {
  describe('class', () => {
    it('export', async () => {
      const packager = new Packager(deep);
      const { ids, errors, packageId } = await packager.import(demoPackage);
      const exported = await packager.export({ packageLinkId: packageId });
      console.log(exported);
    });
  });
  if (GIST_URL) {
    describe.skip('links', () => {
      // it(`install`, async () => {
      //   // insert query
      //   const { data: [{ id: packageQueryId }] } = await deep.insert({
      //     type_id: await deep.id('@deep-foundation/core', 'PackagerQuery'),
      //     string: { data: { value: GIST_URL } },
      //   });
      //   // initiate installation
      //   const { data: [{ id: packageInstallId }] } = await deep.insert({
      //     type_id: await deep.id('@deep-foundation/core', 'PackagerInstall'),
      //     from_id: deep.linkId, // actual user only can be here
      //     to_id: packageQueryId,
      //   });
      //   // you can await promise of all operations about this link
      //   await deep.await(packageInstallId);
      // });
      // it(`publish`, async () => {
      //   // insert query
      //   const { data: [{ id: packageQueryId1 }] } = await deep.insert({
      //     type_id: await deep.id('@deep-foundation/core', 'PackagerQuery'),
      //     string: { data: { value: GIST_URL } },
      //   });
      //   // initiate installation
      //   const { data: [{ id: packageInstallId1 }] } = await deep.insert({
      //     type_id: await deep.id('@deep-foundation/core', 'PackagerInstall'),
      //     from_id: deep.linkId, // actual user only can be here
      //     to_id: packageQueryId1,
      //   });
      //   // you can await promise of all operations about this link
      //   await deep.await(packageInstallId1);

      //   console.log({
      //     type_id: await deep.id('@deep-foundation/core', 'PackagerPackage'),
      //     in: {
      //       type_id: await deep.id('@deep-foundation/core', 'PromiseOut'),
      //       from: {
      //         in: {
      //           type_id: await deep.id('@deep-foundation/core', 'Then'),
      //           from_id: packageInstallId1,
      //         }
      //       },
      //     },
      //   });
      //   const { data: [{ id: packageId }] } = await deep.select({
      //     type_id: await deep.id('@deep-foundation/core', 'PackagerPackage'),
      //     in: {
      //       type_id: await deep.id('@deep-foundation/core', 'PromiseOut'),
      //       from: {
      //         in: {
      //           type_id: await deep.id('@deep-foundation/core', 'Then'),
      //           from_id: packageInstallId1,
      //         }
      //       },
      //     },
      //   });

      //   // insert query
      //   const { data: [{ id: packageQueryId2 }] } = await deep.insert({
      //     type_id: await deep.id('@deep-foundation/core', 'PackagerQuery'),
      //     string: { data: { value: GIST_URL } },
      //   });
      //   // initiate installation
      //   const { data: [{ id: packagePublishId }] } = await deep.insert({
      //     type_id: await deep.id('@deep-foundation/core', 'PackagerPublish'),
      //     from_id: packageId,
      //     to_id: packageQueryId2,
      //   });
      //   // you can await promise of all operations about this link
      //   await deep.await(packagePublishId);
      // });
    });
    describe('gql', () => {
      it.skip(`install`, async () => {
        // insert query
        const imported = await deep.apolloClient.query({
          query: gql`query PACKAGE_INSTALL($address: String!) {
            packager_install(input: { address: $address }) {
              ids
              packageId
              errors
            }
          }`,
          variables: {
            address: GIST_URL
          },
        });
        if (imported.data?.packager_install?.errors.length) {
          console.log(JSON.stringify(imported, null, 2));
          throw new Error('!!imported.data.errors');
        }
      });
      it(`publish old`, async () => {
        // insert query
        const imported = await deep.apolloClient.query({
          query: gql`query PACKAGE_INSTALL($address: String!) {
            packager_install(input: { address: $address }) {
              ids
              packageId
              errors
            }
          }`,
          variables: {
            address: GIST_URL
          },
        });
        if (imported.data?.errors?.length) {
          console.log(JSON.stringify(imported, null, 2));
          throw new Error('!!imported.data.errors');
        }
        console.log(JSON.stringify(imported, null, 2));
        // insert query
        const exported = await deep.apolloClient.query({
          query: gql`query PACKAGE_PUBLISH($address: String!, $id: Int) {
            packager_publish(input: { address: $address, id: $id }) {
              address
              errors
            }
          }`,
          variables: {
            address: GIST_URL,
            id: imported.data?.packager_install?.packageId,
          },
        });
        if (exported.data?.packager_install?.errors?.length) {
          console.log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
      it.skip(`publish new`, async () => {
        const address = GIST_URL.split('/').slice(0, -1).join('/');
        // insert query
        const imported = await deep.apolloClient.query({
          query: gql`query PACKAGE_INSTALL($address: String!) {
            packager_install(input: { address: $address }) {
              ids
              packageId
              errors
            }
          }`,
          variables: {
            address: GIST_URL
          },
        });
        if (imported.data?.errors?.length) {
          console.log(JSON.stringify(imported, null, 2));
          throw new Error('!!imported.data.errors');
        }
        console.log(JSON.stringify(imported, null, 2));
        // insert query
        const exported = await deep.apolloClient.query({
          query: gql`query PACKAGE_PUBLISH($address: String!, $id: Int) {
            packager_publish(input: { address: $address, id: $id }) {
              address
              errors
            }
          }`,
          variables: {
            address: address,
            id: imported.data?.packager_install?.packageId,
          },
        });
        if (exported.data?.packager_publish?.errors?.length) {
          console.log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
    });
  }
});