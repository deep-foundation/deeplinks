import { assert } from 'chai';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { insertHandler, ensureLinkIsCreated, getPromiseResults, deletePromiseResult, deleteHandler } from './handlers'

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
    await deep.await(linkId);

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const promiseResults = await getPromiseResults(deep, resolvedTypeId, linkId);
    const promiseResult = promiseResults.find(link => link.object?.value?.result === numberToReturn);
    await deletePromiseResult(promiseResult, linkId);
    await deleteHandler(handler);
    assert.isTrue(!!promiseResult);
  });
});