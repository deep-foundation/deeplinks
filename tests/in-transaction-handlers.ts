import { assert } from 'chai';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { insertHandler, insertSelector, insertSelectorItem, ensureLinkIsCreated, deleteHandler, deleteSelector, deleteId, deleteIds }  from "../imports/handlers";
import { HasuraApi } from'@deep-foundation/hasura/api';
import { sql } from '@deep-foundation/hasura/sql';
import Debug from 'debug';

const debug = Debug('deeplinks:tests:in-transaction-handlers');
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
let lastHandlerLinkId = 99999999;

const nextHandlerResult = () => {
  lastHandlerLinkId -= 1;
  return lastHandlerLinkId;
};

describe('sync handlers', () => {
  describe('DeepClient mini', () => {
    it(`id`, async () => {
      const result = await api.sql(sql`select links__deep__client('id', '{"start": "@deep-foundation/core", "path":["RuleSubject"]}'::json)`);
      const clientResult = await deep.id('@deep-foundation/core', 'RuleSubject');
      log(result?.data?.result?.[1]?.[0], clientResult);
      assert.equal(result?.data?.result?.[1]?.[0], clientResult);
    });
  });
  describe('Handle operations', () => {
    it(`Handle insert`, async () => {
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
      if (insertedByHandler?.data[0]?.id) await deep.delete({ id: { _eq: CustomNumber } });
      log('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      log('delete handler', await deleteHandler(handler));
      assert.equal(insertedByHandler?.data[0]?.id, CustomNumber);
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
        await deleteId(selectorItem.linkId);
        await deleteId(selectorItem.nodeId);
      }
      await deleteSelector(selector);
      await deleteHandler(handler);
    });
  });
});