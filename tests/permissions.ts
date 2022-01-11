import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import { stringify } from "querystring";

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
  // token: adminToken,
});

const root = new DeepClient({ apolloClient });

let adminToken: string;
let admin: any;

beforeAll(async () => {
  const { linkId, token } = await root.jwt({ linkId: await root.id('@deep-foundation/core', 'system', 'admin') });
  adminToken = token;
  admin = new DeepClient({ deep: root, token: adminToken, linkId });
});

let deep = root;

describe('permissions', () => {
  describe('select', () => {
    it(`user contain range`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1 });
      const d2 = new DeepClient({ deep, ...a2 });
      const { data: [{ id }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: a1.linkId,
        } }
      });
      const n1 = await d1.select({ id });
      assert.lengthOf(n1?.data, 1);
      const n2 = await d2.select({ id });
      assert.lengthOf(n2?.data, 0);
      const n3 = await admin.select({ id });
      assert.lengthOf(n3?.data, 1);
    });
    it(`rule select 1 depth`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1 });
      const d2 = new DeepClient({ deep, ...a2 });
      const d3 = new DeepClient({ deep, ...a3 });
      const { data: [{ id }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: a1.linkId,
        } }
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: a2.linkId,
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: id
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: await deep.id('@deep-foundation/core', 'Select'),
              } }
            } }
          },
        ] },
      });
      const n1 = await d1.select({ id });
      assert.lengthOf(n1?.data, 1);
      const n2 = await d2.select({ id });
      assert.lengthOf(n2?.data, 1);
      const n3 = await d3.select({ id });
      assert.lengthOf(n3?.data, 0);
      const n4 = await admin.select({ id });
      assert.lengthOf(n4?.data, 1);
    });
    it(`rule select 2 depth`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1 });
      const d2 = new DeepClient({ deep, ...a2 });
      const d3 = new DeepClient({ deep, ...a3 });
      const { data: [{ id }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: a1.linkId,
            } },
          } },
        } }
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: a2.linkId,
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: id
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: await deep.id('@deep-foundation/core', 'Select'),
              } }
            } }
          },
        ] },
      });
      const n1 = await d1.select({ id });
      assert.lengthOf(n1?.data, 1);
      const n2 = await d2.select({ id });
      assert.lengthOf(n2?.data, 1);
      const n3 = await d3.select({ id });
      assert.lengthOf(n3?.data, 0);
      const n4 = await admin.select({ id });
      assert.lengthOf(n4?.data, 1);
    });
  });
  describe('insert', () => {
    it(`root can insert`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      const n1 = await deep.select({ id });
      assert.lengthOf(n1?.data, 1);
    });
    it(`guest cant insert by default`, async () => {
      const a1 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1 });
      let trowed = false;
      let _id;
      try {
        const { data: [{ id }], error } = await d1.insert({
          type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        });
        _id = id;
      } catch(error) {
        trowed = true;
      }
      assert.equal(trowed, true);
    });
    it(`insert permission can be gived to guest`, async () => {
      const a1 = await deep.guest({});
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: a1.linkId,
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: await deep.id('@deep-foundation/core'),
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: await deep.id('@deep-foundation/core', 'Insert'),
              } }
            } }
          },
        ] },
      });
      const d1 = new DeepClient({ deep, ...a1 });
      const { data: [{ id }], error } = await d1.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
    });
  });
  describe('update', () => {
    it(`root can update string value`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        string: { data: { value: 'abc' } },
      });
      await deep.update({ link_id: id }, {
        value: 'def',
      }, { table: 'strings' });
      const n1 = await deep.select({ id });
      assert.lengthOf(n1?.data, 1);
      assert.equal(n1?.data?.[0]?.value?.value, 'def');
    });
    it(`guest cant update string value`, async () => {
      const a1 = await deep.guest({});
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        string: { data: { value: 'abc' } },
      });
      const d1 = new DeepClient({ deep, ...a1 });
      const { data: updated } = await d1.update({ link_id: id }, {
        value: 'def',
      }, { table: 'strings' });
      assert.lengthOf(updated, 0);
      const n1 = await deep.select({ id });
      assert.lengthOf(n1?.data, 1);
      assert.equal(n1?.data?.[0]?.value?.value, 'abc');
    });
    it(`update permission can be gived to guest`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        string: { data: { value: 'abc' } },
      });
      const a1 = await deep.guest({});
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: a1.linkId,
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: await deep.id('@deep-foundation/core'),
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: await deep.id('@deep-foundation/core', 'Update'),
              } }
            } }
          },
        ] },
      });
      const d1 = new DeepClient({ deep, ...a1 });
      const { data: updated } = await d1.update({ link_id: id }, {
        value: 'def',
      }, { table: 'strings' });
      assert.lengthOf(updated, 1);
      const n1 = await deep.select({ id });
      console.log(updated, n1?.data);
      assert.equal(n1?.data?.[0]?.value?.value, 'def');
    });
  });
  describe('delete', () => {
    it(`root can delete`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      const n1 = await deep.select({ id });
      assert.lengthOf(n1?.data, 1);
      const { data: deleted } = await deep.delete(id);
      assert.lengthOf(deleted, 1);
      const n2 = await deep.select({ id });
      assert.lengthOf(n2?.data, 0);
    });
    it(`guest cant delete by default`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      const n1 = await deep.select({ id });
      assert.lengthOf(n1?.data, 1);
      const a1 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1 });
      const { data: deleted } = await d1.delete(id);
      assert.lengthOf(deleted, 0);
      const n2 = await deep.select({ id });
    });
    it(`delete permission can be gived to guest`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      const a1 = await deep.guest({});
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: a1.linkId,
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: await deep.id('@deep-foundation/core'),
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Selection'),
                to_id: await deep.id('@deep-foundation/core', 'Delete'),
              } }
            } }
          },
        ] },
      });
      const n1 = await deep.select({ id });
      assert.lengthOf(n1?.data, 1);
      const d1 = new DeepClient({ deep, ...a1 });
      await d1.delete(id);
      const n2 = await deep.select({ id });
      assert.lengthOf(n2?.data, 0);
    });
  });
});