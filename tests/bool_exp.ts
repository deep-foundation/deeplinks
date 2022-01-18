import { HasuraApi } from "@deep-foundation/hasura/api";
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { assert, expect } from 'chai';
import { applyBoolExpToLink } from "../imports/bool_exp";
import { DeepClient } from "../imports/client";
import { delay } from "../imports/promise";

export const api = new HasuraApi({
  path: process.env.HASURA_PATH,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
});

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
  // token: adminToken,
}, {
  ApolloClient: {
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
    },
  },
});

const deep = new DeepClient({ apolloClient });

describe('bool_exp', () => {
  describe('value convertation', () => {
    it(`insert separately`, async () => {
      const { data: [{ id: t1 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      const { data: [{ id: t2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      const { data: [{ id: boolExpId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
      });
      await deep.insert({
        link_id: boolExpId,
        value: { id: { _eq: t1 } },
      }, { table: 'objects' });
      await deep.await(boolExpId);
      await delay(2000);
      const { data: [{ value: sql }], error } = await deep.select({
        link_id: { _eq: boolExpId },
      }, { table: 'bool_exp', returning: 'id link_id value' });

      const { data: d1 } = await api.sql(applyBoolExpToLink(sql, t1));
      expect(+d1?.result?.[1]?.[0]).to.equal(1);
      const { data: d2 } = await api.sql(applyBoolExpToLink(sql, t2));
      expect(+d2?.result?.[1]?.[0]).to.equal(0);
    });
    it(`insert with link`, async () => {
      const { data: [{ id: t1 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      const { data: [{ id: t2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      const { data: [{ id: boolExpId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
        object: { data: { value: { id: { _eq: t1 } } } },
      });
      await deep.await(boolExpId);
      await delay(2000);
      const { data: [{ value: sql }], error } = await deep.select({
        link_id: { _eq: boolExpId },
      }, { table: 'bool_exp', returning: 'id link_id value' });

      const { data: d1 } = await api.sql(applyBoolExpToLink(sql, t1));
      expect(+d1?.result?.[1]?.[0]).to.equal(1);
      const { data: d2 } = await api.sql(applyBoolExpToLink(sql, t2));
      expect(+d2?.result?.[1]?.[0]).to.equal(0);
    });
    it(`update`, async () => {
      const { data: [{ id: t1 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      const { data: [{ id: t2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      const { data: [{ id: boolExpId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
        object: { data: { value: { id: { _eq: t1 } } } },
      });
      await deep.await(boolExpId);
      await delay(2000);
      await deep.update({ link_id: { _eq: boolExpId } }, {
        value: { id: { _eq: t2 } },
      }, { table: 'objects' });
      await deep.await(boolExpId);
      await delay(2000);
      const { data: [{ value: sql }], error } = await deep.select({
        link_id: { _eq: boolExpId },
      }, { table: 'bool_exp', returning: 'id link_id value' });

      const { data: d1 } = await api.sql(applyBoolExpToLink(sql, t1));
      expect(+d1?.result?.[1]?.[0]).to.equal(0);
      const { data: d2 } = await api.sql(applyBoolExpToLink(sql, t2));
      expect(+d2?.result?.[1]?.[0]).to.equal(1);
    });
    it(`delete`, async () => {
      const { data: [{ id: t1 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      const { data: [{ id: t2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      const { data: [{ id: boolExpId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
        object: { data: { value: { id: { _eq: t1 } } } },
      });
      await deep.await(boolExpId);
      await delay(2000);
      await deep.delete({ link_id: { _eq: boolExpId } }, { table: 'objects' });
      await deep.await(boolExpId);
      await delay(2000);
      const { data, error } = await deep.select({
        link_id: { _eq: boolExpId },
      }, { table: 'bool_exp', returning: 'id link_id value' });
      expect(data).to.be.empty;
    });
  });
});