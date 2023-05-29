import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import gql from "graphql-tag";
import Debug from 'debug';
import fetch from 'node-fetch';
import { insertHandler, insertSelector, insertSelectorItems, deleteHandler, deleteSelector }  from "../imports/handlers";
import _ from 'lodash';
import { _ids } from '../imports/client.js';

const debug = Debug('deeplinks:tests:handlers');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

// Debug.enable(`${namespaces ? `${namespaces},` : ``}*:error`); // Force enable all errors output

import waitOn from 'wait-on';
import getPort from 'get-port';

export const api = new HasuraApi({
  path: process.env.DEEPLINKS_HASURA_PATH,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

let packageWithPermissions;

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

const deletePackageWithPermissions = async (deepPackage: any) => {
  await deep.delete(_.compact(_.concat([deepPackage.typeId, deepPackage.containId, deepPackage.packageId], deepPackage.ruleIds)));
  await deep.delete(_.compact([deepPackage.containValueId, deepPackage.packageValueId]), { table: 'strings' });
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
  if (promiseReasonId) await deep.delete(promiseReasonId);
  if (valueId) await deep.delete(valueId, { table: 'objects' });
  await deep.delete(_.compact([resultLinkId, thenLinkId, promiseResultId, promiseId, linkId]));
}

export const deleteScheduleHandler = async (handler) => {
  await deleteHandler(handler);
  if (handler.scheduleValueId) await deep.delete(handler.scheduleValueId, { table: 'strings' });
  if (handler.scheduleId) await deep.delete(handler.scheduleId);
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
  // await deep.deletes(packageWithPermissions?.ruleIds);
  deletePackageWithPermissions(packageWithPermissions);
});

describe('Async handlers', () => {
  describe('sync function handle by type with resolve', () => {
    it(`handle insert`, async () => {
      // const numberToReturn = randomInteger(5000000, 9999999999);
      const numberToReturn = nextHandlerResult();

      const typeId = await deep.id('@deep-foundation/core', 'Type');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const handler = await insertHandler(handleInsertTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;

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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;

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
      await deep.delete(linkId);
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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;

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
      await deep.delete(linkId);
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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
      await deep.delete(linkId);
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
      // const numberToThrow = randomInteger(5000000, 9999999999);
      const errorMessage = 'return is not possible';

      const typeId = await deep.id('@deep-foundation/core', 'Type');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const handler = await insertHandler(handleInsertTypeId, typeId, `({deep, data}) => { 
        deep.insert({id: 4444, type_id: 2});
        throw new Error('${errorMessage}');
      }`);
      log('handler', handler);

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;

      await deep.await(linkId);

      const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
      const promiseResults = await getPromiseResults(deep, rejectedTypeId, linkId);
      log('promiseResults', JSON.stringify(promiseResults));
      const promiseResult = promiseResults.find(link => link.object?.value.message === errorMessage);
      log('promiseResult', promiseResult);
      await deep.delete(linkId);
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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
      await deep.delete(linkId);
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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;

      await deep.await(linkId);

      const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
      const promiseResults = await getPromiseResults(deep, rejectedTypeId, linkId);
      const promiseResult = promiseResults.find(link => link.object?.value === numberToThrow);
      await deletePromiseResult(promiseResult, linkId);
      await deleteHandler(handler);
      assert.isTrue(!!promiseResult);
    });
    it(`handle update`, async () => {
      // const numberToThrow = randomInteger(5000000, 9999999999);
      const numberToThrow = nextHandlerResult();

      const typeId = await deep.id('@deep-foundation/core', 'Type');
      const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
      const handler = await insertHandler(handleUpdateTypeId, typeId, `async (arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);

      const linkId = (await deep.insert({ type_id: typeId, from_id: typeId, to_id: typeId }))?.data?.[0].id;
      await deep.update(linkId, { to_id: await deep.id('@deep-foundation/core', 'Any') });
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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
      await deep.delete(linkId);
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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
      await deep.await(linkId);

      const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
      const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
      const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);

      // log(JSON.stringify(promiseResults, null, 2));
      const queryId = promiseResult?.object?.value?.queryId;
      const query = (await deep.select({ id: { _eq: queryId }})).data[0];

      await deep.delete(queryId);
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

      const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
      await deep.await(linkId);

      const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
      const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
      const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);

      // log(JSON.stringify(promiseResults, null, 2));
      const nodeId = promiseResult?.object?.value?.nodeId;
      const node = (await deep.select({ id: { _eq: nodeId }})).data[0];

      await deep.delete(nodeId);
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

      await deep.delete(hanlePortLinkId);

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
      const port = 40005;
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
      await deep.delete(handleRouteLinkId);
      await deep.delete(ownerContainHandler.id);
      await deep.delete(handlerId);
      await deep.delete(handlerJSFileValue.id, { table: 'strings' });
      await deep.delete(handlerJSFile.id);
      await deep.delete(routerStringUseId);
      await deep.delete(routerListeningId);
      await deep.delete(routerId);
      await deep.delete(routeId);
      await deep.delete(portValue.id, { table: 'numbers' });
      await deep.delete(portId);

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
          in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'RouterListening')}" }}){
            id
            from {
              id
              in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'RouterStringUse')}" }}){
                id
                from {
                  id
                  out(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'HandleRoute')}" }}){
                    id
                    to {
                      id
                      in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'Contain')}" }}){
                        id
                        string {
                          id
                          value
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

      const portLink = insertResult?.data?.[0];
      const routerListening = portLink?.in?.[0];
      const router = routerListening?.from;
      const routerStringUse = router.in?.[0];
      const routeLink = routerStringUse?.from;
      const handleRoute = routeLink?.out?.[0];
      const handler = handleRoute?.to;
      const handlerJSFile = handler?.to;
      const ownerContainHandler = handler?.in[0];

      log({ portLink, routerListening, router, routerStringUse, routeLink, handleRoute, handler, handlerJSFile, ownerContainHandler})

      const url = `http://localhost:${port}${route}`

      log("waiting for route to be created");
      await waitOn({ resources: [url] });
      log("route handler is up");

      // ensure response is ok
      const response = await fetch(url);
      const text = await response.text();
      assert.equal(text, 'ok');

      // delete all
      await deep.delete(handleRoute?.id);
      await deep.delete(ownerContainHandler?.id);
      await deep.delete(handler?.id);
      await deep.delete(handlerJSFile?.id);
      await deep.delete(routerStringUse?.id);
      await deep.delete(routerListening?.id);
      await deep.delete(router?.id);
      await deep.delete(routeLink?.id);
      await deep.delete(portLink?.id);

      log("waiting for route to be deleted");
      await waitOn({ resources: [url], reverse: true });
      log("route handler is down");
    });
    it(`handle route hierarchical insert with throw error`, async () => {
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
                        value: /*javascript*/`async (req, res) => { throw 'Error'; }`,
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
          in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'RouterListening')}" }}){
            id
            from {
              id
              in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'RouterStringUse')}" }}){
                id
                from {
                  id
                  out(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'HandleRoute')}" }}){
                    id
                    to {
                      id
                      in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'Contain')}" }}){
                        id
                        string {
                          id
                          value
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

      const portLink = insertResult?.data?.[0];
      const routerListening = portLink?.in?.[0];
      const router = routerListening?.from;
      const routerStringUse = router.in?.[0];
      const routeLink = routerStringUse?.from;
      const handleRoute = routeLink?.out?.[0];
      const handler = handleRoute?.to;
      const handlerJSFile = handler?.to;
      const ownerContainHandler = handler?.in[0];

      log({ portLink, routerListening, router, routerStringUse, routeLink, handleRoute, handler, handlerJSFile, ownerContainHandler})

      const url = `http://localhost:${port}${route}`

      log("waiting for route to be created");
      await waitOn({ resources: [url] });
      log("route handler is up");

      // ensure response is ok
      const response = await fetch(url);
      const text = await response.text();
      assert.equal(text, '{"rejected":"Error"}');

      await delay(5000);

      // query HandlingError link
      //          out: {
      //  to_id: { _in: [${routeLink.id}, ${handleRoute.id}] }
      // }
      const queryString = `{
        links(where: { 
          type_id: { _eq: ${await deep.id('@deep-foundation/core', 'HandlingError')} },
        }) {
          id
          object {
            id
          }
          out {
            id
          }
        }
      }`;
      const client = deep.apolloClient;
      const handlingErrorLinks = (await client.query({
        query: gql`${queryString}`,
      }))?.data?.links;

      const handlingErrorLink = handlingErrorLinks[0];
      const hanldingErrorValue = handlingErrorLink?.object;
      const handlingErrorReasons = handlingErrorLink?.out;

      // delete handlingErrorReasons
      for (const reason of handlingErrorReasons) {
        await deep.delete(reason?.id);
      }
      // delete handlingErrorValue
      await deep.delete(hanldingErrorValue?.id, { table: 'objects' });
      // delete handlingErrorLink
      await deep.delete(handlingErrorLink?.id);

      // delete all
      await deep.delete(handleRoute?.id);
      await deep.delete(ownerContainHandler?.id);
      await deep.delete(handler?.id);
      await deep.delete(handlerJSFile?.id);
      await deep.delete(routerStringUse?.id);
      await deep.delete(routerListening?.id);
      await deep.delete(router?.id);
      await deep.delete(routeLink?.id);
      await deep.delete(portLink?.id);

      log("waiting for route to be deleted");
      await waitOn({ resources: [url], reverse: true });
      log("route handler is down");
    });
    it(`handle route gql handler`, async () => {
      // const port = await getPort(); // conflicts with container-controller port allocation
      const port = 4002;
      const field = 'constant'
      const route = `/${field}`;

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
                      string: { data: { value: 'constant' } },
                    } },
                    to: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
                      string: { data: {
                        value: /*javascript*/`async (req, res, next, { deep, require, gql }) => {
                          const express = require('express');
                          const http = require('http');
                          const ApolloServer = require('apollo-server-express').ApolloServer;
                          const { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');

                          const typeDefs = 'type Query { ${field}: Int }';

                          const resolvers = {
                            Query: { ${field}: () => (42) },
                          };
                          
                          const context = ({ req }) => { return { headers: req.headers }; };
                          
                          const generateApolloServer = () => {
                            return new ApolloServer({
                              introspection: true,
                              typeDefs, 
                              resolvers,
                              context,
                              plugins: [
                                ApolloServerPluginLandingPageGraphQLPlayground()
                              ]});
                            };

                          const router = express.Router();
                          const apolloServer = generateApolloServer();
                          await apolloServer.start();
                          apolloServer.applyMiddleware({ app: router, path: '/' });
                        
                          console.log('js-isolation-provider request')
                          console.log('req.method', req.method);
                          console.log('req.body', req.body);

                          router.handle(req, res);
                        }`,
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
          in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'RouterListening')}" }}){
            id
            from {
              id
              in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'RouterStringUse')}" }}){
                id
                from {
                  id
                  out(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'HandleRoute')}" }}){
                    id
                    to {
                      id
                      in(where: { type_id: {_eq: "${await deep.id('@deep-foundation/core', 'Contain')}" }}){
                        id
                        string {
                          id
                          value
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

      const portLink = insertResult?.data?.[0];
      const routerListening = portLink?.in?.[0];
      const router = routerListening?.from;
      const routerStringUse = router.in?.[0];
      const routeLink = routerStringUse?.from;
      const handleRoute = routeLink?.out?.[0];
      const handler = handleRoute?.to;
      const handlerJSFile = handler?.to;
      const ownerContainHandler = handler?.in[0];

      log({ portLink, routerListening, router, routerStringUse, routeLink, handleRoute, handler, handlerJSFile, ownerContainHandler});

      // insert gql handler link
      const handleGqlLink = (await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'HandleGql'),
        from_id: await deep.id('@deep-foundation/core', 'MainGqlEndpoint'),
        to_id: handleRoute.id,
      }, {
        returning: `id`,
        name: 'INSERT_GQL_HANDLER_LINK',
      }))?.data?.[0];
      
      const waitOnUrl = `http-get://localhost:${port}${route}?query=%7B${field}%7D`;

      log("waiting for route to be created");
      await waitOn({ resources: [waitOnUrl] });
      log("route handler is up");

      // check { constant } gql query
      await delay(5000);
      const { data } = await apolloClient.query({ query: gql`{ ${field} }` });
      assert.equal(data?.constant, 42);

      // Uncomment to test that remote schema removal error is saved
      // await api.query({
      //   type: 'remove_remote_schema',
      //   args: {
      //     name: `handle_gql_handler_${handleGqlLink?.id}`,
      //   },
      // });

      // delete all
      await deep.delete(handleGqlLink?.id);
      await deep.delete(handleRoute?.id);
      await deep.delete(ownerContainHandler?.id);
      await deep.delete(handler?.id);
      await deep.delete(handlerJSFile?.id);
      await deep.delete(routerStringUse?.id);
      await deep.delete(routerListening?.id);
      await deep.delete(router?.id);
      await deep.delete(routeLink?.id);
      await deep.delete(portLink?.id);

      log("waiting for route to be deleted");
      await waitOn({ resources: [waitOnUrl], reverse: true });
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
      const selectorItems = await insertSelectorItems({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });

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
      log('promiseResults1', JSON.stringify(promiseResults1));
      const promiseResult1 = promiseResults1.find(link => link.object?.value?.result === numberToReturn);
      // console.log('promiseResult1', JSON.stringify(promiseResult1, null, 2))

      const resolvedTypeId2 = await deep.id('@deep-foundation/core', 'Resolved');
      const promiseResults2 = await getPromiseResults(deep, resolvedTypeId2, selectorItems[0].linkId);
      const promiseResult2 = promiseResults2.find(link => link.object?.value?.result === numberToReturn);
      // console.log('promiseResult2', JSON.stringify(promiseResult2, null, 2))

      for (const selectorItem of selectorItems) {
        if (selectorItem?.linkId) await deep.delete(selectorItem.linkId);
        if (selectorItem?.nodeId) await deep.delete(selectorItem.nodeId);
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
      const selectorItems = await insertSelectorItems({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });

      // log('awaiting starts...');
      // await deep.await(idToWait);

      // log('awaiting finished.');

      await deep.delete(selectorItems[1].linkId);
      await deep.delete(selectorItems[0].linkId);

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
        await deep.delete(selectorItem.linkId);
        await deep.delete(selectorItem.nodeId);
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
      const selectorItems = await insertSelectorItems({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });

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
        await deep.delete(selectorItem.linkId);
        await deep.delete(selectorItem.nodeId);
      }
      await deep.delete(linkId);
      await deleteSelector(selector);
      await deleteHandler(handler);
      assert.isTrue(!!matchedPromiseResults);
      assert.equal(matchedPromiseResults.length, 2);
    });
  });
});
