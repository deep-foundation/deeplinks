import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert, expect } from 'chai';
import { stringify } from "querystring";

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
          type_id: await deep.id('@deep-foundation/core', 'Include'),
          to_id: id0,
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
            to_id: tr1
          } },
        },
        {
          type_id: await deep.id('@deep-foundation/core', 'Exclude'),
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
          type_id: await deep.id('@deep-foundation/core', 'Include'),
          to_id: id0,
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
            to_id: tr2
          } },
        },
        {
          type_id: await deep.id('@deep-foundation/core', 'Exclude'),
          to_id: id3,
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
            to_id: tr2
          } },
        },
      ] }
    });
    const n1 = await deep.select({
      item_id: { _eq: id2 }, selector_id: { _eq: s1 }
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n1?.data, 1);
    const n2 = await deep.select({
      item_id: { _eq: id3 }, selector_id: { _eq: s1 }
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n2?.data, 0);
    const n3 = await deep.select({
      item_id: { _eq: id4 }, selector_id: { _eq: s1 }
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n3?.data, 0);
    const n4 = await deep.select({
      item_id: { _eq: id5 }, selector_id: { _eq: s1 }
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n4?.data, 0);
    const n5 = await deep.select({
      item_id: { _eq: id5 }, selector_id: { _eq: s2 }
    }, { table: 'selectors', returning: 'item_id selector_id' });
    assert.lengthOf(n5?.data, 1);
  });
});