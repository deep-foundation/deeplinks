import { assert } from 'chai';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { insertHandler, insertSelector, insertSelectorItem, ensureLinkIsCreated, deleteHandler, deleteSelector }  from "../imports/handlers";
import { HasuraApi } from'@deep-foundation/hasura/api';
import { sql } from '@deep-foundation/hasura/sql';
import { createPrepareFunction, createDeepClientFunction, createSyncInsertTriggerFunction, dropSyncInsertTriggerFunction, dropSyncInsertTrigger, createSyncInsertTrigger, createSyncUpdateTriggerFunction, createSyncUpdateTrigger, createSyncDeleteTriggerFunction, createSyncDeleteTrigger, dropSyncUpdateTriggerFunction, dropSyncUpdateTrigger, dropSyncDeleteTriggerFunction, dropSyncDeleteTrigger } from "../migrations/1655979260869-sync-handlers";
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
  await api.sql(`${createPrepareFunction}`);
  await api.sql(`${createDeepClientFunction}`);
  
  await api.sql(dropSyncInsertTrigger);
  await api.sql(dropSyncInsertTriggerFunction);

  await api.sql(dropSyncUpdateTrigger);
  await api.sql(dropSyncUpdateTriggerFunction);

  await api.sql(dropSyncDeleteTrigger);
  await api.sql(dropSyncDeleteTriggerFunction);
  
  await api.sql(createSyncInsertTriggerFunction);
  await api.sql(createSyncInsertTrigger);

  await api.sql(createSyncUpdateTriggerFunction);
  await api.sql(createSyncUpdateTrigger);

  await api.sql(createSyncDeleteTriggerFunction);
  await api.sql(createSyncDeleteTrigger);
});

describe('sync handlers', () => {
  describe.skip('Prepare fuction', () => {
    it(`handleInsert`, async () => {
      const handlerId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const link = JSON.stringify({id: 579, type_id: 566}); // change for yours
      const result = await api.sql(sql`select links__sync__handler__prepare__function('${link}'::jsonb, ${handlerId}::bigint)`);
      debug('prepare result', result?.data?.result?.[1]?.[0]);
    });
  });
  describe('DeepClient mini', () => {
    it(`id`, async () => {
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'id', '{"start": "deep", "path":["admin"]}'::jsonb)`);
      const clientResult = await deep.id('deep', 'admin');
      log('id result', result?.data?.result?.[1]?.[0]);
      assert.equal(JSON.parse(result?.data?.result?.[1]?.[0])?.[0], clientResult);
    });
    it(`insert`, async () => {
      const CustomNumber = nextHandlerResult();
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'insert', '{"id": "${CustomNumber}", "type_id":1}'::jsonb)`);
      const clientResult = await deep.select({id: {_eq: CustomNumber}});
      log('insert result', result?.data?.result?.[1]?.[0] );
      if (JSON.parse(result?.data?.result?.[1]?.[0])?.link === clientResult?.data?.[0]?.id) deep.delete({id: {_eq: CustomNumber}});
      assert.equal(JSON.parse(result?.data?.result?.[1]?.[0]).link, clientResult?.data?.[0]?.id);
    });
    it(`update`, async () => {
      const CustomNumber = nextHandlerResult();
      const inserted = await deep.insert({id: CustomNumber, type_id: 1});
      log('inserted', inserted );
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'update', '{"id": "${CustomNumber}", "_set": { "type_id":2 } }'::jsonb)`);
      log('result',  result?.data?.result?.[1]?.[0] );
      const clientResult = await deep.select({id: {_eq: CustomNumber}});
      assert.equal(clientResult?.data[0]?.type_id, 2);
    });
    it(`delete`, async () => {
      const CustomNumber = nextHandlerResult();
      await deep.insert({id: CustomNumber, type_id: 2});
      await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'delete', '{"id": "${CustomNumber}"}'::jsonb)`);
      const result = await deep.select({id: {_eq: CustomNumber}});
      log('delete result', result);
      assert.equal(result?.data[0], undefined);
    });
  });
  describe('Handle operations', () => {
    describe('Handle insert', () => {
      it(`Handle insert on type`, async () => {
        const debug = log.extend('HandleInsert');
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
        debug('handler', handler);
        debug('CustomNumber', CustomNumber);
        
        try {
          const linkId = await ensureLinkIsCreated(typeId);
          debug('linkId', linkId);
          debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ id: { _eq: CustomNumber } });
        debug('insertedByHandler', insertedByHandler?.data[0]?.id);
        if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
        debug('delete handler', await deleteHandler(handler));
        assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
      });
      it(`Handle insert 2 triggers and broke transaction in second`, async () => {
        const debug = log.extend('HandleInsert');
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
        debug('handler', handler);
        debug('CustomNumber', CustomNumber);


        const handler2 = await insertHandler(
          handleInsertTypeId,
          typeId, 
          `(deep, data) => { throw new Error('') }`,
          undefined,
          supportsId
        );
        
        try {
          const linkId = await ensureLinkIsCreated(typeId);
          debug('linkId', linkId);
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ id: { _eq: CustomNumber } });
        debug('insertedByHandler', insertedByHandler?.data[0]?.id);
        if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
        debug('delete handler', await deleteHandler(handler));
        debug('delete handler2', await deleteHandler(handler2));
        assert.equal(insertedByHandler?.data[0]?.id, undefined);
      });
      it(`Handle insert on type throw error`, async () => {
        const CustomNumber = nextHandlerResult();
        const debug = log.extend('HandleInsertError');

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
        let link
        let error;
        debug('handler', handler);
        try {
          link = await ensureLinkIsCreated(typeId);
          debug('ensureLinkIsCreated', link.linkId);
          throw new Error('Not errored hadnler!')
        } catch (e) {
          debug('error', e?.message);
          error = e?.message;
        }

        const insertedByHandler = (await deep.select({ id: { _eq: CustomNumber } }));
        debug('insertedByHandler', insertedByHandler?.data[0]?.id);

        debug('delete handler', JSON.stringify(await deleteHandler(handler)));
        if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
        if (link) {
          const deleteResult = await deep.delete({ id: { _eq: link.linkId } });
          debug('delete linkid', deleteResult);
        }
        assert.equal(error, 'testError');
      });
      it(`Handle insert on selector`, async () => {
        const CustomNumber = nextHandlerResult();
        const debug = log.extend('HandleInsertSelect');

        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const selector = await insertSelector();
        debug('selector', selector);
        const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
        const handler = await insertHandler(
          handleInsertTypeId,
          selectorId,
          `(deep, data) => { deep.insert({id: ${CustomNumber}, type_id: 2}); }`,
          undefined,
          supportsId);

        let selectorItem;
        debug('handler', handler);
        try {
          selectorItem = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
          debug('selectorItem', selectorItem);
        } catch (e){
          error(e);
        }

        if (selectorItem?.linkId) await deep.delete(selectorItem.linkId);
        const insertedByHandler = (await deep.select({ id: { _eq: CustomNumber } }));
        debug('insertedByHandler', insertedByHandler?.data[0]?.id);
        if (insertedByHandler?.data[0]?.id) await deep.delete(insertedByHandler?.data[0]?.id);

        debug('deleteSelector');
        await deleteSelector(selector);
        debug('deleteHandler');
        await deleteHandler(handler);
        assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
      });
    });
    describe('Handle update', () => {
      it(`Handle update on type`, async () => {
        const debug = log.extend('HandleUpdate');
        const CustomNumber = nextHandlerResult();

        const typeId = await deep.id('@deep-foundation/core', 'Type');
        const HandlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
        const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const handler = await insertHandler(
          handleUpdateTypeId,
          typeId, 
          `(deep, data) => { deep.insert({id: ${CustomNumber}, type_id: 2}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        debug('CustomNumber', CustomNumber);

        const linkId = await ensureLinkIsCreated(typeId);
        
        try {
          const updated = await deep.update(linkId, {type_id: HandlerTypeId});
          debug('updated', updated);
        } catch (e){
          debug('insert error: ', e);
        }
        
        const insertedByHandler = await deep.select({ id: { _eq: CustomNumber } });
        debug('insertedByHandler', insertedByHandler);
        
        debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));

        if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
        debug('insertedByHandler', insertedByHandler?.data[0]);
        debug('delete handler', await deleteHandler(handler));
        assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
      });
      it(`Handle update on selector`, async () => {
        const CustomNumber = nextHandlerResult();
        const debug = log.extend('HandleUpdateSelect');

        const HandlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
        const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const selector = await insertSelector();
        debug('selector', selector);
        const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
        const handler = await insertHandler(
          handleUpdateTypeId,
          selectorId,
          `(deep, data) => { deep.insert({id: ${CustomNumber}, type_id: 2}); }`,
          undefined,
          supportsId);

        const selectorItem = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
        
        debug('handler', handler);
        try {
          const updated = await deep.update(selectorItem.linkId, {type_id: HandlerTypeId});
          debug('updated', updated);
        } catch (e){
          error(e);
        }

        const insertedByHandler = await deep.select({ id: { _eq: CustomNumber } });
        debug('insertedByHandler', insertedByHandler);

        if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
        debug('selectorItem');
        if (selectorItem?.linkId) await deep.delete(selectorItem.linkId);
        debug('deleteSelector');
        await deleteSelector(selector);
        debug('deleteHandler');
        await deleteHandler(handler);
        assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
      });
    });
    describe('Handle delete', () => {
      it(`Handle delete on type`, async () => {
        const debug = log.extend('HandleDelete');
        const CustomNumber = nextHandlerResult();

        const typeId = await deep.id('@deep-foundation/core', 'Type');
        const HandlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
        const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const handler = await insertHandler(
          handleDeleteTypeId,
          typeId, 
          `(deep, data) => { deep.insert({id: ${CustomNumber}, type_id: 2}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        debug('CustomNumber', CustomNumber);

        const linkId = await ensureLinkIsCreated(typeId);
        
        try {
          const deleted = await deep.delete(linkId);
          debug('updated', deleted);
        } catch (e){
          debug('insert error: ', e);
        }
        
        const insertedByHandler = await deep.select({ id: { _eq: CustomNumber } });
        debug('insertedByHandler', insertedByHandler);

        if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
        debug('insertedByHandler', insertedByHandler?.data[0]);
        debug('delete handler', await deleteHandler(handler));
        assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
      });
      it(`Handle delete on selector`, async () => {
        const CustomNumber = nextHandlerResult();
        const debug = log.extend('HandleDeleteSelect');

        const HandlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
        const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const selector = await insertSelector();
        debug('selector', selector);
        const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
        const handler = await insertHandler(
          handleDeleteTypeId,
          selectorId,
          `(deep, data) => { deep.insert({id: ${CustomNumber}, type_id: 2}); }`,
          undefined,
          supportsId);

        const selectorItem = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
        
        debug('handler', handler);
        try {
          const deleted = await deep.delete(selectorItem.linkId);
          debug('deleted', deleted);
        } catch (e){
          error(e);
        }

        const insertedByHandler = await deep.select({ id: { _eq: CustomNumber } });
        debug('insertedByHandler', insertedByHandler);

        if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
        debug('deleteSelector');
        await deleteSelector(selector);
        debug('deleteHandler');
        await deleteHandler(handler);
        assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
      });
    });
  });
});