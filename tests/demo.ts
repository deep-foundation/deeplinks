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

describe('demo', () => {
  it(`user can basic dc operations`, async () => {
    const g1 = await deep.guest();
    const d1 = new DeepClient({ deep, ...g1 });
    const i1s1 = await d1.insert({ type_id: await d1.id('@deep-foundation/core', 'Space') });
    const i1c1 = await d1.insert({ type_id: await d1.id('@deep-foundation/core', 'Contain'), from_id: g1.linkId, to_id: i1s1?.data?.[0]?.id });
    expect(i1s1?.data?.[0]?.id).is.not.undefined;
    const i1q1 = await d1.insert({ type_id: await d1.id('@deep-foundation/core', 'Query'), object: { data: { value: { limit: 0 } } } });
    expect(i1q1?.data?.[0]?.id).is.not.undefined;
    const i1c2 = await d1.insert({ type_id: await d1.id('@deep-foundation/core', 'Contain'), from_id: i1s1?.data?.[0]?.id, to_id: i1q1?.data?.[0]?.id });
    expect(i1c1?.data?.[0]?.id).is.not.undefined;
    const u1q1 = await d1.update({ link_id: { _eq: i1q1?.data?.[0]?.id } }, { value: { limit: 1 } }, { table: 'objects' });
    const s1q1 = await d1.select(i1q1?.data?.[0]?.id);
    expect(s1q1?.data?.[0]?.value?.value?.limit).is.equal(1);
    const i1f1 = await d1.insert({ type_id: await d1.id('@deep-foundation/core', 'Focus'), from_id: i1s1?.data?.[0]?.id, to_id: i1q1?.data?.[0]?.id });
    const i1c3 = await d1.insert({ type_id: await d1.id('@deep-foundation/core', 'Contain'), from_id: i1s1?.data?.[0]?.id, to_id: i1f1?.data?.[0]?.id });
    const s1f1 = await d1.select(i1f1?.data?.[0]?.id);
    expect(s1f1?.data?.[0]?.id).is.not.undefined;
  });
});