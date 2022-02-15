import { execSync } from 'child_process';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import gql from "graphql-tag";

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

const insertOperationHandlerForType = async (handleOperationTypeId: number, typeId: number, code: string) => {
  const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
  const syncTextFileTypeId = await deep.id('@deep-foundation/core', 'SyncTextFile');
  const isolationProviderThatSupportsJSExecutionProviderId = await deep.id('@deep-foundation/core', 'dockerSupportsJs');
  const handlerJSFile = (await deep.insert({ 
    type_id: syncTextFileTypeId,
  }, { name: 'IMPORT_HANDLER_JS_FILE' })).data[0];
  const handlerJSFileValue = (await deep.insert({ link_id: handlerJSFile?.id, value: code }, { table: 'strings' })).data[0];
  const handler = (await deep.insert({
    from_id: isolationProviderThatSupportsJSExecutionProviderId,
    type_id: handlerTypeId,
    to_id: handlerJSFile?.id,
  }, { name: 'IMPORT_HANDLER' })).data[0];
  const handleOperation = (await deep.insert({
    from_id: typeId,
    type_id: handleOperationTypeId,
    to_id: handler?.id,
  }, { name: 'IMPORT_INSERT_HANDLER' })).data[0];
  return {
    handlerId: handler?.id,
    handleOperationId: handleOperation?.id,
    handlerJSFileId: handlerJSFile?.id,
    handlerJSFileValueId: handlerJSFileValue?.id,
  };
};

const insertOperationHandlerForSchedule = async (schedule: string, code: string) => {
  const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
  const scheduleTypeId = await deep.id('@deep-foundation/core', 'Schedule');
  const handleScheduleTypeId = await deep.id('@deep-foundation/core', 'HandleSchedule');
  const syncTextFileTypeId = await deep.id('@deep-foundation/core', 'SyncTextFile');
  const isolationProviderThatSupportsJSExecutionProviderId = await deep.id('@deep-foundation/core', 'dockerSupportsJs');
  const handlerJSFile = (await deep.insert({ 
    type_id: syncTextFileTypeId,
  }, { name: 'IMPORT_HANDLER_JS_FILE' })).data[0];
  const handlerJSFileValue = (await deep.insert({ link_id: handlerJSFile?.id, value: code }, { table: 'strings' })).data[0];
  const handler = (await deep.insert({
    from_id: isolationProviderThatSupportsJSExecutionProviderId,
    type_id: handlerTypeId,
    to_id: handlerJSFile?.id,
  }, { name: 'IMPORT_HANDLER' })).data[0];
  const scheduleNode = (await deep.insert({
    type_id: scheduleTypeId,
  }, { name: 'IMPORT_SCHEDULE' })).data[0];
  // console.log(typeof schedule)
  const scheduleValue = (await deep.insert({ link_id: scheduleNode?.id, value: schedule }, { table: 'strings' })).data[0];
  const handleOperation = (await deep.insert({
    from_id: scheduleNode?.id,
    type_id: handleScheduleTypeId,
    to_id: handler?.id,
  }, { name: 'IMPORT_INSERT_HANDLER' })).data[0];
  return {
    handlerId: handler?.id,
    handleOperationId: handleOperation?.id,
    handlerJSFileId: handlerJSFile?.id,
    handlerJSFileValueId: handlerJSFileValue?.id,
    scheduleId: scheduleNode?.id,
    scheduleValueId: scheduleValue?.id,
  };
};

export async function deleteId(id: number, options: {
  table?: string;
  returning?: string;
  variables?: any;
  name?: string;
} = { table: 'links' })
{
  deleteIds([id], options);
}

export async function deleteIds(ids: number[], options: {
  table?: string;
  returning?: string;
  variables?: any;
  name?: string;
} = { table: 'links' }) {
  const idsFiltered = ids?.filter(linkId => typeof linkId === 'number');
  if (idsFiltered?.length > 0) {
    // console.log(`${options.table}, deleteIds[0..${idsFiltered.length}]: ${idsFiltered.join(', ')}`);
    return await deep.delete({
      id: { _in: idsFiltered },
    }, options);
  } else {
    return { data: [] };
  }
}

export async function deletePromiseResult(promiseResult: any, linkId: any = null) {
  const resultLinkId = promiseResult?.in?.[0]?.id;
  const thenLinkId = promiseResult?.in?.[0]?.from?.in?.[0]?.id;
  const valueId = promiseResult?.object?.id;
  const promiseResultId = promiseResult?.id;
  const promiseId = promiseResult?.in?.[0]?.from?.id;
  await deleteIds([resultLinkId, thenLinkId]);
  await deleteIds([promiseResultId, promiseId, linkId]);
  await deleteId(valueId, { table: 'objects' });
}

export const deleteHandler = async (handler) => {
  await deleteIds([handler.handlerJSFileId, handler.handlerId, handler.handleOperationId]);
  await deleteId(handler.handlerJSFileValueId, { table: 'strings' });
};

export const deleteScheduleHandler = async (handler) => {
  await deleteHandler(handler);
  await deleteId(handler.scheduleId);
  await deleteId(handler.scheduleValueId, { table: 'strings' });
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

export async function getPromiseResults(deep, rejectedTypeId: number, linkId: any) {
  const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
  const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
  const client = deep.apolloClient;
  const queryString = `{
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
  }`;
  return (await client.query({
    query: gql`${queryString}`,
  }))?.data?.links;
}

jest.setTimeout(120000);

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe('sync function handle by type with resolve', () => {
  it(`handle insert`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const handler = await insertOperationHandlerForType(handleInsertTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    const linkId = await ensureLinkIsCreated(typeId);
    await deep.await(linkId);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);
    assert.isTrue(!!promiseResult);
  });
  it(`handle update when value is inserted`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
    const handler = await insertOperationHandlerForType(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    const linkId = await ensureLinkIsCreated(typeId);

    // Trigger link update by inserting a new value
    await deep.insert({ link_id: linkId, value: numberToReturn }, { table: 'numbers' });
    await deep.await(linkId);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    let promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);
    assert.isTrue(!!promiseResult);
  });
  it(`handle update when value is updated`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
    const handler = await insertOperationHandlerForType(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    const linkId = await ensureLinkIsCreated(typeId);

    await deep.insert({ link_id: linkId, value: numberToReturn }, { table: 'numbers' });
    await deep.await(linkId);

    // Trigger link update by updating the value
    await deep.update({ link_id: linkId }, { value: numberToReturn+1 }, { table: 'numbers' });
    await deep.await(linkId);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
    const matchedPromiseResults = promiseResults.filter(link => link.object?.value?.result === numberToReturn);

    for (const promiseResult of matchedPromiseResults)
    {
      await deletePromiseResult(promiseResult);
    }
    await deleteId(linkId);
    await deleteHandler(handler);
    assert.isTrue(!!matchedPromiseResults);
    assert.equal(matchedPromiseResults.length, 2);
  });
  it(`handle update when value is deleted`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
    const handler = await insertOperationHandlerForType(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    const linkId = await ensureLinkIsCreated(typeId);

    await deep.insert({ link_id: linkId, value: numberToReturn }, { table: 'numbers' });
    await deep.await(linkId);

    // Trigger link update by deleting the value
    await deep.delete({ link_id: { _eq: linkId } }, { table: 'numbers' });
    await deep.await(linkId);
    // await delay(40000);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
    const matchedPromiseResults = promiseResults.filter(link => link.object?.value?.result === numberToReturn);

    for (const promiseResult of matchedPromiseResults)
    {
      await deletePromiseResult(promiseResult);
    }
    await deleteId(linkId);
    await deleteHandler(handler);
    assert.isTrue(!!matchedPromiseResults);
    assert.equal(matchedPromiseResults.length, 2);
  });
  it(`handle delete`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
    const handler = await insertOperationHandlerForType(handleDeleteTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    const linkId = await ensureLinkIsCreated(typeId);
    await deleteId(linkId);
    await deep.await(linkId);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);

    await deletePromiseResult(promiseResult, linkId);

    await deleteHandler(handler);
    assert.isTrue(!!promiseResult);
  });
});

describe('sync function handle by type with reject', () => {
  it(`handle insert`, async () => {
    const numberToThrow = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const handler = await insertOperationHandlerForType(handleInsertTypeId, typeId, `(arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

    const linkId = await ensureLinkIsCreated(typeId);

    await deep.await(linkId);

    const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
    const promiseResults = await getPromiseResults(deep, rejectedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value === numberToThrow);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);
    assert.isTrue(!!promiseResult);
  });
  it(`handle delete`, async () => {
    const numberToThrow = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
    const handler = await insertOperationHandlerForType(handleDeleteTypeId, typeId, `(arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

    const linkId = await ensureLinkIsCreated(typeId);
    await deleteId(linkId);
    await deep.await(linkId);

    const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
    const promiseResults = await getPromiseResults(deep, rejectedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value === numberToThrow);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);
    assert.isTrue(!!promiseResult);
  });
});

describe('async function handle by type with reject', () => {
  it(`handle insert`, async () => {
    const numberToThrow = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const handler = await insertOperationHandlerForType(handleInsertTypeId, typeId, `async (arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

    const linkId = await ensureLinkIsCreated(typeId);

    await deep.await(linkId);

    const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
    const promiseResults = await getPromiseResults(deep, rejectedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value === numberToThrow);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);
    assert.isTrue(!!promiseResult);
  });
  it(`handle delete`, async () => {
    const numberToThrow = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
    const handler = await insertOperationHandlerForType(handleDeleteTypeId, typeId, `async (arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

    const linkId = await ensureLinkIsCreated(typeId);
    await deleteId(linkId);
    await deep.await(linkId);
    const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
    const promiseResults = await getPromiseResults(deep, rejectedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value === numberToThrow);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);
    assert.isTrue(!!promiseResult);
  });
});

describe('sync function handle by schedule with resolve', () => {
  it(`handle schedule`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    // const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handler = await insertOperationHandlerForSchedule('* * * * *', `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    await deep.await(handler.scheduleId);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults = await getPromiseResults(deep, resolvedTypeId, handler.scheduleId);
    const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);
    await deletePromiseResult(promiseResult, handler.scheduleId);
    await deleteScheduleHandler(handler);

    assert.isTrue(!!promiseResult);

  });
});

describe('async function handle by type with resolve using deep client', () => {
  it(`handle insert`, async () => {
    const numberToReturn = randomInteger(5000000, 9999999999);

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const queryTypeId = await deep.id('@deep-foundation/core', 'Query');
    const handler = await insertOperationHandlerForType(handleInsertTypeId, typeId, `async (arg) => {
       const deep = arg.deep;
       const queryTypeId = await deep.id('@deep-foundation/core', 'Query');
       const queryId = (await deep.insert({ type_id: queryTypeId }))?.data?.[0]?.id;
      //  const queryId = (await deep.insert({ type_id: ${queryTypeId} }))?.data?.[0]?.id;
       return { queryId, result: ${numberToReturn}}
    }`);

    const linkId = await ensureLinkIsCreated(typeId);
    await deep.await(linkId);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);

    // console.log(JSON.stringify(promiseResults, null, 2));
    const queryId = promiseResult?.object?.value?.queryId;
    const query = (await deep.select({ id: { _eq: queryId }})).data[0];

    // assert.equal(query.type_id, queryTypeId);
    assert.equal(query.id, queryId);

    assert.isTrue(!!promiseResult);

    await deleteId(queryId);

    await deletePromiseResult(promiseResult, linkId);

    await deleteHandler(handler);
  });
});

// describe('handle port', () => {
//   it(`handle port`, async () => {
//     const port = 80;
//     const portTypeId = await deep.id('@deep-foundation/core', 'Port');
//     const portId = (await deep.insert({
//       type_id: portTypeId,
//       number: { data: { value: port } }
//     }))?.data?.[0]?.id;

//     const jsDockerIsolationProviderId = await deep.id('@deep-foundation/core', 'JSDockerIsolationProvider');

//     const handlePortTypeId = await deep.id('@deep-foundation/core', 'HandlePort');
//     const hanlePortLinkId = (await deep.insert({ from_id: portId, type_id: handlePortTypeId, to_id: jsDockerIsolationProviderId }))?.data?.[0]?.id;

//     await deep.await(hanlePortLinkId);

//     console.log("waiting for container to be created");
//     execSync(`npx wait-on http://localhost:${port}/healthz`);
//     console.log("container is up");

//     // Check if port handler docker container responds to health check

//     // await delay(5000);

//     await deleteId(hanlePortLinkId);

//     // Check if port handler docker container does not respond to health check

//   });
// });

// describe('handle by selector', () => {
//   it(`handle insert`, async () => {
//     const typeId = await deep.id('@deep-foundation/core', 'Type');
//     const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
//     const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
//     const thenTypeId = await deep.id('@deep-foundation/core', 'Then');

//     // selector -- selection -> link (concrete)
//     const selectorTypeId = await deep.id('@deep-foundation/core', 'Selector');
//     const selectionTypeId = await deep.id('@deep-foundation/core', 'Include');

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
