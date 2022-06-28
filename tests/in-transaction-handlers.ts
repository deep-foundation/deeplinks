import { assert } from 'chai';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { insertHandler, insertSelector, insertSelectorItem, ensureLinkIsCreated, getPromiseResults, deletePromiseResult, deleteHandler, deleteSelector, deleteId } from './handlers'
import Debug from 'debug';

const debug = Debug('deeplinks:tests:in-transaction-handlers');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

let lastHandlerResult = 1;

const nextHandlerResult = () => {
  lastHandlerResult += 1;
  return lastHandlerResult;
};

describe('In-transaction handlers', () => {
  it(`handle insert`, async () => {
    const numberToReturn = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
    const handler = await insertHandler(handleInsertTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`, undefined, supportsId);

    const linkId = await ensureLinkIsCreated(typeId);

    await deleteHandler(handler);
  });
  it.only(`handle insert on selector`, async () => {
    // const numberToReturn = randomInteger(5000000, 9999999999);
    const numberToReturn = nextHandlerResult();

    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const selector = await insertSelector();
    const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
    const handler = await insertHandler(handleInsertTypeId, selectorId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
    const selectorItems = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
    console.log('selectorItems', selectorItems)

    for (const selectorItem of selectorItems) {
      await deleteId(selectorItem.linkId);
      await deleteId(selectorItem.nodeId);
    }
    
    await deleteSelector(selector);
    await deleteHandler(handler);
  });
});