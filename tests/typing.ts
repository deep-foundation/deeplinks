import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const root = new DeepClient({ apolloClient });

let adminToken: string;
let deep: any;

describe('typing', () => {
  beforeAll(async () => {
    const { linkId, token } = await root.jwt({ linkId: await root.id('deep', 'admin') });
    adminToken = token;
    deep = new DeepClient({ deep: root, token: adminToken, linkId });
  });
  it(`type required`, async () => {
    let throwed = false;
    try { await deep.insert({ type_id: 999999 }); }
    catch (error) { throwed = true; }
    assert.equal(throwed, true);
  });
  it(`particular links`, async () => {
    let throwed = false;
    try { await deep.insert({ type_id: 1, from_id: 1 }); }
    catch (error) { throwed = true; }
    assert.equal(throwed, true);
  });
  it(`type 1`, async () => {
    const { data: [{ id }] } = await deep.insert({ type_id: 1 });
    assert.equal(typeof(id), 'number');
  });
  it(`custom id restricted`, async () => {
    let throwed = false;
    try { await deep.insert({ id: 8888888, type_id: 1 }); }
    catch (error) { throwed = true; }
    assert.equal(throwed, true);
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
      assert.isTrue(error.message.startsWith('Type conflict link: { id: '));
      assert.isTrue(error.message.endsWith(`type: ${typeId}, from: ${fromId}, to: ${toId} } expected type: { type: ${typeId}, from: ${typeFromToId}, to: ${typeFromToId} } received type: { type: ${typeId}, from: ${typeFromToId}, to: ${invalidTypeId} }`));
      throwed = true;
    }
    assert.equal(throwed, true);
  });
});