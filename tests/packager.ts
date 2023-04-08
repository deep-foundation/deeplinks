import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import { gql } from "@apollo/client";
import { PackageItem, Packager, sort } from "../imports/packager";
import type { Package } from "../imports/packager";
import { minilinks } from "../imports/minilinks";
import { packagerInstallCore, packagerPublishCore } from "../imports/router/packager";
import Debug from 'debug';

const debug = Debug('deeplinks:tests:packager');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const GIST_URL = process.env.GIST_URL;

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

describe('packager', () => {
  describe('class', () => {
    it('export import', async () => {
      const packager = new Packager(deep);
      const namespace = await deep.select({
        type_id: await deep.id('@deep-foundation/core','PackageNamespace'),
        string: { value: { _eq: '@deep-foundation/test' } },
      });
      const { data: [{ id: packageId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Package'),
        string: { data: { value: '@deep-foundation/test' } },
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'PackageVersion'),
          string: { data: { value: '0.0.0' } },
          ...(
            namespace?.data?.[0]
            ? {
              from_id: namespace?.data?.[0]?.id,
            }
            : {
              from: { data: {
                type_id: await deep.id('@deep-foundation/core', 'PackageNamespace'),
                string: { data: { value: '@deep-foundation/test' } },
              } },
            }
          ),
        } },
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            string: { data: { value: 'item' } },
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Type'),
              from_id: await deep.id('@deep-foundation/core', 'Any'),
              to_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
            } },
          },
        ] },
      });
      assert(!!packageId, '!packageId');
      const exported = await packager.export({ packageLinkId: packageId });
      assert(!exported.errors?.length, '!!exported.errors.length');
      const imported = await packager.import(exported);
      assert(!imported.errors?.length, '!!imported.errors.length');
      const results = await deep.select({ id: { _in: imported?.ids } });
      const ml = minilinks(results.data);
      assert(+ml.links.length === +imported.ids.length, 'ml.links.length !== imported.ids.length');
      // TODO best valid checker
    });
  });
  describe('sorting', () => {
    const references = {
      id: 'id',
      from: 'from',
      to: 'to',
      type: 'type',
    };
    it.only('strict mode: no sorting', () => {
      const data: PackageItem[] = [
        { id: 3, value: { value: 'three' }  },
        { id: 1, value: { value: 'one' } },
        { id: 2, value: { value: 'two' } },
      ];
      const pckg: Package = { package: { name: 'test'}, data, strict: true };
  
      const expectedResult = [
        { id: 3, value: { value: 'three' } },
        { id: 1, value: { value: 'one' } },
        { id: 2, value: { value: 'two' } },
      ];
  
      const result = sort(pckg, data, [], references);
      expect(result.sorted).toEqual(expectedResult);
    });
    it.only('sorting with package, value, and dependencies', () => {
      const data: PackageItem[] = [
        { id: 1, package: { dependencyId: 1, containValue: "1" } },
        { id: 2, value: { value: 'two' } },
        { id: 3, from: 2, to: 4 },
        { id: 4, value: { value: 'four' } },
        { id: 5, type: 3 },
        { id: 6, package: { dependencyId: 2, containValue: "2" } },
      ];
      const pckg: Package = { package: { name: 'test'}, data, strict: true };
      const expectedResult = [
        { id: 6, package: { dependencyId: 2, containValue: "2" } },
        { id: 1, package: { dependencyId: 1, containValue: "1" } },
        { id: 2, value: { value: 'two' } },
        { id: 4, value: { value: 'four' } },
        { id: 3, from: 2, to: 4 },
        { id: 5, type: 3 },
      ];
  
      const result = sort(pckg, data, [], references);
      expect(result.sorted).toEqual(expectedResult);
    });
  });
  if (GIST_URL) {
    describe('links', () => {
      it(`install and publish`, async () => {
        const { linkId, token } = await deep.jwt({ linkId: await deep.id('deep', 'admin') });
        const admin = new DeepClient({ deep, token, linkId });

        // insert query
        const { data: [{ id: packageQueryId1 }] } = await admin.insert({
          type_id: await admin.id('@deep-foundation/core', 'PackageQuery'),
          string: { data: { value: GIST_URL } },
        });
        // initiate installation
        const { data: [{ id: packageInstallId1 }] } = await admin.insert({
          type_id: await admin.id('@deep-foundation/core', 'PackageInstall'),
          from_id: admin.linkId, // actual user only can be here
          to_id: packageQueryId1,
        });
        // you can await promise of all operations about this link
        await admin.await(packageInstallId1);

        const { data: [{ id: packageId }] } = await admin.select({
          type_id: await admin.id('@deep-foundation/core', 'Package'),
          in: {
            type_id: await admin.id('@deep-foundation/core', 'PromiseOut'),
            from: {
              in: {
                type_id: await admin.id('@deep-foundation/core', 'Then'),
                from_id: packageInstallId1,
              }
            },
          },
        });

        // insert query
        const { data: [{ id: packageQueryId2 }] } = await admin.insert({
          type_id: await admin.id('@deep-foundation/core', 'PackageQuery'),
          string: { data: { value: GIST_URL } },
        });
        // initiate installation
        const { data: [{ id: packagePublishId }] } = await admin.insert({
          type_id: await admin.id('@deep-foundation/core', 'PackagePublish'),
          from_id: packageId,
          to_id: packageQueryId2,
        });
        // you can await promise of all operations about this link
        await admin.await(packagePublishId);
      });
    });
    describe('core', () => {
      it(`install then publish old`, async () => {
        // insert query
        const imported = await packagerInstallCore([], GIST_URL);
        if (imported.errors?.length) {
          log(JSON.stringify(imported, null, 2));
          throw new Error('!!errors?.length');
        }
        // insert query
        const exported = await packagerPublishCore([], GIST_URL, imported.packageId);
        if (exported?.errors?.length) {
          log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
      it(`install then publish new`, async () => {
        // insert query
        const address = GIST_URL.split('/').slice(0, -1).join('/');
        const imported = await packagerInstallCore([], GIST_URL);
        if (imported?.errors?.length) {
          log(JSON.stringify(imported, null, 2));
          throw new Error('!!imported.data.errors');
        }
        const exported = await packagerPublishCore([], address, imported.packageId);
        if (exported?.errors?.length) {
          log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
    });
    describe('gql', () => {
      it(`install then publish old`, async () => {
        // insert query
        const { data: { packager_install: imported } } = await deep.apolloClient.query({
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
        if (imported.errors?.length) {
          log(JSON.stringify(imported, null, 2));
          throw new Error('!!errors?.length');
        }
        // insert query
        // const exported = await packagerPublishCore([], GIST_URL, imported.packageId);
        const { data: { packager_publish: exported } } = await deep.apolloClient.query({
          query: gql`query PACKAGE_PUBLISH($address: String!, $id: Int) {
            packager_publish(input: { address: $address, id: $id }) {
              address
              errors
            }
          }`,
          variables: {
            address: GIST_URL,
            id: imported?.packageId,
          },
        });
        if (exported?.errors?.length) {
          log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
      it(`install then publish new`, async () => {
        // insert query
        const address = GIST_URL.split('/').slice(0, -1).join('/');
        // const imported = await packagerInstallCore([], GIST_URL);
        // insert query
        const { data: { packager_install: imported } } = await deep.apolloClient.query({
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
        if (imported?.errors?.length) {
          log(JSON.stringify(imported, null, 2));
          throw new Error('!!imported.data.errors');
        }
        // const exported = await packagerPublishCore([], address, imported.packageId);
        // insert query
        const { data: { packager_publish: exported } } = await deep.apolloClient.query({
          query: gql`query PACKAGE_PUBLISH($address: String!, $id: Int) {
            packager_publish(input: { address: $address, id: $id }) {
              address
              errors
            }
          }`,
          variables: {
            address: address,
            id: imported?.packageId,
          },
        });
        if (exported?.errors?.length) {
          log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
    });
  }
});