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

const insertOperationHandlerForType = async (handleOperationTypeId: number, typeId: number, code: string) => {
  const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
  const syncTextFileTypeId = await deep.id('@deep-foundation/core', 'SyncTextFile');
  const jsExecutionProviderId = await deep.id('@deep-foundation/core', 'JSExecutionProvider');
  const handlerJSFile = (await deep.insert({ 
    type_id: syncTextFileTypeId,
  }, { name: 'IMPORT_HANDLER_JS_FILE' })).data[0];
  const handlerJSFileValue = (await deep.insert({ link_id: handlerJSFile?.id, value: code }, { table: 'strings' })).data[0];
  const handler = (await deep.insert({
    from_id: jsExecutionProviderId,
    type_id: handlerTypeId,
    to_id: handlerJSFile?.id,
  }, { name: 'IMPORT_HANDLER' })).data[0];
  const handleInsert = (await deep.insert({
    from_id: typeId,
    type_id: handleOperationTypeId,
    to_id: handler?.id,
  }, { name: 'IMPORT_INSERT_HANDLER' })).data[0];
  return {
    handlerId: handler?.id,
    handleInsertId: handleInsert?.id,
    handlerJSFileId: handlerJSFile?.id,
    handlerJSFileValueId: handlerJSFileValue?.id,
  };
};

const deleteHandler = async (handler) => {
  await deep.delete({ id: { _in: [handler.handlerJSFileId, handler.handlerId, handler.handleInsertId]}});
  await deep.delete({ id: { _eq: handler.handlerJSFileValueId}}, { table: 'strings' });
};

export async function ensureLinkIsCreated(typeId: number) {
  const freeId = randomInteger(5000000, 9999999999);
  // console.log(freeId);
  const insertedLink = (await deep.insert({
    id: freeId,
    from_id: freeId,
    type_id: typeId,
    to_id: freeId
  }, { name: 'IMPORT_LINK' })).data[0];
  // console.log(insertedLink);
  assert.equal(freeId, insertedLink.id);
  return freeId;
}

jest.setTimeout(60000);

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe('sync function handle by type with resolve', () => {
  it(`handle insert`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const typeId = await deep.id('@deep-foundation/core', 'Type');

    var handler = await insertOperationHandlerForType(handleInsertTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
    const linkId = await ensureLinkIsCreated(typeId);

    await deep.await(linkId);
    // await delay(30000);

    const client = deep.apolloClient;
    const resultLinks = (await client.query({
      query: gql`{
        links(where: { 
          in: {
            type_id: { _eq: ${resolvedTypeId} }, # Resolved
            from: { 
              type_id: { _eq: ${promiseTypeId} }, # Promise
              in: { 
                type_id: { _eq: ${thenTypeId} } # Then
                from_id: { _eq: ${linkId} } # linkId
              }
            }
          },
        }) {
          id
          object {
            id
            value
          }
          in(where: { type_id: { _eq: ${resolvedTypeId} } }) {
            id
            from {
              id
              in(where: { type_id: { _eq: ${thenTypeId} } }) {
                id
              }
            }
          }
        }
      }`,
    }))?.data?.links;

    const promiseResult = resultLinks.find(link => link.object?.value?.result === numberToReturn);

    assert.isTrue(!!promiseResult);

    const resolvedLinkId = promiseResult?.in?.[0]?.id;
    const thenLinkId = promiseResult?.in?.[0]?.from?.in?.[0]?.id;
    const valueId = promiseResult?.object?.id;
    const promiseResultId = promiseResult?.id;
    const promiseId = promiseResult?.in?.[0]?.from?.id;
    
    // console.log(resolvedLinkId, thenLinkId, valueId, promiseResultId, promiseId);

    // console.log(JSON.stringify(resultLinks, null, 2));
   
    // assert.equal(resultLinks[0]?.object?.value?.result, numberToReturn);

    await deep.delete({ id: { _in: [resolvedLinkId, thenLinkId]}}, { table: 'links' });
    await deep.delete({ id: { _in: [promiseResultId, promiseId, linkId]}}, { table: 'links' });
    await deep.delete({ id: { _eq: valueId }}, { table: 'objects' });

    await deleteHandler(handler);
  });
  it(`handle delete`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
    const typeId = await deep.id('@deep-foundation/core', 'Type');

    var handler = await insertOperationHandlerForType(handleDeleteTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
    const linkId = await ensureLinkIsCreated(typeId);

    await deep.delete({ id: { _eq: linkId }}, { table: 'links' });

    await deep.await(linkId);
    // await delay(30000);

    const client = deep.apolloClient;
    const resultLinks = (await client.query({
      query: gql`{
        links(where: { 
          in: {
            type_id: { _eq: ${resolvedTypeId} }, # Resolved
            from: { 
              type_id: { _eq: ${promiseTypeId} }, # Promise
              in: { 
                type_id: { _eq: ${thenTypeId} } # Then
                from_id: { _eq: ${linkId} } # linkId
              }
            }
          },
        }) {
          id
          object {
            id
            value
          }
          in(where: { type_id: { _eq: ${resolvedTypeId} } }) {
            id
            from {
              id
              in(where: { type_id: { _eq: ${thenTypeId} } }) {
                id
              }
            }
          }
        }
      }`,
    }))?.data?.links;

    const promiseResult = resultLinks.find(link => link.object?.value?.result === numberToReturn);

    assert.isTrue(!!promiseResult);

    const resolvedLinkId = promiseResult?.in?.[0]?.id;
    const thenLinkId = promiseResult?.in?.[0]?.from?.in?.[0]?.id;
    const valueId = promiseResult?.object?.id;
    const promiseResultId = promiseResult?.id;
    const promiseId = promiseResult?.in?.[0]?.from?.id;
    
    // console.log(resolvedLinkId, thenLinkId, valueId, promiseResultId, promiseId);

    // console.log(JSON.stringify(resultLinks, null, 2));

    // assert.isTrue(resultLinks.some(link => link.object?.value?.result === numberToReturn));
    // assert.equal(resultLinks[0]?.object?.value?.result, numberToReturn);

    await deep.delete({ id: { _in: [resolvedLinkId, thenLinkId]}}, { table: 'links' });
    await deep.delete({ id: { _in: [promiseResultId, promiseId, linkId]}}, { table: 'links' });
    await deep.delete({ id: { _eq: valueId }}, { table: 'objects' });

    await deleteHandler(handler);
  });
});

describe('sync function handle by type with reject', () => {
  it(`handle insert`, async () => {
    const numberToThrow = randomInteger(5000000, 9999999999);

    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const typeId = await deep.id('@deep-foundation/core', 'Type');

    var handler = await insertOperationHandlerForType(handleInsertTypeId, typeId, `(arg)=>{ throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

    const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
    const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
    const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
    const linkId = await ensureLinkIsCreated(typeId);

    await deep.await(linkId);
    // await delay(2000);

    const client = deep.apolloClient;
    const resultLinks = (await client.query({
      query: gql`{
        links(where: { 
          in: {
            type_id: { _eq: ${rejectedTypeId} }, # Resolved
            from: { 
              type_id: { _eq: ${promiseTypeId} }, # Promise
              in: { 
                type_id: { _eq: ${thenTypeId} } # Then
                from_id: { _eq: ${linkId} } # linkId
              }
            }
          },
        }) {
          id
          object {
            id
            value
          }
          in(where: { type_id: { _eq: ${rejectedTypeId} } }) {
            id
            from {
              id
              in(where: { type_id: { _eq: ${thenTypeId} } }) {
                id
              }
            }
          }
        }
      }`,
    }))?.data?.links;

    const promiseResult = resultLinks.find(link => link.object?.value === numberToThrow);

    assert.isTrue(!!promiseResult);

    const rejectedLinkId = promiseResult?.in?.[0]?.id;
    const thenLinkId = promiseResult?.in?.[0]?.from?.in?.[0]?.id;
    const valueId = promiseResult?.object?.id;
    const promiseResultId = promiseResult?.id;
    const promiseId = promiseResult?.in?.[0]?.from?.id;
    
    // console.log(resolvedLinkId, thenLinkId, valueId, promiseResultId, promiseId);

    // console.log(JSON.stringify(resultLinks, null, 2));

    // assert.isTrue(resultLinks.some(link => link.object?.value === numberToThrow));
    // assert.equal(resultLinks [0]?.object?.value, numberToReturn);

    await deep.delete({ id: { _in: [rejectedLinkId, thenLinkId]}}, { table: 'links' });
    await deep.delete({ id: { _in: [promiseResultId, promiseId, linkId]}}, { table: 'links' });
    await deep.delete({ id: { _eq: valueId }}, { table: 'objects' });

    await deleteHandler(handler);
  });
});

describe('async function handle by type with reject', () => {
  it(`handle insert`, async () => {
    const numberToThrow = randomInteger(5000000, 9999999999);

    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const typeId = await deep.id('@deep-foundation/core', 'Type');

    var handler = await insertOperationHandlerForType(handleInsertTypeId, typeId, `async (arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

    const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
    const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
    const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
    const linkId = await ensureLinkIsCreated(typeId);

    await deep.await(linkId);
    // await delay(2000);

    const client = deep.apolloClient;
    const resultLinks = (await client.query({
      query: gql`{
        links(where: { 
          in: {
            type_id: { _eq: ${rejectedTypeId} }, # Resolved
            from: { 
              type_id: { _eq: ${promiseTypeId} }, # Promise
              in: { 
                type_id: { _eq: ${thenTypeId} } # Then
                from_id: { _eq: ${linkId} } # linkId
              }
            }
          },
        }) {
          id
          object {
            id
            value
          }
          in(where: { type_id: { _eq: ${rejectedTypeId} } }) {
            id
            from {
              id
              in(where: { type_id: { _eq: ${thenTypeId} } }) {
                id
              }
            }
          }
        }
      }`,
    }))?.data?.links;

    const promiseResult = resultLinks.find(link => link.object?.value === numberToThrow);

    assert.isTrue(!!promiseResult);

    const rejectedLinkId = promiseResult?.in?.[0]?.id;
    const thenLinkId = promiseResult?.in?.[0]?.from?.in?.[0]?.id;
    const valueId = promiseResult?.object?.id;
    const promiseResultId = promiseResult?.id;
    const promiseId = promiseResult?.in?.[0]?.from?.id;
    
    // console.log(resolvedLinkId, thenLinkId, valueId, promiseResultId, promiseId);

    // console.log(JSON.stringify(resultLinks, null, 2));

    // assert.isTrue(resultLinks.some(link => link.object?.value === numberToThrow));
    // assert.equal(resultLinks [0]?.object?.value, numberToReturn);

    await deep.delete({ id: { _in: [rejectedLinkId, thenLinkId]}}, { table: 'links' });
    await deep.delete({ id: { _in: [promiseResultId, promiseId, linkId]}}, { table: 'links' });
    await deep.delete({ id: { _eq: valueId }}, { table: 'objects' });

    await deleteHandler(handler);
  });
});

// describe('handle by selector', () => {
//   it(`handle insert`, async () => {
//     const typeId = await deep.id('@deep-foundation/core', 'Type');
//     const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
//     const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
//     const thenTypeId = await deep.id('@deep-foundation/core', 'Then');

//     // selector -- selection -> link (concrete)
//     const selectorTypeId = await deep.id('@deep-foundation/core', 'Selector');
//     const selectionTypeId = await deep.id('@deep-foundation/core', 'Selection');

//     const userTypeId = await deep.id('@deep-foundation/core', 'User');
    
//     const selector = (await deep.insert({ 
//       type_id: selectorTypeId
//     }, { name: 'IMPORT_SELECTOR' })).data[0];

//     const link = (await deep.insert({ 
//       type_id: userTypeId,
//     }, { name: 'IMPORT_LINK' })).data[0];

//     const selection = (await deep.insert({ 
//       from_id: selector.id,
//       type_id: selectionTypeId,
//       to_id: link.id,
//     }, { name: 'IMPORT_SELECTION' })).data[0];

//     console.log(link);

//     await deep.await(link.id);
//     // await delay(2000);

//     const client = deep.apolloClient;
//     const result = await client.query({
//       query: gql`{
//         links(where: { 
//           in: { 
//             type_id: { _eq: ${resolvedTypeId} }, # Resolved
//             from: { 
//               type_id: { _eq: ${promiseTypeId} }, # Promise
//               in: { 
//                 type_id: { _eq: ${thenTypeId} } # Then
//                 from_id: { _eq: ${link.id} } # link.id
//               }
//             }
//           },
//         }) {
//       object { value }
//         }
//       }`,
//     });
    
//     // console.log(JSON.stringify(result, null, 2));
//     // console.log(JSON.stringify(result?.data?.links[0]?.object?.value, null, 2))

//     console.log(result?.data?.links.length);
//     console.log(result?.data?.links[0]?.object?.value);

//     console.log(JSON.stringify(result?.data?.links, null, 2));

//     assert.equal(result?.data?.links[0]?.object?.value?.result, 123);
    

//     // TODO: check result link is created
//     // TODO: check resolve link is created

//     // assert.deepEqual(deepClient.boolExpSerialize({ id: 5 }), { id: { _eq: 5 } });
//   });
// });

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
