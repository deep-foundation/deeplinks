import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

// import {
//   GLOBAL_ID_TYPE,
//   GLOBAL_ID_SYNC_TEXT_FILE,
//   GLOBAL_ID_HANDLER,
//   GLOBAL_ID_JS_EXECUTION_PROVIDER,
//   GLOBAL_ID_HANDLE_INSERT,
// } from '../imports/global-ids';

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

export const beforeAllHandler = async () => {
  // { 
  //   id: 'helloWorldJsFile',
  //   type: 'SyncTextFile',
  //   value: { value: "console.log('hello from insert handler');" }
  // }, // 72

  // const insert = { type_id: GLOBAL_ID_SYNC_TEXT_FILE, `table${GLOBAL_ID_SYNC_TEXT_FILE}`: { data: { value: "console.log('hello from insert handler');" } } };
  // // const valueInsert = await this.client.insert({ link_id: valueLink.id, ...item.value }, { table: `table${valueLink.type}`, name: 'IMPORT_PACKAGE_VALUE' });
  // // const linkInsert = await this.client.insert(insert, { name: 'IMPORT_PACKAGE_LINK' });

  // deepClient.insert(insert);
  // { 
  //   id: 'helloWorldHandler',
  //   from: 'JSExecutionProvider',
  //   type: 'Handler',
  //   to: 'helloWorldJsFile'
  // }, // 73
  // { 
  //   id: 'helloWorldInsertHandler',
  //   from: 'Type',
  //   type: 'HandleInsert',
  //   to: 'helloWorldHandler'
  // }, // 74
};
beforeAll(beforeAllHandler);

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe('handle by type', () => {
  it(`handle insert`, async () => {
    const freeId = randomInteger(5000000, 9999999999);
    console.log(freeId);
    const typeId = await deep.id('@deep-foundation/core', 'Type')
    const insert = { id: freeId, from_id: freeId, type_id: typeId, to_id: freeId };
    const linkInsert = (await deep.insert(insert, { name: 'IMPORT_PACKAGE_LINK' })).data[0];
    console.log(linkInsert);
    assert.equal(freeId, linkInsert.id);

    // TODO: check result link is created
    // TODO: check resolve link is created

    // assert.deepEqual(deepClient.boolExpSerialize({ id: 5 }), { id: { _eq: 5 } });
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

const itDelay = () => {
  if (DELAY) {
    (it)('delay', async () => {
      await delay(DELAY);
    });
  }
};

// export const prepare = () => { };
// export const testMinus15 = (x: boolean) => async () => { };
// export const testPlus15 = (x: boolean) => async () => { }
// export const testRecursive = (x: boolean) => async () => { };
// export const testRecursiveSameRoot = (x: boolean) => async () => { }
// export const testSeparation1 = (x: boolean) => async () => { }
// export const testSeparation2 = (x: boolean) => async () => { }


// (it)('prepare', prepare);
// it('+15', testPlus15(true));
// itDelay();
// it('-15', testMinus15(true));
// itDelay();

// it('recursive', testRecursive(true));
// itDelay();
// it('recursiveSameRoot', testRecursiveSameRoot(true));
// itDelay();
// it('testSeparation1', testSeparation1(true));
// itDelay();
// it('testSeparation2', testSeparation2(true));
