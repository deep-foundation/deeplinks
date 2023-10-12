import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import { delay } from "../imports/promise";

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const unloginedDeep = new DeepClient({ apolloClient });

let adminToken: string;
let deep: any;

describe('messanger', () => {
  beforeAll(async () => {
    // const guest = await unloginedDeep.guest();
    // const guestDeep = new DeepClient({ deep: unloginedDeep, ...guest });
    // const admin = await guestDeep.login({ linkId: 262 });
    // deep = new DeepClient({ deep: guestDeep, ...admin });
  });
  it(`guest message`, async () => {
    const guest = await unloginedDeep.guest();
    const guestDeep = new DeepClient({ deep: unloginedDeep, ...guest });

    const inserted = await guestDeep.insert({
      type_id: await guestDeep.id('@deep-foundation/messenger', 'Message'),
      string: { data: { value: 'test guest message' } },
      out: { data: [
        {
          type_id: await guestDeep.id('@deep-foundation/messenger', 'Author'),
          to_id: guestDeep.linkId,
        },
        {
          type_id: await guestDeep.id('@deep-foundation/messenger', 'Reply'),
          to_id: guestDeep.linkId,
          out: { data: {
            type_id: await guestDeep.id('@deep-foundation/messenger', 'Join'),
            to_id: guestDeep.linkId,
          } },
        },
      ] },
    });
    const { data: [{ id }] } = inserted;
    console.log(inserted);

    const result = await guestDeep.select({ id });

    console.log(result);

    assert.lengthOf(result?.data, 1);
    assert.equal(result?.data?.[0]?.value?.value, 'test guest message');
  });
  it(`guest A join B, B reply A`, async () => {
    const guestA = await unloginedDeep.guest();
    const guestADeep = new DeepClient({ deep: unloginedDeep, ...guestA });

    const guestB = await unloginedDeep.guest();
    const guestBDeep = new DeepClient({ deep: unloginedDeep, ...guestB });

    const { data: [{ id: messageAId }] } = await guestADeep.insert({
      type_id: await guestADeep.id('@deep-foundation/messenger', 'Message'),
      string: { data: { value: 'test guest A message' } },
      out: { data: [
        {
          type_id: await guestADeep.id('@deep-foundation/messenger', 'Author'),
          to_id: guestADeep.linkId,
        },
        {
          type_id: await guestADeep.id('@deep-foundation/messenger', 'Reply'),
          to_id: guestADeep.linkId,
          out: { data: [
            {
              type_id: await guestADeep.id('@deep-foundation/messenger', 'Join'),
              to_id: guestADeep.linkId,
            },
            {
              type_id: await guestADeep.id('@deep-foundation/messenger', 'Join'),
              to_id: guestBDeep.linkId,
            },
          ] },
        },
      ] },
    });

    const { data: [{ id: messageBId }] } = await guestBDeep.insert({
      type_id: await guestADeep.id('@deep-foundation/messenger', 'Message'),
      string: { data: { value: 'test guest B message' } },
      out: { data: [
        {
          type_id: await guestADeep.id('@deep-foundation/messenger', 'Author'),
          to_id: guestADeep.linkId,
        },
        {
          type_id: await guestADeep.id('@deep-foundation/messenger', 'Reply'),
          to_id: messageAId,
        },
      ] },
    });

    const resultA = await guestADeep.select({ id: messageAId });
    const resultB = await guestBDeep.select({ id: messageBId });

    assert.lengthOf(resultA?.data, 2);
    assert.equal(resultA?.data?.[1]?.value?.value, 'test guest A message');
    assert.equal(resultA?.data?.[0]?.value?.value, 'test guest B message');

    assert.lengthOf(resultB?.data, 2);
    assert.equal(resultB?.data?.[1]?.value?.value, 'test guest A message');
    assert.equal(resultB?.data?.[0]?.value?.value, 'test guest B message');
  });
  it(`guest A join B, B reply A, A delete join B`, async () => {
    const guestA = await unloginedDeep.guest();
    const guestADeep = new DeepClient({ deep: unloginedDeep, ...guestA });

    const guestB = await unloginedDeep.guest();
    const guestBDeep = new DeepClient({ deep: unloginedDeep, ...guestB });

    const admin = await unloginedDeep.login({ linkId: await unloginedDeep.id('deep', 'admin') });
    const deep = new DeepClient({ deep: unloginedDeep, ...admin });

    const { data: [{ id: messageAId }] } = await guestADeep.insert({
      type_id: await guestADeep.id('@deep-foundation/messenger', 'Message'),
      string: { data: { value: 'test guest A message' } },
      out: { data: [
        {
          type_id: await guestADeep.id('@deep-foundation/messenger', 'Author'),
          to_id: guestADeep.linkId,
        },
        {
          type_id: await guestADeep.id('@deep-foundation/messenger', 'Reply'),
          to_id: guestADeep.linkId,
          out: { data: [
            {
              type_id: await guestADeep.id('@deep-foundation/messenger', 'Join'),
              to_id: guestADeep.linkId,
            },
            {
              type_id: await guestADeep.id('@deep-foundation/messenger', 'Join'),
              to_id: guestBDeep.linkId,
            },
          ] },
        },
      ] },
    });

    const { data: [{ id: messageBId }] } = await guestBDeep.insert({
      type_id: await guestADeep.id('@deep-foundation/messenger', 'Message'),
      string: { data: { value: 'test guest B message' } },
      out: { data: [
        {
          type_id: await guestADeep.id('@deep-foundation/messenger', 'Author'),
          to_id: guestADeep.linkId,
        },
        {
          type_id: await guestADeep.id('@deep-foundation/messenger', 'Reply'),
          to_id: messageAId,
        },
      ] },
    });

    await deep.delete({
      type_id: await guestADeep.id('@deep-foundation/messenger', 'Join'),
      to_id: guestBDeep.linkId,
      from: {
        type_id: await guestADeep.id('@deep-foundation/messenger', 'Reply'),
        to_id: guestADeep.linkId,
      },
    });

    const resultA = await guestADeep.select({ id: messageAId });
    const resultB = await guestBDeep.select({ id: messageBId });

    assert.lengthOf(resultA?.data, 2);
    assert.equal(resultA?.data?.[1]?.value?.value, 'test guest A message');
    assert.equal(resultA?.data?.[0]?.value?.value, 'test guest B message');

    assert.lengthOf(resultB?.data, 0);
  });
});