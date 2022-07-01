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
let lastHandlerLinkId = 99999999;

const nextHandlerResult = () => {
  lastHandlerLinkId -= 1;
  return lastHandlerLinkId;
};

describe('In-transaction handlers', () => {
  it.only(`handle insert`, async () => {
    const CustomNumber = nextHandlerResult();

    const typeId = await deep.id('@deep-foundation/core', 'Type');
    const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
    const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
    const handler = await insertHandler(
      handleInsertTypeId,
      typeId, 
      `deep.insert({id: ${CustomNumber}, type_id: 2});`,
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
    assert(insertedByHandler?.data[0]?.id === CustomNumber);
  });
  it(`handle insert on selector`, async () => {
    // const numberToReturn = randomInteger(5000000, 9999999999);
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