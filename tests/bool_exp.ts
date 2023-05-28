import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { assert, expect } from 'chai';
import { applyBoolExpToLink, userReplaceSymbol } from "../imports/bool_exp_to_sql";
import { DeepClient } from "../imports/client";
import { delay } from "../imports/promise";

export const api = new HasuraApi({
  path: process.env.DEEPLINKS_HASURA_PATH,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

let adminToken: string;
let admin: any;

beforeAll(async () => {
  const { linkId, token } = await deep.jwt({ linkId: await deep.id('deep', 'admin') });
  adminToken = token;
  admin = new DeepClient({ deep, token: adminToken, linkId });
});

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
        type_id: await deep.id('@deep-foundation/core', 'Query'),
      });
      await deep.insert({
        link_id: boolExpId,
        value: { id: { _eq: t1 } },
      }, { table: 'objects' });
      await deep.await(boolExpId);
      await delay(2000);
      const { data: [{ value: sql }], error } = await deep.select({
        link_id: { _eq: boolExpId },
      }, { table: 'bool_exp' as any, returning: 'id link_id value' });

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
        type_id: await deep.id('@deep-foundation/core', 'Query'),
        object: { data: { value: { id: { _eq: t1 } } } },
      });
      await deep.await(boolExpId);
      await delay(2000);
      const { data: [{ value: sql }], error } = await deep.select({
        link_id: { _eq: boolExpId },
      }, { table: 'bool_exp' as any, returning: 'id link_id value' });

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
        type_id: await deep.id('@deep-foundation/core', 'Query'),
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
      }, { table: 'bool_exp' as any, returning: 'id link_id value' });

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
        type_id: await deep.id('@deep-foundation/core', 'Query'),
        object: { data: { value: { id: { _eq: t1 } } } },
      });
      await deep.await(boolExpId);
      await delay(2000);
      await deep.delete({ link_id: { _eq: boolExpId } }, { table: 'objects' });
      await deep.await(boolExpId);
      await delay(2000);
      const { data, error } = await deep.select({
        link_id: { _eq: boolExpId },
      }, { table: 'bool_exp' as any, returning: 'id link_id value' });
      expect(data).to.be.empty;
    });
    it(`X-Deep-User-Id`, async () => {
      const g1 = await deep.guest({});
      const { data: [{ id: boolExpId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Query'),
        object: { data: { value: { id: { _eq: 'X-Deep-User-Id' } } } },
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: g1.linkId,
        } },
      });
      await deep.await(boolExpId);
      await delay(2000);
      const d1s = await deep.select({
        id: { _eq: boolExpId },
      }, { returning: `exec_bool_exp(args: { link_id: ${g1.linkId} }) { id }` });
      expect(d1s?.data?.[0]?.exec_bool_exp || []).to.be.empty;
      const deep1 = new DeepClient({ deep, ...g1 });
      const g1s = await deep1.select({
        id: { _eq: boolExpId },
      }, { returning: `exec_bool_exp(args: { link_id: ${g1.linkId} }) { id }` });
      expect(g1s?.data?.[0]?.exec_bool_exp || []).to.not.be.empty;
      expect(g1s?.data?.[0]?.exec_bool_exp?.[0]?.id).to.be.equal(g1.linkId);
    });
    it(`X-Deep-Item-Id`, async () => {
      const { data: [{ id: boolExpId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Query'),
        object: { data: { value: { id: { _eq: 'X-Deep-Item-Id' } } } },
      });
      await deep.await(boolExpId);
      await delay(2000);
      const d1s = await admin.select({
        id: { _eq: boolExpId },
      }, { returning: `exec_bool_exp(args: { link_id: ${boolExpId} }) { id }` });
      expect(d1s?.data?.[0]?.exec_bool_exp?.[0]?.id).to.be.equal(boolExpId);
    });
  });
});