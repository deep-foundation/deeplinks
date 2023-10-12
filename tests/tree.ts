import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import { insertHandler, deleteHandler }  from "../imports/handlers";
import { _ids } from '../imports/client.js';
import { delay } from "../imports/promise";

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

describe('tree', () => {
  it(`promiseTree`, async () => {
    let linksToDelete = [];
    const typeTypeLinkId = await deep.id("@deep-foundation/core", "Type");
    const handleInsertTypeLinkId = await deep.id("@deep-foundation/core", "HandleInsert");
    const { data: [{ id: customTypeLinkId }] } = await deep.insert({
      type_id: typeTypeLinkId,
    });
    linksToDelete.push(customTypeLinkId);
    const handler = await insertHandler(handleInsertTypeLinkId, customTypeLinkId, `async () => {}`);
    const { data: [{ id: customLinkId }] } = await deep.insert({
      type_id: customTypeLinkId
    });
    linksToDelete.push(customLinkId);
    await delay(5000);
    try {
      const { data: promiseTreeLinksDownToCustomLink } = await deep.select({
        up: {
          parent_id: {_eq: customLinkId},
          tree_id: {_eq: await deep.id("@deep-foundation/core", "promiseTree")}
        }
      });
      console.log({promiseTreeLinksDownToCustomLink})
      linksToDelete = [...linksToDelete, ...promiseTreeLinksDownToCustomLink.map(link => link.id)];
      const thenTypeLinkId = await deep.id("@deep-foundation/core", "Then");
      const thenLinkId = promiseTreeLinksDownToCustomLink.find(link => link.type_id === thenTypeLinkId);
      assert.notEqual(thenLinkId, undefined);

      const promiseTypeLinkId = await deep.id("@deep-foundation/core", "Promise");
      const promiseLinkId = promiseTreeLinksDownToCustomLink.find(link => link.type_id === promiseTypeLinkId);
      assert.notEqual(promiseLinkId, undefined);

      const resolvedTypeLinkId = await deep.id("@deep-foundation/core", "Resolved");
      const resolvedLinkId = promiseTreeLinksDownToCustomLink.find(link => link.type_id === resolvedTypeLinkId);
      assert.notEqual(resolvedLinkId, undefined);
    } finally {
      await deleteHandler(handler);
      await deep.delete(linksToDelete);
    }
  });
});