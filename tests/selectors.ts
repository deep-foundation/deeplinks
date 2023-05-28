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

const deep = new DeepClient({ apolloClient });

let adminToken: string;
let admin: any;

beforeAll(async () => {
  const { linkId, token } = await deep.jwt({ linkId: await deep.id('deep', 'admin') });
  adminToken = token;
  admin = new DeepClient({ deep, token: adminToken, linkId });
});

describe('selectors', () => {
  it(`selector include exclude`, async () => {
    const { data: [{ id: ty0 }] } = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'Type'),
    });
    const { data: [{ id: ty1 }] } = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'Type'),
      from_id: ty0,
      to_id: ty0,
    });
    const { data: [{ id: tr1 }] } = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'Tree'),
      out: { data: [
        {
          type_id: await deep.id('@deep-foundation/core', 'TreeIncludeDown'),
          to_id: ty1,
        },
        {
          type_id: await deep.id('@deep-foundation/core', 'TreeIncludeNode'),
          to_id: ty0,
        },
      ] }
    });
    const { data: [{ id: ty2 }] } = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'Type'),
      from_id: ty0,
      to_id: ty0,
    });
    const { data: [{ id: tr2 }] } = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'Tree'),
      out: { data: [
        {
          type_id: await deep.id('@deep-foundation/core', 'TreeIncludeDown'),
          to_id: ty2,
        },
        {
          type_id: await deep.id('@deep-foundation/core', 'TreeIncludeNode'),
          to_id: ty0,
        },
      ] }
    });
    const { data: [{ id: id0 }] } = await deep.insert({
      type_id: ty0,
    });
    const { data: [{ id: id1 }] } = await deep.insert({
      type_id: ty0,
      in: { data: {
        type_id: ty1,
        from_id: id0,
      } }
    });
    const { data: [{ id: id2 }] } = await deep.insert({
      type_id: ty0,
      in: { data: {
        type_id: ty1,
        from_id: id1,
      } }
    });
    const { data: [{ id: id3 }] } = await deep.insert({
      type_id: ty0,
      in: { data: {
        type_id: ty1,
        from_id: id1,
      } }
    });
    const { data: [{ id: id4 }] } = await deep.insert({
      type_id: ty0,
      in: { data: {
        type_id: ty1,
        from_id: id3,
      } }
    });
    const { data: [{ id: id5 }] } = await deep.insert({
      type_id: ty0,
      in: { data: {
        type_id: ty2,
        from_id: id0,
      } }
    });
    const { data: [{ id: s1 }] } = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'Selector'),
      out: { data: [
        {
          type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
          to_id: id0,
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
            to_id: tr1
          } },
        },
        {
          type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
          to_id: id3,
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
            to_id: tr1
          } },
        },
      ] }
    });
    const { data: [{ id: s2 }] } = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'Selector'),
      out: { data: [
        {
          type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
          to_id: id0,
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
            to_id: tr2
          } },
        },
        {
          type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
          to_id: id3,
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
            to_id: tr2
          } },
        },
      ] }
    });
    const n1 = await deep.select({
      item_id: { _eq: id2 }, selector_id: { _eq: s1 },
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n1?.data, 1, `item_id ${id2} must be in selector_id ${s1}`);
    const n2 = await deep.select({
      item_id: { _eq: id3 }, selector_id: { _eq: s1 },
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n2?.data, 0, `item_id ${id3} must not be in selector_id ${s1}`);
    const n3 = await deep.select({
      item_id: { _eq: id4 }, selector_id: { _eq: s1 },
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n3?.data, 0, `item_id ${id4} must not be in selector_id ${s1}`);
    const n4 = await deep.select({
      item_id: { _eq: id5 }, selector_id: { _eq: s1 },
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n4?.data, 0, `item_id ${id5} must not be in selector_id ${s1}`);
    const n5 = await deep.select({
      item_id: { _eq: id5 }, selector_id: { _eq: s2 },
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n5?.data, 1, `item_id ${id5} must be in selector_id ${s2}`);
  });
  describe('criteria', () => {
    it(`selector include exclude boolExp`, async () => {
      const { data: [{ id: ty0 }] } = await admin.insert({
        type_id: await admin.id('@deep-foundation/core', 'Type'),
      });
      const { data: [{ id: ty1 }] } = await admin.insert({
        type_id: await admin.id('@deep-foundation/core', 'Type'),
        from_id: ty0,
        to_id: ty0,
      });
      const { data: [{ id: tr1 }] } = await admin.insert({
        type_id: await admin.id('@deep-foundation/core', 'Tree'),
        out: { data: [
          {
            type_id: await admin.id('@deep-foundation/core', 'TreeIncludeDown'),
            to_id: ty1,
          },
          {
            type_id: await admin.id('@deep-foundation/core', 'TreeIncludeNode'),
            to_id: ty0,
          },
        ] }
      });
      const { data: [{ id: id0 }] } = await admin.insert({
        type_id: ty0,
        string: { data: { value: 'id0' } },
      });
      const { data: [{ id: id1 }] } = await admin.insert({
        type_id: ty0,
        string: { data: { value: 'id1' } },
        in: { data: {
          type_id: ty1,
          from_id: id0,
        } }
      });
      const { data: [{ id: id2 }] } = await admin.insert({
        type_id: ty0,
        string: { data: { value: 'id2' } },
        in: { data: {
          type_id: ty1,
          from_id: id1,
        } }
      });
      const { data: [{ id: id3 }] } = await admin.insert({
        type_id: ty0,
        string: { data: { value: 'id3' } },
        in: { data: {
          type_id: ty1,
          from_id: id2,
        } }
      });
      const { data: [{ id: id4 }] } = await admin.insert({
        type_id: ty0,
        string: { data: { value: 'id4' } },
        in: { data: {
          type_id: ty1,
          from_id: id3,
        } }
      });
      const { data: [{ id: id5 }] } = await admin.insert({
        type_id: ty0,
        string: { data: { value: 'id5' } },
        in: { data: {
          type_id: ty1,
          from_id: id4,
        } }
      });
      const { data: [{ id: s1 }] } = await admin.insert({
        type_id: await admin.id('@deep-foundation/core', 'Selector'),
        out: { data: [
          {
            type_id: await admin.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: id0,
            out: { data: {
              type_id: await admin.id('@deep-foundation/core', 'SelectorTree'),
              to_id: tr1
            } },
          },
          {
            type_id: await admin.id('@deep-foundation/core', 'SelectorFilter'),
            to: { data: {
              type_id: await admin.id('@deep-foundation/core', 'Query'),
              object: { data: { value: { string: { value: { _in: ['id3', 'id5'] } } } } }
            } },
          },
        ] }
      });

      await delay(3000);

      const n1 = await admin.select({
        item_id: { _eq: id2 }, selector_id: { _eq: s1 },
      }, { table: 'selectors', returning: `item_id selector_id query { id exec_bool_exp(args: { link_id: ${id2} }) { id } }` });
      assert.lengthOf(n1?.data, 1);
      expect(n1?.data?.[0]?.query?.[0]?.exec_bool_exp).to.be.empty;
      const n2 = await admin.select({
        item_id: { _eq: id3 }, selector_id: { _eq: s1 },
      }, { table: 'selectors', returning: `item_id selector_id query { id exec_bool_exp(args: { link_id: ${id3} }) { id } }` });
      assert.lengthOf(n2?.data, 1);
      expect(n2?.data?.[0]?.query?.[0]?.exec_bool_exp).to.not.be.empty;
      const n3 = await admin.select({
        item_id: { _eq: id4 }, selector_id: { _eq: s1 },
      }, { table: 'selectors', returning: `item_id selector_id query { id exec_bool_exp(args: { link_id: ${id4} }) { id } }` });
      assert.lengthOf(n3?.data, 1);
      expect(n3?.data?.[0]?.query?.[0]?.exec_bool_exp).to.be.empty;
      const n4 = await admin.select({
        item_id: { _eq: id5 }, selector_id: { _eq: s1 },
      }, { table: 'selectors', returning: `item_id selector_id query { id exec_bool_exp(args: { link_id: ${id5} }) { id } }` });
      assert.lengthOf(n4?.data, 1);
      expect(n4?.data?.[0]?.query?.[0]?.exec_bool_exp).to.not.be.empty;
    });
  });
});