import { assert } from 'chai';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { insertHandler, insertSelector, insertSelectorItem, ensureLinkIsCreated, deleteHandler, deleteSelector }  from "../imports/handlers";
import { HasuraApi } from'@deep-foundation/hasura/api';
import { sql } from '@deep-foundation/hasura/sql';
import { createPrepareFunction, createDeepClientFunction, createSyncInsertTriggerFunction, dropSyncInsertTriggerFunction, dropSyncInsertTrigger, createSyncInsertTrigger } from "../migrations/1655979260869-sync-handlers";
import Debug from 'debug';

const debug = Debug('deeplinks:tests:sync-handlers');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const delay = time => new Promise(res => setTimeout(res, time));

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
  await api.sql(dropSyncInsertTrigger);
  await api.sql(dropSyncInsertTriggerFunction);
  await api.sql(sql`${createSyncInsertTriggerFunction}`);
  await api.sql(sql`${createSyncInsertTrigger}`);
});

// deeplinks:tests:sync-handlers:log selector {
//   nodeTypeId: 566,
//   linkTypeId: 567,
//   treeId: 568,
//   treeIncludesIds: [ 570, 569 ],
//   selectorId: 572,
//   selectorIncludeId: 573,
//   selectorTreeId: 574,
//   rootId: 571
// } +371ms
//   deeplinks:tests:sync-handlers:log handler {
//   handlerId: 576,
//   handleOperationId: 578,
//   handlerJSFileId: 575,
//   handlerJSFileValueId: 270,
//   ownerContainHandlerId: 577
// } +189ms
//   deeplinks:tests:sync-handlers:log selectorItems [ { linkId: 580, nodeId: 579 }, { linkId: 584, nodeId: 583 } ] +5s

describe('sync handlers', () => {
  describe('Prepare fuction', () => {
    it(`handleInsert seletorNode`, async () => {
      const handlerId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const link = JSON.stringify({id: 579, type_id: 566});
      const result = await api.sql(sql`select links__sync__handler__prepare__function('${link}'::jsonb, ${handlerId}::bigint)`);
      log('result', result?.data?.result?.[1]?.[0]);
    });
  });
  describe('DeepClient mini', () => {
    it(`id`, async () => {
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'id', '{"start": "deep", "path":["admin"]}'::jsonb)`);
      const clientResult = await deep.id('deep', 'admin');
      log('result', result?.data?.result?.[1]?.[0]);
      assert.equal(JSON.parse(result?.data?.result?.[1]?.[0])?.[0], clientResult);
    });
    it(`insert`, async () => {
      const CustomNumber = nextHandlerResult();
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'insert', '{"id": "${CustomNumber}", "type_id":1}'::jsonb)`);
      const clientResult = await deep.select({id: {_eq: CustomNumber}});
      log('result', JSON.parse(result?.data?.result?.[1][0]).link );
      if (JSON.parse(result?.data?.result?.[1][0])?.link === clientResult?.data[0]?.id) deep.delete({id: {_eq: CustomNumber}});
      assert.equal(JSON.parse(result?.data?.result?.[1][0]).link, clientResult?.data[0]?.id);
    });
    it(`delete`, async () => {
      const CustomNumber = nextHandlerResult();
      await deep.insert({id: CustomNumber, type_id: 2});
      await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'delete', '{"id": "${CustomNumber}"}'::jsonb)`);
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
        log('insert error: ', e);
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
        `(deep, data) => { deep.insert({id: ${CustomNumber}, type_id: 2}); throw new Error('testError');  }`,
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
    it.only(`Handle insert on selector`, async () => {
      const CustomNumber = nextHandlerResult();

      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      const selector = await insertSelector();
      log('selector', selector);
      const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
      const handler = await insertHandler(
        handleInsertTypeId,
        selectorId,
        `(deep, data) => { deep.insert({id: ${CustomNumber}, type_id: 2}); }`,
        undefined,
        supportsId);

      let selectorItems;
      log('handler', handler);
      await delay(50000);
      try {
        selectorItems = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
        log('selectorItems', selectorItems);
      } catch (e){
        error(e);
      }
      for (const selectorItem of selectorItems) {
        await deep.delete(selectorItem.linkId);
        // await deep.delete(selectorItem.nodeId);
      }
      const insertedByHandler = (await deep.select({ id: { _eq: CustomNumber } }));
      log('insertedByHandler', insertedByHandler?.data[0]?.id);
      if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _in: insertedByHandler?.data[0] } });

      log('deleteSelector');
      await deleteSelector(selector);
      log('deleteHandler');
      await deleteHandler(handler);
    });
  });
});