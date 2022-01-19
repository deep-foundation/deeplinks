import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert, expect } from 'chai';
import { stringify } from "querystring";

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
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
    it(`rule select include 1 depth but exclude 2 depth`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1 });
      const d2 = new DeepClient({ deep, ...a2 });
      const d3 = new DeepClient({ deep, ...a3 });
      const { data: [{ id: id1 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: a1.linkId,
        } }
      });
      const { data: [{ id: id2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: id1,
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
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: a2.linkId,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'Include'),
                  to_id: id1,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'Exclude'),
                  to_id: id2,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
              ] }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });

      const n1 = await d1.select({ id: id1 });
      assert.lengthOf(n1?.data, 1);
      const n2 = await d2.select({ id: id1 });
      assert.lengthOf(n2?.data, 1);
      const n3 = await d3.select({ id: id1 });
      assert.lengthOf(n3?.data, 0);

      const n4 = await admin.select({ id: id1 });
      assert.lengthOf(n4?.data, 1);

      const n5 = await d1.select({ id: id2 });
      assert.lengthOf(n5?.data, 1);
      const n6 = await d2.select({ id: id2 });
      assert.lengthOf(n6?.data, 0);
      const n7 = await d3.select({ id: id2 });
      assert.lengthOf(n7?.data, 0);

      const n8 = await admin.select({ id: id2 });
      assert.lengthOf(n8?.data, 1);
    });
    it(`rule select include 1> depth but rule denySelect include 2 depth`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1 });
      const d2 = new DeepClient({ deep, ...a2 });
      const d3 = new DeepClient({ deep, ...a3 });
      const { data: [{ id: id1 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: a1.linkId,
        } }
      });
      const { data: [{ id: id2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: id1,
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
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: a2.linkId,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: id1,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } },
            } },
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: a2.linkId,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: id2,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } },
            } },
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'DenySelect'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });

      const n1 = await d1.select({ id: id1 });
      assert.lengthOf(n1?.data, 1);
      const n2 = await d2.select({ id: id1 });
      assert.lengthOf(n2?.data, 1);
      const n3 = await d3.select({ id: id1 });
      assert.lengthOf(n3?.data, 0);

      const n4 = await admin.select({ id: id1 });
      assert.lengthOf(n4?.data, 1);

      const n5 = await d1.select({ id: id2 });
      assert.lengthOf(n5?.data, 1);
      const n6 = await d2.select({ id: id2 });
      assert.lengthOf(n6?.data, 0);
      const n7 = await d3.select({ id: id2 });
      assert.lengthOf(n7?.data, 0);

      const n8 = await admin.select({ id: id2 });
      assert.lengthOf(n8?.data, 1);
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
      const d1 = new DeepClient({ deep, ...a1, silent: true });
      const { data, error } = await d1.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      assert.isNotEmpty(error);
    });
    it(`insert permission can be gived to guest`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'Include'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'Include'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'Exclude'),
                  to_id: a3.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
              ] }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'AllowInsert'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: a2.linkId,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'DenyInsert'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });
      const d1 = new DeepClient({ deep, ...a1, silent: true });
      const { data: da1, error: e1 } = await d1.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      expect(da1).to.not.be.undefined;
      expect(e1).to.be.undefined;
      const d2 = new DeepClient({ deep, ...a2, silent: true });
      const { data: da2, error: e2 } = await d2.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      expect(da2).to.be.undefined;
      expect(e2).to.not.be.undefined;
      const d3 = new DeepClient({ deep, ...a3, silent: true });
      const { data: da3, error: e3 } = await d3.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      expect(da3).to.be.undefined;
      expect(e3).to.not.be.undefined;
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
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'Include'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'Include'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'Exclude'),
                  to_id: a3.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
              ] }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'AllowUpdate'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: a2.linkId,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'DenyUpdate'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });
      const d1 = new DeepClient({ deep, ...a1 });
      const { data: u1 } = await d1.update({ link_id: id }, {
        value: 'def',
      }, { table: 'strings' });
      assert.lengthOf(u1, 1);
      const n1 = await deep.select({ id });
      assert.equal(n1?.data?.[0]?.value?.value, 'def');
      const d2 = new DeepClient({ deep, ...a2 });
      const { data: u2 } = await d2.update({ link_id: id }, {
        value: 'efg',
      }, { table: 'strings' });
      assert.lengthOf(u2, 0);
      const n2 = await deep.select({ id });
      assert.equal(n2?.data?.[0]?.value?.value, 'def');
      const d3 = new DeepClient({ deep, ...a3 });
      const { data: u3 } = await d3.update({ link_id: id }, {
        value: 'fgj',
      }, { table: 'strings' });
      assert.lengthOf(u3, 0);
      const n3 = await deep.select({ id });
      assert.equal(n3?.data?.[0]?.value?.value, 'def');
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
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'Include'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'Include'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'Exclude'),
                  to_id: a3.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
              ] },
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'AllowDelete'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: a2.linkId,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
                to_id: await deep.id('@deep-foundation/core', 'DenyDelete'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });
      const { data: [{ id: id1 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      const d1 = new DeepClient({ deep, ...a1 });
      await d1.delete(id1);
      const n1 = await deep.select({ id: id1 });
      assert.lengthOf(n1?.data, 0);

      const { data: [{ id: id2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      const d2 = new DeepClient({ deep, ...a2 });
      await d2.delete(id2);
      const n2 = await deep.select({ id: id2 });
      assert.lengthOf(n2?.data, 1);

      const { data: [{ id: id3 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      });
      const d3 = new DeepClient({ deep, ...a3 });
      await d3.delete(id3);
      const n3 = await deep.select({ id: id3 });
      assert.lengthOf(n3?.data, 1);
    });
  });
});