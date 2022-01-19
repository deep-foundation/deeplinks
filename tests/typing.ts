import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
});

const root = new DeepClient({ apolloClient });

let adminToken: string;
let deep: any;

beforeAll(async () => {
  const { linkId, token } = await root.jwt({ linkId: await root.id('@deep-foundation/core', 'system', 'admin') });
  adminToken = token;
  deep = new DeepClient({ deep: root, token: adminToken, linkId });
});

describe('typing', () => {
  it(`type required`, async () => {
    let throwed = false;
    try { await deep.insert({ type_id: 999 }); }
    catch (error) { throwed = true; }
    assert(throwed, true);
  });
  it(`particular links`, async () => {
    let throwed = false;
    try { await deep.insert({ type_id: 1, from_id: 1 }); }
    catch (error) { throwed = true; }
    assert(throwed, true);
  });
  it(`type 1`, async () => {
    const { data: [{ id }] } = await deep.insert({ type_id: 1 });
    assert(typeof(id), 'number');
  });
  it(`link equal from/to type`, async () => {
    const { data: [{ id: typeFromId }] } = await deep.insert({ type_id: 1 });
    const { data: [{ id: typeToId }] } = await deep.insert({ type_id: 1 });
    const { data: [{ id: typeId }] } = await deep.insert({ type_id: 1, from_id: typeFromId, to_id: typeToId });
    const { data: [{ id: fromId }] } = await deep.insert({ type_id: typeFromId });
    const { data: [{ id: toId }] } = await deep.insert({ type_id: typeToId });
    await deep.insert({ type_id: typeId, from_id: fromId, to_id: toId });
  });
  it(`link invalid from type`, async () => {
    const { data: [{ id: typeFromToId }] } = await deep.insert({ type_id: 1 });
    const { data: [{ id: invalidTypeId }] } = await deep.insert({ type_id: 1 });
    const { data: [{ id: typeId }] } = await deep.insert({ type_id: 1, from_id: typeFromToId, to_id: typeFromToId });
    const { data: [{ id: fromId }] } = await deep.insert({ type_id: typeFromToId });
    const { data: [{ id: toId }] } = await deep.insert({ type_id: invalidTypeId });

    let throwed = false;
    try { await deep.insert({ type_id: typeId, from_id: fromId, to_id: toId }); }
    catch (error) {
      assert(error.message, `Type conflict link: { type: ${typeId}, from: ${fromId}, to: ${toId} } expected type: { type: ${typeId}, from: ${typeFromToId}, to: ${typeFromToId} } received type: { type: ${typeId}, from: ${typeFromToId}, to: ${invalidTypeId} }`);
      throwed = true;
    }
    assert(throwed, true);
  });
});