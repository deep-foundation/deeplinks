import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import gql from "graphql-tag";

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

beforeAll(async () => {

  const syncTextFileTypeId = await deep.id('@deep-foundation/core', 'SyncTextFile');
  const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
  const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
  const typeId = await deep.id('@deep-foundation/core', 'Type');
  const jsExecutionProviderId = await deep.id('@deep-foundation/core', 'JSExecutionProvider');

  // {
  //   id: 'helloWorldJsFile',
  //   type: 'SyncTextFile',
  //   value: { value: "console.log('hello from insert handler'); return 123;" }
  // }, // 51

  let handlerJSFile = (await deep.insert({ 
    type_id: syncTextFileTypeId
  }, { name: 'IMPORT_HANDLER_JS_FILE' })).data[0];
  await deep.insert({ link_id: handlerJSFile?.id, value: "console.log('hello from insert handler'); return 123;" }, { table: 'strings' });
  // await deep.insert({ link_id: handlerJSFile?.id, value: "console.log('hello from insert handler'); throw 'error897478'; return 123;" }, { table: 'strings' });

  // {
  //   id: 'helloWorldHandler',
  //   from: 'JSExecutionProvider',
  //   type: 'Handler',
  //   to: 'helloWorldJsFile'
  // }, // 52

  const handler = (await deep.insert({
    from_id: jsExecutionProviderId,
    type_id: handlerTypeId,
    to_id: handlerJSFile?.id,
  }, { name: 'IMPORT_HANDLER' })).data[0];

  // {
  //   id: 'helloWorldInsertHandler',
  //   from: 'Type',
  //   type: 'HandleInsert',
  //   to: 'helloWorldHandler'
  // }, // 53

  const insertHandler = (await deep.insert({
    from_id: typeId,
    type_id: handleInsertTypeId,
    to_id: handler?.id,
  }, { name: 'IMPORT_INSERT_HANDLER' })).data[0];

});

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe('handle by type', () => {
  it(`handle insert`, async () => {
    const freeId = randomInteger(5000000, 9999999999);
    console.log(freeId);
    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
    const insert = { id: freeId, from_id: freeId, type_id: typeId, to_id: freeId };
    const linkInsert = (await deep.insert(insert, { name: 'IMPORT_PACKAGE_LINK' })).data[0];
    console.log(linkInsert);
    assert.equal(freeId, linkInsert.id);

    // await deep.await(freeId);
    await delay(2000);

    const client = deep.apolloClient;
    const result = await client.query({
      query: gql`{
        links(where: { 
          in: { 
            type_id: { _eq: ${resolvedTypeId} }, # Resolved
            from: { 
              type_id: { _eq: ${promiseTypeId} }, # Promise
              in: { 
                type_id: { _eq: ${thenTypeId} } # Then
                from_id: { _eq: ${freeId} } # freeId
              }
            }
          },
        }) {
      object { value }
        }
      }`,
    });
    
    // console.log(JSON.stringify(result, null, 2));
    // console.log(JSON.stringify(result?.data?.links[0]?.object?.value, null, 2))

    console.log(result?.data?.links.length);
    console.log(result?.data?.links[0]?.object?.value);

    console.log(JSON.stringify(result?.data?.links, null, 2));

    assert.equal(result?.data?.links[0]?.object?.value, 123);
    

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
