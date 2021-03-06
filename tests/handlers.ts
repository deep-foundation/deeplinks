import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import gql from "graphql-tag";
import Debug from 'debug';
import fetch from 'node-fetch';
import { insertHandler, insertSelector, insertSelectorItem, ensureLinkIsCreated, deleteHandler, deleteSelector, deleteId, deleteIds }  from "../imports/handlers";

const debug = Debug('deeplinks:tests:handlers');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

// Debug.enable(`${namespaces ? `${namespaces},` : ``}*:error`); // Force enable all errors output

import waitOn from 'wait-on';
import getPort from 'get-port';

jest.setTimeout(120000);

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

let packageWithPermissions;

let lastFreeId = 9999999999;

const nextFreeId = () => {
  lastFreeId -= 1;
  return lastFreeId;
};

let lastHandlerResult = 1;

const nextHandlerResult = () => {
  lastHandlerResult += 1;
  return lastHandlerResult;
};

const collectIds = (data: any) => {
  const ids = [];
  if (Array.isArray(data)) {
    data.forEach(item => {
      collectIds(item).forEach(id => ids.push(id));
    });
  }
  if (data.id) {
    ids.push(data.id);
  }
  if (data.to) {
    collectIds(data.to).forEach(id => ids.push(id));
  }
  if (data.from) {
    collectIds(data.from).forEach(id => ids.push(id));
  }
  if (data.in) {
    data.in.forEach(item => {
      collectIds(item).forEach(id => ids.push(id));
    });
  }
  if (data.out) {
    data.out.forEach(item => {
      collectIds(item).forEach(id => ids.push(id));
    });
  }
  return ids;
};

const insertPackageWithPermissions = async (forcePackageId?) => {
  const Rule = await deep.id('@deep-foundation/core', 'Rule');
  const RuleSubject = await deep.id('@deep-foundation/core', 'RuleSubject');
  const Selector = await deep.id('@deep-foundation/core', 'Selector');
  const RuleObject = await deep.id('@deep-foundation/core', 'RuleObject');
  const RuleAction = await deep.id('@deep-foundation/core', 'RuleAction');
  const SelectorInclude = await deep.id('@deep-foundation/core', 'SelectorInclude');
  const SelectorTree = await deep.id('@deep-foundation/core', 'SelectorTree');
  const AllowSelect = await deep.id('@deep-foundation/core', 'AllowSelect');
  const AllowInsertType = await deep.id('@deep-foundation/core', 'AllowInsertType');
  const containTree = await deep.id('@deep-foundation/core', 'containTree');
  const joinTree = await deep.id('@deep-foundation/core', 'joinTree');
  
  let packageId;
  let packageValueId;
  let containId;
  let containValueId;
  let typeId;
  if (forcePackageId) {
    packageId = forcePackageId;
  } else {
    const packageTypeId = await deep.id('@deep-foundation/core', 'Package');
    const containTypeId = await deep.id('@deep-foundation/core', 'Contain');
    const typeTypeId = await deep.id('@deep-foundation/core', 'Type');
    const $package = (await deep.insert({
      type_id: packageTypeId,
      string: { data: { value: '@deep-foundation/test-package' } },
      out: {
        data: {
          type_id: containTypeId,
          string: { data: { value: 'test-type' } },
          to: {
            data: {
              type_id: typeTypeId
            }
          },
        }
      }
    }, { name: 'INSERT_PACKAGE', returning: `
      id
      string {
        id
      }
      out {
        id
        string {
          id
        }
        to {
          id
        }
      }
    `})).data[0] as any;
    packageId = $package.id;
    packageValueId = $package.string.id;
    containId = $package?.out?.[0]?.id;
    containValueId = $package?.out?.[0]?.string?.[0]?.id;
    typeId = $package?.out?.[0]?.to?.id;
  }
  const rule = await deep.insert({
    type_id: Rule,
    out: { data: [
      {
        type_id: RuleSubject,
        to: { data: {
          type_id: Selector,
          out: { data: [
            {
              type_id: SelectorInclude,
              to_id: packageId,
              out: { data: {
                type_id: SelectorTree,
                to_id: joinTree,
              }, },
            },
          ] },
        }, },
      },
      {
        type_id: RuleObject,
        to: { data: {
          type_id: Selector,
          out: { data: [
            {
              type_id: SelectorInclude,
              to_id: packageId,
              out: { data: {
                type_id: SelectorTree,
                to_id: containTree,
              }, },
            },
          ], },
        }, },
      },
      {
        type_id: RuleAction,
        to: { data: {
          type_id: Selector,
          out: { data: [
            {
              type_id: SelectorInclude,
              to_id: AllowInsertType,
              out: { data: {
                type_id: SelectorTree,
                to_id: containTree,
              }, },
            },
            {
              type_id: SelectorInclude,
              to_id: AllowSelect,
              out: { data: {
                type_id: SelectorTree,
                to_id: containTree,
              }, },
            }
          ], },
        }, },
      },
    ], },
  }, { returning: `
    id
    out {
      id
      to {
        id
        out {
          id
          out {
            id
          }
        }
      }
    }
  ` });
  // console.log(JSON.stringify(rule, null, 2));
  const ids = collectIds(rule.data);
  // console.log(JSON.stringify(ids, null, 2));
  return { packageId, packageValueId, containId, containValueId, typeId, ruleIds: ids };
};

const deletePackageWithPermissions = async ($package: any) => {
  await deleteId($package.typeId);
  await deleteId($package.containValueId, { table: 'strings' });
  await deleteId($package.containId);
  await deleteId($package.packageValueId, { table: 'strings' });
  await deleteId($package.packageId);
  await deleteIds($package.ruleIds, error);
};

const insertOperationHandlerForSchedule = async (schedule: string, code: string, forceOwnerId?: number) => {
  const syncTextFileTypeId = await deep.id('@deep-foundation/core', 'SyncTextFile');
  const handlerJSFile = (await deep.insert({ 
    type_id: syncTextFileTypeId,
  }, { name: 'INSERT_HANDLER_JS_FILE' })).data[0];
  const handlerJSFileValue = (await deep.insert({ link_id: handlerJSFile?.id, value: code }, { table: 'strings' })).data[0];
  const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
  const isolationProviderThatSupportsJSExecutionProviderId = await deep.id('@deep-foundation/core', 'dockerSupportsJs');
  const handler = (await deep.insert({
    from_id: isolationProviderThatSupportsJSExecutionProviderId,
    type_id: handlerTypeId,
    to_id: handlerJSFile?.id,
  }, { name: 'INSERT_HANDLER' })).data[0];
  const ownerId = forceOwnerId || (await deep.id('deep', 'admin'));
  const ownerContainHandler = (await deep.insert({
    from_id: ownerId,
    type_id: await deep.id('@deep-foundation/core', 'Contain'),
    to_id: handler?.id,
  }, { name: 'INSERT_ADMIN_CONTAIN_HANDLER' })).data[0];
  const scheduleTypeId = await deep.id('@deep-foundation/core', 'Schedule');
  const scheduleNode = (await deep.insert({
    type_id: scheduleTypeId,
  }, { name: 'INSERT_SCHEDULE' })).data[0];
  // log(typeof schedule)
  const scheduleValue = (await deep.insert({ link_id: scheduleNode?.id, value: schedule }, { table: 'strings' })).data[0];
  const handleScheduleTypeId = await deep.id('@deep-foundation/core', 'HandleSchedule');
  const handleOperation = (await deep.insert({
    from_id: scheduleNode?.id,
    type_id: handleScheduleTypeId,
    to_id: handler?.id,
  }, { name: 'INSERT_INSERT_HANDLER' })).data[0];
  return {
    handlerId: handler?.id,
    handleOperationId: handleOperation?.id,
    handlerJSFileId: handlerJSFile?.id,
    handlerJSFileValueId: handlerJSFileValue?.id,
    scheduleId: scheduleNode?.id,
    scheduleValueId: scheduleValue?.id,
    ownerContainHandlerId: ownerContainHandler?.id,
  };
};

export async function deletePromiseResult(promiseResult: any, linkId?: any) {
  const resultLinkId = promiseResult?.in?.[0]?.id;
  const thenLinkId = promiseResult?.in?.[0]?.from?.in?.[0]?.id;
  const valueId = promiseResult?.object?.id;
  const promiseResultId = promiseResult?.id;
  const promiseId = promiseResult?.in?.[0]?.from?.id;
  const promiseReasonId = promiseResult?.in?.[0]?.out?.[0]?.id;
  await deleteId(promiseReasonId);
  await deleteIds([resultLinkId, thenLinkId], error);
  await deleteId(valueId, { table: 'objects' });
  await deleteIds([promiseResultId, promiseId, linkId], error);
}

export const deleteScheduleHandler = async (handler) => {
  await deleteHandler(handler);
  await deleteId(handler.scheduleValueId, { table: 'strings' });
  await deleteId(handler.scheduleId);
};


export async function getPromiseResults(deep, resultTypeId: number, linkId: any) {
  const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
  const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
  const promiseReasonTypeId = await deep.id('@deep-foundation/core', 'PromiseReason');
  const client = deep.apolloClient;
  const queryString = `{
    links(where: { 
      in: {
        type_id: { _eq: ${resultTypeId} }, # Resolved/Rejected
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
      in(where: { type_id: { _eq: ${resultTypeId} } }) {
        id
        from {
          id
          in(where: { type_id: { _eq: ${thenTypeId} } }) {
            id
          }
        }
        out(where: { type_id: { _eq: ${promiseReasonTypeId} } }) {
          id
        }
      }
    }
  }`;
  return (await client.query({
    query: gql`${queryString}`,
  }))?.data?.links;
}

// function randomInteger(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

beforeAll(async () => {
  // const packageId = await deep.id('@deep-foundation/core');
  // packageWithPermissions = await insertPackageWithPermissions(packageId);
  packageWithPermissions = await insertPackageWithPermissions();
  // console.log(JSON.stringify(packageWithPermissions, null, 2));
});

afterAll(async () => {
  // console.log(JSON.stringify(packageWithPermissions, null, 2));
  // console.log(JSON.stringify(packageWithPermissions?.ruleIds, null, 2));
  // await deleteIds(packageWithPermissions?.ruleIds);
  deletePackageWithPermissions(packageWithPermissions);
});

describe('sync function handle by type with resolve', () => {
  it(`handle insert`, async () => {
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const handler = await insertHandler(handleInsertTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

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
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
    const handler = await insertHandler(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

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
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
    const handler = await insertHandler(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

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
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
    const handler = await insertHandler(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

    const linkId = await ensureLinkIsCreated(typeId);

    await deep.insert({ link_id: linkId, value: numberToReturn }, { table: 'numbers' });
    await deep.await(linkId);

    // Trigger link update by deleting the value
    await deep.delete({ link_id: { _eq: linkId } }, { table: 'numbers' });
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
  it(`handle delete`, async () => {
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
    const handler = await insertHandler(handleDeleteTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

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
  it.only(`handle insert`, async () => {
    // const numberToThrow = randomInteger(5000000, 9999999999);
    const numberToThrow = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const handler = await insertHandler(handleInsertTypeId, typeId, `(arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

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
    // const numberToThrow = randomInteger(5000000, 9999999999);
    const numberToThrow = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
    const handler = await insertHandler(handleDeleteTypeId, typeId, `(arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

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
    // const numberToThrow = randomInteger(5000000, 9999999999);
    const numberToThrow = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const handler = await insertHandler(handleInsertTypeId, typeId, `async (arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

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
    // const numberToThrow = randomInteger(5000000, 9999999999);
    const numberToThrow = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
    const handler = await insertHandler(handleDeleteTypeId, typeId, `async (arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

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
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

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
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const queryTypeId = await deep.id('@deep-foundation/core', 'Query');
    const handler = await insertHandler(handleInsertTypeId, typeId, `async (arg) => {
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

    // log(JSON.stringify(promiseResults, null, 2));
    const queryId = promiseResult?.object?.value?.queryId;
    const query = (await deep.select({ id: { _eq: queryId }})).data[0];

    await deleteId(queryId);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);

    // assert.equal(query.type_id, queryTypeId);
    assert.equal(query.id, queryId);
    assert.isTrue(!!promiseResult);
  });
  it(`handle insert with package jwt`, async () => {
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const handler = await insertHandler(handleInsertTypeId, typeId, `async (arg) => {
       const deep = arg.deep;
       const nodeTypeId = await deep.id('@deep-foundation/test-package', 'test-type');
       const nodeId = (await deep.insert({ type_id: nodeTypeId }))?.data?.[0]?.id;
       return { nodeId, result: ${numberToReturn}}
    }`, packageWithPermissions.packageId);

    const linkId = await ensureLinkIsCreated(typeId);
    await deep.await(linkId);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);

    // log(JSON.stringify(promiseResults, null, 2));
    const nodeId = promiseResult?.object?.value?.nodeId;
    const node = (await deep.select({ id: { _eq: nodeId }})).data[0];

    await deleteId(nodeId);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);

    assert.equal(node.id, nodeId);
    assert.isTrue(!!promiseResult);
  });
});

describe('handle port', () => {
  it(`handle port`, async () => {
    const port = await getPort();
    const portTypeId = await deep.id('@deep-foundation/core', 'Port');
    const portId = (await deep.insert({
      type_id: portTypeId,
      number: { data: { value: port } }
    }))?.data?.[0]?.id;

    const jsDockerIsolationProviderId = await deep.id('@deep-foundation/core', 'JSDockerIsolationProvider');

    const handlePortTypeId = await deep.id('@deep-foundation/core', 'HandlePort');
    const hanlePortLinkId = (await deep.insert({ from_id: portId, type_id: handlePortTypeId, to_id: jsDockerIsolationProviderId }))?.data?.[0]?.id;

    await deep.await(hanlePortLinkId);

    // await delay(10000);

    // Check if port handler docker container responds to health check
    log("waiting for container to be created");
    await waitOn({ resources: [`http://localhost:${port}/healthz`] });
    log("container is up");

    await deleteId(hanlePortLinkId);

    // await delay(20000);

    // Check if port handler docker container does not respond to health check
    log("waiting for container to be removed");
    await waitOn({
      resources: [
        `http://localhost:${port}/healthz`
      ],
      reverse: true,
    });
    log("container is down");
  });
});

describe('handle route', () => {
  it(`handle route`, async () => {
    // const port = await getPort(); // conflicts with container-controller port allocation
    const port = 4005;
    const portTypeId = await deep.id('@deep-foundation/core', 'Port');
    
    const portId = (await deep.insert({
      type_id: portTypeId,
    }))?.data?.[0]?.id;
    const portValue = (await deep.insert({ 
      link_id: portId, 
      value: port 
    }, { table: 'numbers' }))?.data?.[0];

    const routeTypeId = await deep.id('@deep-foundation/core', 'Route');
    const routeId = (await deep.insert({
      type_id: routeTypeId,
    }))?.data?.[0]?.id;

    const routerTypeId = await deep.id('@deep-foundation/core', 'Router');
    const routerId = (await deep.insert({
      type_id: routerTypeId,
    }))?.data?.[0]?.id;

    const routerListeningTypeId = await deep.id('@deep-foundation/core', 'RouterListening');
    const routerListeningId = (await deep.insert({
      type_id: routerListeningTypeId,
      from_id: routerId,
      to_id: portId,
    }))?.data?.[0]?.id;

    const route = '/passport';

    const routerStringUseTypeId = await deep.id('@deep-foundation/core', 'RouterStringUse');
    const routerStringUseId = (await deep.insert({
      type_id: routerStringUseTypeId,
      to_id: routerId,
      from_id: routeId,
      string: { data: { value: route } }
    }))?.data?.[0]?.id;

    const syncTextFileTypeId = await deep.id('@deep-foundation/core', 'SyncTextFile');
    const handlerJSFile = (await deep.insert({
      type_id: syncTextFileTypeId,
    }, { name: 'INSERT_HANDLER_JS_FILE' })).data[0];
    const handlerJSFileValue = (await deep.insert({ link_id: handlerJSFile?.id, value: `async (req, res) => { res.send('ok'); }` }, { table: 'strings' })).data[0];
    
    const isolationProviderThatSupportsJSExecutionProviderId = await deep.id('@deep-foundation/core', 'dockerSupportsJs');
    const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
    const handlerId = (await deep.insert({
      type_id: handlerTypeId,
      from_id: isolationProviderThatSupportsJSExecutionProviderId,
      to_id: handlerJSFile?.id,
    }))?.data?.[0]?.id;

    const containTypeId = await deep.id('@deep-foundation/core', 'Contain');
    // const ownerId = forceOwnerId || (await deep.id('deep', 'admin'));
    const ownerId = await deep.id('deep', 'admin');
    const ownerContainHandler = (await deep.insert({
      from_id: ownerId,
      type_id: containTypeId,
      to_id: handlerId,
    }, { name: 'INSERT_ADMIN_CONTAIN_HANDLER' })).data[0];

    const handleRouteTypeId = await deep.id('@deep-foundation/core', 'HandleRoute');
    const handleRouteLinkId = (await deep.insert({
      from_id: routeId,
      type_id: handleRouteTypeId,
      to_id: handlerId,
    }))?.data?.[0]?.id;

    const url = `http://localhost:${port}${route}`

    log("waiting for route to be created");
    await waitOn({ resources: [url] });
    log("route handler is up");

    // ensure response is ok
    const response = await fetch(url);
    const text = await response.text();
    assert.equal(text, 'ok');

    // delete all
    await deleteId(handleRouteLinkId);
    await deleteId(ownerContainHandler.id);
    await deleteId(handlerId);
    await deleteId(handlerJSFileValue.id, { table: 'strings' });
    await deleteId(handlerJSFile.id);
    await deleteId(routerStringUseId);
    await deleteId(routerListeningId);
    await deleteId(routerId);
    await deleteId(routeId);
    await deleteId(portValue.id, { table: 'numbers' });
    await deleteId(portId);

    log("waiting for route to be deleted");
    await waitOn({ resources: [url], reverse: true });
    log("route handler is down");
  });
  it(`handle route hierarchical insert`, async () => {
    // const port = await getPort(); // conflicts with container-controller port allocation
    const port = 4001;
    const route = '/passport';

    const insertResult = await deep.insert({
      type_id: await deep.id('@deep-foundation/core', 'Port'),
      number: { data: { value: port } },
      in: { data: {
        type_id: await deep.id('@deep-foundation/core', 'RouterListening'),
        from: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Router'),
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'RouterStringUse'),
            string: { data: { value: route } },
            from: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Route'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'HandleRoute'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Handler'),
                  from_id: await deep.id('@deep-foundation/core', 'dockerSupportsJs'),
                  in: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'Contain'),
                    // from_id: deep.linkId,
                    from_id: await deep.id('deep', 'admin'),
                    string: { data: { value: 'passport' } },
                  } },
                  to: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
                    string: { data: {
                      value: /*javascript*/`async (req, res) => { res.send('ok'); }`,
                    } },
                  } },
                } },
              } },
            } },
          } },
        } },
      } },
    }, { 
      returning: `
        id
        number {
          id
        }
        in {
          id
          from {
            id
            in {
              id
              from {
                id
                out {
                  id
                  to {
                    id
                    in {
                      id
                      string {
                        id
                      }
                    }
                    to {
                      id
                      string {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `, 
      name: 'INSERT_HANDLE_ROUTE_HIERARCHICAL',
    }) as any;

    const portId = insertResult?.data?.[0]?.id;
    const portValueId = insertResult?.data?.[0]?.number?.id;
    const routerListeningId = insertResult?.data?.[0]?.in?.[0]?.id;
    const routerId = insertResult?.data?.[0]?.in?.[0]?.from?.id;
    const routerStringUseId = insertResult?.data?.[0]?.in?.[0]?.from?.in?.[0]?.id;
    const routeId = insertResult?.data?.[0]?.in?.[0]?.from?.in?.[0]?.from?.id;
    const handleRouteId = insertResult?.data?.[0]?.in?.[0]?.from?.in?.[0]?.from?.out?.[0]?.id;
    const handlerId = insertResult?.data?.[0]?.in?.[0]?.from?.in?.[0]?.from?.out?.[0]?.to?.id;
    const handlerJSFileId = insertResult?.data?.[0]?.in?.[0]?.from?.in?.[0]?.from?.out?.[0]?.to?.id;
    const handlerJSFileValueId = insertResult?.data?.[0]?.in?.[0]?.from?.in?.[0]?.from?.out?.[0]?.to?.string?.id;
    const ownerContainHandlerId = insertResult?.data?.[0]?.in?.[0]?.from?.in?.[0]?.from?.out?.[0]?.to?.in?.[0]?.id;

    const url = `http://localhost:${port}${route}`

    log("waiting for route to be created");
    await waitOn({ resources: [url] });
    log("route handler is up");

    // ensure response is ok
    const response = await fetch(url);
    const text = await response.text();
    assert.equal(text, 'ok');

    // delete all
    await deleteId(handleRouteId);
    await deleteId(ownerContainHandlerId);
    await deleteId(handlerId);
    await deleteId(handlerJSFileValueId, { table: 'strings' });
    await deleteId(handlerJSFileId);
    await deleteId(routerStringUseId);
    await deleteId(routerListeningId);
    await deleteId(routerId);
    await deleteId(routeId);
    await deleteId(portValueId, { table: 'numbers' });
    await deleteId(portId);

    log("waiting for route to be deleted");
    await waitOn({ resources: [url], reverse: true });
    log("route handler is down");
  });
});

describe('handle by selector', () => {
  it(`handle insert`, async () => {
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const selector = await insertSelector();
    const { nodeTypeId, linkTypeId, treeId, treeIncludesIds, selectorId, selectorIncludeId, selectorTreeId, rootId } = selector;
    // console.log(`nodeTypeId: ${nodeTypeId}`);
    // console.log(`linkTypeId: ${linkTypeId}`);
    // console.log(`treeId: ${treeId}`);
    // console.log(`treeIncludesIds: ${treeIncludesIds}`);
    // console.log(`selectorId: ${selectorId}`);
    // console.log(`selectorIncludeId: ${selectorIncludeId}`);
    // console.log(`selectorTreeId: ${selectorTreeId}`);
    // console.log(`rootId: ${rootId}`);
    const handler = await insertHandler(handleInsertTypeId, selectorId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
    const selectorItems = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });

    // log('awaiting starts...');
    // await deep.await(idToWait);

    // log('awaiting finished.');

    // await deep.await(selectorItems[0].linkId); // doesn't work. why?
    log(`awaiting ${selectorItems[1].linkId} link.`)
    await deep.await(selectorItems[1].linkId);
    log(`awaiting ${selectorItems[0].linkId} link.`)
    await deep.await(selectorItems[0].linkId);

    const resolvedTypeId1 = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults1 = await getPromiseResults(deep, resolvedTypeId1, selectorItems[1].linkId);
    const promiseResult1 = promiseResults1.find(link => link.object?.value?.result === numberToReturn);
    // console.log('promiseResult1', JSON.stringify(promiseResult1, null, 2))

    const resolvedTypeId2 = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults2 = await getPromiseResults(deep, resolvedTypeId2, selectorItems[0].linkId);
    const promiseResult2 = promiseResults2.find(link => link.object?.value?.result === numberToReturn);
    // console.log('promiseResult2', JSON.stringify(promiseResult2, null, 2))

    for (const selectorItem of selectorItems) {
      await deleteId(selectorItem.linkId);
      await deleteId(selectorItem.nodeId);
    }
    
    await deleteSelector(selector);
    await deletePromiseResult(promiseResult1);
    await deletePromiseResult(promiseResult2);
    await deleteHandler(handler);

    assert.isTrue(!!promiseResult1);
    assert.isTrue(!!promiseResult2);
  });
  it(`handle delete`, async () => {
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
    const selector = await insertSelector();
    const { nodeTypeId, linkTypeId, treeId, treeIncludesIds, selectorId, selectorIncludeId, selectorTreeId, rootId } = selector;
    // console.log(`nodeTypeId: ${nodeTypeId}`);
    // console.log(`linkTypeId: ${linkTypeId}`);
    // console.log(`treeId: ${treeId}`);
    // console.log(`treeIncludesIds: ${treeIncludesIds}`);
    // console.log(`selectorId: ${selectorId}`);
    // console.log(`selectorIncludeId: ${selectorIncludeId}`);
    // console.log(`selectorTreeId: ${selectorTreeId}`);
    // console.log(`rootId: ${rootId}`);
    const handler = await insertHandler(handleDeleteTypeId, selectorId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
    const selectorItems = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });

    // log('awaiting starts...');
    // await deep.await(idToWait);

    // log('awaiting finished.');

    await deleteId(selectorItems[1].linkId);
    await deleteId(selectorItems[0].linkId);

    // await deep.await(selectorItems[0].linkId); // doesn't work. why?
    // console.log(`awaiting ${selectorItems[1].linkId} link.`)
    await deep.await(selectorItems[1].linkId);
    // console.log(`awaiting ${selectorItems[0].linkId} link.`)
    await deep.await(selectorItems[0].linkId);

    const resolvedTypeId1 = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults1 = await getPromiseResults(deep, resolvedTypeId1, selectorItems[1].linkId);
    const promiseResult1 = promiseResults1.find(link => link.object?.value?.result === numberToReturn);
    // console.log('promiseResult1', JSON.stringify(promiseResult1, null, 2))

    const resolvedTypeId2 = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults2 = await getPromiseResults(deep, resolvedTypeId2, selectorItems[0].linkId);
    const promiseResult2 = promiseResults2.find(link => link.object?.value?.result === numberToReturn);
    // console.log('promiseResult2', JSON.stringify(promiseResult2, null, 2))

    for (const selectorItem of selectorItems) {
      await deleteId(selectorItem.linkId);
      await deleteId(selectorItem.nodeId);
    }
    
    await deleteSelector(selector);
    await deletePromiseResult(promiseResult1);
    await deletePromiseResult(promiseResult2);
    await deleteHandler(handler);

    assert.isTrue(!!promiseResult1);
    assert.isTrue(!!promiseResult2);
  });
  it(`handle update when value is updated`, async () => {
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
    const selector = await insertSelector();
    const { nodeTypeId, linkTypeId, treeId, treeIncludesIds, selectorId, selectorIncludeId, selectorTreeId, rootId } = selector;
    const handler = await insertHandler(handleUpdateTypeId, selectorId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
    const selectorItems = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });

    const linkId = selectorItems[1].linkId;
    // const linkId = selectorItems[0].linkId;

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
    for (const selectorItem of selectorItems) {
      await deleteId(selectorItem.linkId);
      await deleteId(selectorItem.nodeId);
    }
    await deleteId(linkId);
    await deleteSelector(selector);
    await deleteHandler(handler);
    assert.isTrue(!!matchedPromiseResults);
    assert.equal(matchedPromiseResults.length, 2);
  });
});
