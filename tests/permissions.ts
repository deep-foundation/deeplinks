import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { assert, expect } from 'chai';
import { stringify } from "querystring";
import { delay } from "../imports/promise";

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const root = new DeepClient({ apolloClient });

let admin: any;

beforeAll(async () => {
  const { linkId, token, error } = await root.jwt({ linkId: await root.id('deep', 'admin') });
  admin = new DeepClient({ deep, token, linkId });
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
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: a1.linkId,
        } }
      });
      const n1 = await d1.select({ id });
      assert.lengthOf(n1?.data, 1, `item_id ${id} must be selectable by ${a1.linkId}`);
      const n2 = await d2.select({ id });
      assert.lengthOf(n2?.data, 0, `item_id ${id} must not be selectable by ${a2.linkId}`);
      const n3 = await admin.select({ id });
      assert.lengthOf(n3?.data, 1, `item_id ${id} must be selectable by ${admin.linkId}`);
    });
    it(`rule select include 1 depth but exclude 2 depth`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1 });
      const d2 = new DeepClient({ deep, ...a2 });
      const d3 = new DeepClient({ deep, ...a3 });
      const { data: [{ id: id1 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: a1.linkId,
        } }
      });
      const { data: [{ id: id2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: id1,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
  });
  describe('insert', () => {
    it(`root can insert`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      const n1 = await deep.select({ id });
      assert.lengthOf(n1?.data, 1);
    });
    it(`guest cant insert by default`, async () => {
      const a1 = await deep.guest({});
      const d1 = new DeepClient({ deep, ...a1, silent: true });
      const { data, error } = await d1.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
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
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
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
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      if (e1) console.log('error', e1);
      expect(da1).to.not.be.undefined;
      expect(e1).to.be.undefined;
      const d2 = new DeepClient({ deep, ...a2, silent: true });
      const { data: da2, error: e2 } = await d2.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      expect(da2).to.not.be.undefined;
      expect(e2).to.be.undefined;
      const d3 = new DeepClient({ deep, ...a3, silent: true });
      const { data: da3, error: e3 } = await d3.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      expect(da3).to.be.undefined;
      expect(e3).to.not.be.undefined;
    });
    it(`insert permission with SelectorFilter`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const a3 = await deep.guest({});
      const { data: [{ id: TempType }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Type'),
        from_id: await deep.id('@deep-foundation/core', 'Any'),
        to_id: await deep.id('@deep-foundation/core', 'Any'),
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: await deep.id('@deep-foundation/core'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
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
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: TempType,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
                  to: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'Query'),
                    object: { data: { value: {
                      to_id: { _eq: 'X-Deep-User-Id' } ,// <== HERE
                    }, }, },
                  }, },
                },
              ] }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });

      await delay(5000);

      const d1 = new DeepClient({ deep, ...a1, silent: true });
      const { data: da1, error: e1 } = await d1.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      expect(da1).to.not.be.undefined;
      expect(e1).to.be.undefined;
      const { data: da1t, error: e1t } = await d1.insert({
        type_id: TempType,
        from_id: da1?.[0]?.id,
        to_id: a1.linkId,
      });
      expect(da1t).to.not.be.undefined;
      expect(e1t).to.be.undefined;
      const d2 = new DeepClient({ deep, ...a2, silent: true });
      const { data: da2, error: e2 } = await d2.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      expect(da2).to.not.be.undefined;
      expect(e2).to.be.undefined;
      const { data: da2t, error: e2t } = await d2.insert({
        type_id: TempType,
        from_id: da2?.[0]?.id,
        to_id: a1.linkId, // <== HERE
      });
      expect(da2t).to.be.undefined; // <== HERE
      expect(e2t).to.not.be.undefined;
      const d3 = new DeepClient({ deep, ...a3, silent: true });
      const { data: da3, error: e3 } = await d3.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      expect(da3).to.not.be.undefined;
      expect(e3).to.be.undefined;
      const { data: da3t, error: e3t } = await d3.insert({
        type_id: TempType,
        from_id: da2?.[0]?.id,
        to_id: a3.linkId,
      });
      expect(da3t).to.not.be.undefined;
      expect(e3t).to.be.undefined;
    });
  });
  describe('update', () => {
    it(`root can update string value`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
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
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
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
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
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
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowUpdateType'),
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
      assert.lengthOf(u2, 1);
      const n2 = await deep.select({ id });
      assert.equal(n2?.data?.[0]?.value?.value, 'efg');
      const d3 = new DeepClient({ deep, ...a3 });
      const { data: u3 } = await d3.update({ link_id: id }, {
        value: 'fgj',
      }, { table: 'strings' });
      assert.lengthOf(u3, 0);
      const n3 = await deep.select({ id });
      assert.equal(n3?.data?.[0]?.value?.value, 'efg');
    });
  });
  describe('delete', () => {
    it(`root can delete`, async () => {
      const { data: [{ id }], error } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
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
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
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
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowDeleteType'),
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
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      const d1 = new DeepClient({ deep, ...a1 });
      await d1.delete(id1);
      const n1 = await deep.select({ id: id1 });
      assert.lengthOf(n1?.data, 0);

      const { data: [{ id: id2 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      const d2 = new DeepClient({ deep, ...a2 });
      await d2.delete(id2);
      const n2 = await deep.select({ id: id2 });
      assert.lengthOf(n2?.data, 0);

      const { data: [{ id: id3 }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
      });
      const d3 = new DeepClient({ deep, ...a3 });
      await d3.delete(id3);
      const n3 = await deep.select({ id: id3 });
      assert.lengthOf(n3?.data, 1);
    });
    it(`delete permission with SelectorFilter`, async () => {
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
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: await deep.id('@deep-foundation/core', 'Operation'),
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
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
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a1.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a2.linkId,
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
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
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: await deep.id('@deep-foundation/core', 'Operation'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: await deep.id('@deep-foundation/core', 'containTree'),
                  } },
                },
                {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
                  to: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'Query'),
                    object: { data: { value: {
                      string: { value: { _eq: 'abc2' } },// <== HERE
                    }, }, },
                  }, },
                },
              ] }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowDeleteType'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });

      await delay(5000);

      const d1 = new DeepClient({ deep, ...a1, silent: true });
      const { data: da1, error: e1 } = await d1.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
        string: { data: { value: 'abc1' } },
      });
      expect(e1).to.be.undefined;
      expect(da1).to.not.be.undefined;
      const { data: da1d, error: e1d } = await d1.delete(da1?.[0]?.id);
      expect(e1d).to.not.be.undefined;
      expect(da1d).to.be.undefined;
      const d2 = new DeepClient({ deep, ...a2, silent: true });
      const { data: da2, error: e2 } = await d2.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
        string: { data: { value: 'abc2' } },
      });
      expect(e2).to.be.undefined;
      expect(da2).to.not.be.undefined;
      const { data: da2d, error: e2d } = await d2.delete(da2?.[0]?.id);
      expect(e2d).to.be.undefined;
      expect(da2d).to.not.be.undefined;
      const d3 = new DeepClient({ deep, ...a3, silent: true });
      const { data: da3, error: e3 } = await d3.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
        string: { data: { value: 'abc3' } },
      });
      expect(e3).to.be.undefined;
      expect(da3).to.not.be.undefined;
      const { data: da3d, error: e3d } = await d3.delete(da3?.[0]?.id);
      expect(e3d).to.not.be.undefined;
      expect(da3d).to.be.undefined;
    });
  });
  describe('login', () => {
    it(`login permission can be granted`, async () => {
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
                  type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                  to_id: a2.linkId,
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: a1.linkId,
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
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowLogin'),
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
      await d1.can(a1.linkId, a1.linkId, await deep.id('@deep-foundation/core', 'AllowLogin'));

      const d2 = new DeepClient({ deep, ...a2 });
      await d2.can(a1.linkId, a2.linkId, await deep.id('@deep-foundation/core', 'AllowLogin'));

      const d3 = new DeepClient({ deep, ...a3 });
      await d3.can(a1.linkId, a3.linkId, await deep.id('@deep-foundation/core', 'AllowLogin'));
    });
  });
});