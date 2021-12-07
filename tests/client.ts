import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
});

const deepClient = new DeepClient({ apolloClient });

describe('boolExpSerialize', () => {
  it(`{ id: 5 })`, () => {
    assert.deepEqual(deepClient.boolExpSerialize({ id: 5 }), { id: { _eq: 5 } });
  });
  // it(`{ id: { _eq: 5 } })`, () => {
  //   assert.deepEqual(deepClient.boolExpSerialize({ id: { _eq: 5 } }), { id: { _eq: 5 } });
  // });
  // it(`{ value: 5 })`, () => {
  //   assert.deepEqual(deepClient.boolExpSerialize({ value: 5 }), { number: { value: { _eq: 5 } } });
  // });
  // it(`{ value: 'a' })`, () => {
  //   assert.deepEqual(deepClient.boolExpSerialize({ value: 'a' }), { string: { value: { _eq: 'a' } } });
  // });
  // it(`{ number: { value: { _eq: 5 } } })`, () => {
  //   assert.deepEqual(deepClient.boolExpSerialize({ number: { value: { _eq: 5 } } }), { number: { value: { _eq: 5 } } });
  // });
  // it(`{ string: { value: { _eq: 'a' } } })`, () => {
  //   assert.deepEqual(deepClient.boolExpSerialize({ string: { value: { _eq: 'a' } } }), { string: { value: { _eq: 'a' } } });
  // });
  // it(`{ object: { value: { _contains: { a: 'b' } } } })`, () => {
  //   assert.deepEqual(deepClient.boolExpSerialize({ object: { value: { _contains: { a: 'b' } } } }), { object: { value: { _contains: { a: 'b' } } } });
  // });
});