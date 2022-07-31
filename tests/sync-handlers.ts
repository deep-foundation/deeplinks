import { assert } from 'chai';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { insertHandler, insertSelector, insertSelectorItem, ensureLinkIsCreated, deleteHandler, deleteSelector }  from "../imports/handlers";
import { HasuraApi } from'@deep-foundation/hasura/api';
import { sql } from '@deep-foundation/hasura/sql';
import { createPrepareFunction, createDeepClientFunction, createSyncInsertTriggerFunction, createSyncInsertTrigger, dropSyncInsertTrigger } from "../migrations/1655979260869-sync-handlers";
import Debug from 'debug';

const debug = Debug('deeplinks:tests:sync-handlers');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const HASURA_PATH='localhost:8080'
const HASURA_SSL=0
const HASURA_SECRET='myadminsecretkey'

export const api = new HasuraApi({
  path: HASURA_PATH,
  ssl: !!+HASURA_SSL,
  secret: HASURA_SECRET,
});

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });
let lastHandlerLinkId = 9999999;

const nextHandlerResult = () => {
  lastHandlerLinkId -= 1;
  return lastHandlerLinkId;
};

beforeAll(async () => {
  // manual remigrate plv8
  console.log('manual remigrating...');
  await api.sql(sql`${createPrepareFunction}`);
  await api.sql(sql`${createDeepClientFunction}`);
  await api.sql(sql`${createSyncInsertTriggerFunction}`);
});

// deeplinks:tests:sync-handlers:log selector {
//   nodeTypeId: 464,
//   linkTypeId: 465,
//   treeId: 466,
//   treeIncludesIds: [ 468, 467 ],
//   selectorId: 470,
//   selectorIncludeId: 471,
//   selectorTreeId: 472,
//   rootId: 469
// } +412ms
//   deeplinks:tests:sync-handlers:log handler {
//   handlerId: 474,
//   handleOperationId: 476,
//   handlerJSFileId: 473,
//   handlerJSFileValueId: 166,
//   ownerContainHandlerId: 475
// } +127ms
//   deeplinks:tests:sync-handlers:log selectorItems [ { linkId: 478, nodeId: 477 }, { linkId: 482, nodeId: 481 } ] 

describe('sync handlers', () => {
  describe('Prepare fuction', () => {
    it.only(`handleInsert seletorNode`, async () => {
      const handlerId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const link = JSON.stringify({id: 477, type_id: 464});
      const result = await api.sql(sql`select links__sync__handler__prepare__function('${link}'::jsonb, ${handlerId}::bigint)`);
      log('result', result?.data?.result?.[1]?.[0]);
    });
  });
  describe('DeepClient mini', () => {
    it(`id`, async () => {
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'id', '{"start": "deep", "path":["admin"]}'::json)`);
      const clientResult = await deep.id('deep', 'admin');
      log('result', result?.data?.result?.[1]?.[0]);
      assert.equal(JSON.parse(result?.data?.result?.[1]?.[0])?.[0], clientResult);
    });
    it(`insert`, async () => {
      const CustomNumber = nextHandlerResult();
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'insert', '{"id": "${CustomNumber}", "type_id":1}'::json)`);
      const clientResult = await deep.select({id: {_eq: CustomNumber}});
      log('result', JSON.parse(result?.data?.result?.[1][0]).link );
      if (JSON.parse(result?.data?.result?.[1][0]).link === clientResult?.data[0]?.id) deep.delete({id: {_eq: CustomNumber}});
      assert.equal(JSON.parse(result?.data?.result?.[1][0]).link, clientResult?.data[0]?.id);
    });
    it(`delete`, async () => {
      const CustomNumber = nextHandlerResult();
      await deep.insert({id: CustomNumber, type_id: 2});
      await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'delete', '{"id": "${CustomNumber}"}'::json)`);
      const result = await deep.select({id: {_eq: CustomNumber}});
      log('result', result);
      assert.equal(result?.data[0], undefined);
    });
  });
  describe('Handle operations', () => {
    it(`Handle insert on type`, async () => {
      const CustomNumber = nextHandlerResult();

      const typeId = await deep.id('@deep-foundation/core', 'Type');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `(deep, data) => { deep.insert({id: ${CustomNumber}, type_id: 2}); }`,
        undefined,
        supportsId
      );
      log('handler', handler);
      log('CustomNumber', CustomNumber);
      
      try {
        const linkId = await ensureLinkIsCreated(typeId);
        log('linkId', linkId);
        log('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      } catch (e){
        log(e);
      }

      const insertedByHandler = (await deep.select({ id: { _eq: CustomNumber } }));
      log('insertedByHandler', insertedByHandler?.data[0]?.id);
      if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
      log('delete handler', await deleteHandler(handler));
      assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
    });
    it(`Handle insert on type throw error`, async () => {
      const CustomNumber = nextHandlerResult();

      const typeId = await deep.id('@deep-foundation/core', 'Type');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `(deep, data) => {  deep.insert({id: ${CustomNumber}, type_id: 2}); throw new Error('testError'); }`,
        undefined,
        supportsId
      );
      let linkId
      let error;
      log('handler', handler);
      try {
        linkId = await ensureLinkIsCreated(typeId);
        log('linkId', linkId);
        throw new Error('Not errored hadnler!')
      } catch (e) {
        log('error', e?.message);
        error = e?.message;
      }

      const insertedByHandler = (await deep.select({ id: { _eq: CustomNumber } }));
      log('insertedByHandler', insertedByHandler?.data[0]?.id);

      if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
      if (linkId) log('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      log('delete handler', await deleteHandler(handler));
      assert.equal(error, 'testError');
    });
    it(`Handle insert on selector`, async () => {
      const CustomNumber = nextHandlerResult();

      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      const selector = await insertSelector();
      log('selector', selector);
      const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
      const handler = await insertHandler(
        handleInsertTypeId,
        selectorId,
        `(arg) => { plv8.execute("deep.insert({id: ${CustomNumber}, type_id: 2});}`,
        undefined,
        supportsId);

      let selectorItems;
      log('handler', handler);
      try {
        selectorItems = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
        log('selectorItems', selectorItems);
      } catch (e){
        error(e);
      }
      // delay(10000);
      // for (const selectorItem of selectorItems) {
      //   await deep.delete(selectorItem.linkId);
      //   // await deep.delete(selectorItem.nodeId);
      // }
      // const insertedByHandler = (await deep.select({ id: { _eq: CustomNumber } }));
      // log('insertedByHandler', insertedByHandler?.data[0]?.id);
      // if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });

      // log('deleteSelector');
      // await deleteSelector(selector);
      // log('deleteHandler');
      // await deleteHandler(handler);
    });
  });
});