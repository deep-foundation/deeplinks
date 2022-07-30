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
  log('manual remigrating...');
  await api.sql(sql`${dropSyncInsertTrigger}`);
  await api.sql(sql`${createPrepareFunction}`);
  await api.sql(sql`${createDeepClientFunction}`);
  await api.sql(sql`${createSyncInsertTriggerFunction}`);
  await api.sql(sql`${createSyncInsertTrigger}`);
});

describe('sync handlers', () => {
  describe('Prepare fuction', () => {
  });
  describe.only('DeepClient mini', () => {
    it.only(`id`, async () => {
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}, 'id', '{"start": "@deep-foundation/core", "path":["RuleSubject"]}'::json)`);
      const clientResult = await deep.id('@deep-foundation/core', 'RuleSubject');
      log(result?.data?.result?.[1]?.[0], clientResult);
      assert.equal(result?.data?.result?.[1]?.[0], clientResult);
    });
    it(`insert`, async () => {
      const CustomNumber = nextHandlerResult();
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}, 'insert', '{"id": "${CustomNumber}", "type_id":1}'::json)`);
      const clientResult = await deep.select({id: {_eq: CustomNumber}});
      log(result?.data?.result?.[1]?.[0], clientResult);
      if (result?.data?.result?.[1]?.[0] === clientResult) deep.delete({id: {_eq: CustomNumber}});
      assert.equal(result?.data?.result?.[1]?.[0], clientResult);
    });
    it(`delete`, async () => {
      const CustomNumber = nextHandlerResult();
      await deep.insert({id: {_eq: CustomNumber}, type_id: {_eq: 2}});
      await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}, 'delete', '{"id": "${CustomNumber}", "type_id":1}'::json)`);
      const result = await deep.select({id: {_eq: CustomNumber}});
      log(result?.data?.[0]);
      assert.is.null(result?.data[0]);
    });
  });
  describe('Handle operations', () => {
    it.only(`Handle insert on type`, async () => {
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

      const linkId = await ensureLinkIsCreated(typeId);
      log('linkId', linkId);
      const insertedByHandler = (await deep.select({ id: { _eq: CustomNumber } }));
      log('insertedByHandler', insertedByHandler?.data[0]?.id);
      // if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
      // log('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      // log('delete handler', await deleteHandler(handler));
      // assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
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
    it.skip(`Handle insert on selector`, async () => {
      const CustomNumber = nextHandlerResult();

      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const selector = await insertSelector();
      const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
      const handler = await insertHandler(
        handleInsertTypeId,
        selectorId,
        `(arg) => {
          plv8.execute("INSERT INTO strings (link_id, value) VALUES(${rootId}, 'test')");
        }`);
    
      const selectorItems = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
      log('selectorItems', selectorItems)

      for (const selectorItem of selectorItems) {
        await deep.delete(selectorItem.linkId);
        await deep.delete(selectorItem.nodeId);
      }
      await deleteSelector(selector);
      await deleteHandler(handler);
    });
  });
});