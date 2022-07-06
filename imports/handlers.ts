import { assert } from 'chai';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "./client";
import gql from "graphql-tag";

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

let lastFreeId = 9999999999;

const nextFreeId = () => {
  lastFreeId -= 1;
  return lastFreeId;
};


export const insertHandler = async (handleOperationTypeId: number, typeId: number, code: string, forceOwnerId?: number, supportsId?: number) => {
  const syncTextFileTypeId = await deep.id('@deep-foundation/core', 'SyncTextFile');
  const handlerJSFile = (await deep.insert({
    type_id: syncTextFileTypeId,
  }, { name: 'INSERT_HANDLER_JS_FILE' })).data[0];
  const handlerJSFileValue = (await deep.insert({ link_id: handlerJSFile?.id, value: code }, { table: 'strings' })).data[0];
  const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
  const handler = (await deep.insert({
    from_id: supportsId || await deep.id('@deep-foundation/core', 'dockerSupportsJs'),
    type_id: handlerTypeId,
    to_id: handlerJSFile?.id,
  }, { name: 'INSERT_HANDLER' })).data[0];
  const containTypeId = await deep.id('@deep-foundation/core', 'Contain');
  const ownerId = forceOwnerId || (await deep.id('@deep-foundation/core', 'system', 'admin'));
  const ownerContainHandler = (await deep.insert({
    from_id: ownerId,
    type_id: containTypeId,
    to_id: handler?.id,
  }, { name: 'INSERT_ADMIN_CONTAIN_HANDLER' })).data[0];
  const handleOperation = (await deep.insert({
    from_id: typeId,
    type_id: handleOperationTypeId,
    to_id: handler?.id,
  }, { name: 'INSERT_INSERT_HANDLER' })).data[0];
  return {
    handlerId: handler?.id,
    handleOperationId: handleOperation?.id,
    handlerJSFileId: handlerJSFile?.id,
    handlerJSFileValueId: handlerJSFileValue?.id,
    ownerContainHandlerId: ownerContainHandler?.id,
  };
};

export async function insertSelector() {
  const typeTypeId = await deep.id('@deep-foundation/core', 'Type');
  const { data: [{ id: ty0 }] } = await deep.insert({
    type_id: typeTypeId,
  });
  const { data: [{ id: ty1 }] } = await deep.insert({
    type_id: typeTypeId,
    from_id: ty0,
    to_id: ty0,
  });
  const treeIncludeDownTypeId = await deep.id('@deep-foundation/core', 'TreeIncludeDown');
  const { data: [{ id: tr1, out: treeIncludes }] } = await deep.insert({
    type_id: await deep.id('@deep-foundation/core', 'Tree'),
    out: { data: [
      {
        type_id: treeIncludeDownTypeId,
        to_id: ty1,
      },
      {
        type_id: treeIncludeDownTypeId,
        to_id: ty0,
      },
    ] }
  }, {
    returning: `
      id
      out(where: { to_id: { _in: [${ty0}, ${ty1}] }, type_id: { _eq: ${treeIncludeDownTypeId} } }) {
        id
      }
    `,
  }) as any;
  const { data: [{ id: id0 }] } = await deep.insert({
    type_id: ty0,
  });
  const selectorIncludeTypeId = await deep.id('@deep-foundation/core', 'SelectorInclude');
  const selectorTreeTypeId = await deep.id('@deep-foundation/core', 'SelectorTree');
  const { data: [{ id: s1, out: selectorData }] } = await deep.insert({
    type_id: await deep.id('@deep-foundation/core', 'Selector'),
    out: { data: [
      {
        type_id: selectorIncludeTypeId,
        to_id: id0,
        out: { data: {
          type_id: selectorTreeTypeId,
          to_id: tr1
        } },
      },
    ] }
  }, {
    returning: `
      id
      out(where: { to_id: { _eq: ${id0} }, type_id: { _eq: ${selectorIncludeTypeId} } }) {
        id
        out(where: { to_id: { _eq: ${tr1} }, type_id: { _eq: ${selectorTreeTypeId} } }) {
          id
        }
      }
    `,
  }) as any;

  return {
    nodeTypeId: ty0,
    linkTypeId: ty1,
    treeId: tr1,
    treeIncludesIds: treeIncludes.map(({ id }) => id),
    selectorId: s1,
    selectorIncludeId: selectorData[0].id,
    selectorTreeId: selectorData[0].out[0].id,
    rootId: id0,
  };
};

export async function insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId }) {
  // const { data: [{ id: id1 }] } = await deep.insert({
  //   type_id: nodeTypeId,
  //   in: { data: {
  //     type_id: linkTypeId,
  //     from_id: rootId,
  //   } }
  // });
  const { data: [{ id: linkId1, to: { id: nodeId1 } }] } = await deep.insert({
    type_id: linkTypeId,
    from_id: rootId,
    to: { data: {
      type_id: nodeTypeId,
    } }
  }, { returning: 'id to { id }' }) as any;

  // return linkId1; // doesn't work

  // const { data: [{ id: id2 }] } = await deep.insert({
  //   type_id: nodeTypeId,
  //   in: { data: {
  //     type_id: linkTypeId,
  //     from_id: id1,
  //   } }
  // });
  const { data: [{ id: linkId2, to: { id: nodeId2 } }] } = await deep.insert({
    from_id: nodeId1,
    type_id: linkTypeId,
    to: { data: {
      type_id: nodeTypeId,
    } }
  }, { returning: 'id to { id }' }) as any;
  
  // const n1 = await deep.select({
  //   item_id: { _eq: id2 }, selector_id: { _eq: selectorId }
  // }, { table: 'selectors', returning: 'item_id selector_id' });
  // assert.lengthOf(n1?.data, 1, `item_id ${id2} must be in selector_id ${selectorId}`);

  // return linkId2;
  return [
    { linkId: linkId1, nodeId: nodeId1 },
    { linkId: linkId2, nodeId: nodeId2 },
  ]
};

export async function ensureLinkIsCreated(typeId: number) {
  // const freeId = randomInteger(5000000, 9999999999);
  const freeId = nextFreeId();
  // log(freeId);
  const insertedLink = (await deep.insert({
    id: freeId,
    from_id: freeId,
    type_id: typeId,
    to_id: freeId
  }, { name: 'INSERT_LINK' })).data[0];
  // log(insertedLink);
  assert.equal(freeId, insertedLink.id);
  return freeId;
}

export const deleteHandler = async (handler) => {
  await deleteId(handler.handlerJSFileValueId, { table: 'strings' });
  await deleteId(handler.ownerContainHandlerId);
  await deleteIds([handler.handlerJSFileId, handler.handlerId, handler.handleOperationId]);
};

export const deleteSelector = async (selector: any) => {
  await deleteId(selector.linkTypeId);
  await deleteId(selector.nodeTypeId);
  await deleteId(selector.treeId);
  await deleteIds(selector.treeIncludesIds);
  await deleteId(selector.selectorId);
  await deleteId(selector.selectorIncludeId);
  await deleteId(selector.selectorTreeId);
  await deleteId(selector.rootId);
};

export async function deleteId(id: number, options: {
  table?: string;
  returning?: string;
  variables?: any;
  name?: string;
} = { table: 'links' })
{
  await deleteIds([id], options);
}

export async function deleteIds(ids: number[], options: {
  table?: string;
  returning?: string;
  variables?: any;
  name?: string;
} = { table: 'links' }) {
  // return await deep.delete(ids, options); // should work, but doesn't

  const idsFiltered = ids?.filter(linkId => typeof linkId === 'number');
  if (idsFiltered?.length > 0) {
    // log(`${options.table}, deleteIds[0..${idsFiltered.length}]: ${idsFiltered.join(', ')}`);
    try
    {
      return await deep.delete(idsFiltered, options);
    }
    catch (e)
    {
      console.error(`Error deleting ids: ${idsFiltered.join(', ')}`, JSON.stringify(e, null, 2));
    }
  } else {
    return { data: [] };
  }
}