import { assert } from 'chai';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { insertHandler, insertSelector, insertSelectorItem, deleteHandler, deleteSelector }  from "../imports/handlers";
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

// const handleInsertTypeId = _ids?.['@deep-foundation/core']?.HandleInsert; // await deep.id('@deep-foundation/core', 'HandleInsert');
// const handleUpdateTypeId = _ids?.['@deep-foundation/core']?.HandleUpdate; // await deep.id('@deep-foundation/core', 'HandleUpdate');
// const handleDeleteTypeId = _ids?.['@deep-foundation/core']?.HandleDelete;; // await deep.id('@deep-foundation/core', 'HandleDelete');
// const userTypeId = _ids?.['@deep-foundation/core']?.User // await deep.id('@deep-foundation/core', 'User');
// const packageTypeId = _ids?.['@deep-foundation/core']?.Package // await deep.id('@deep-foundation/core', 'Package');
// const containTypeId = _ids?.['@deep-foundation/core']?.Contain // await deep.id('@deep-foundation/core', 'Contain');
// const plv8SupportsJsTypeId = _ids?.['@deep-foundation/core']?.plv8SupportsJs // await deep.id('@deep-foundation/core', 'plv8SupportsJs');
// const HandlerTypeId = _ids?.['@deep-foundation/core']?.Handler // await deep.id('@deep-foundation/core', 'Handler');
// const SelectorTypeId = _ids?.['@deep-foundation/core']?.Selector // await deep.id('@deep-foundation/core', 'SelectorType');
// const AllowSelectTypeId = _ids?.['@deep-foundation/core']?.AllowSelectType // await deep.id('@deep-foundation/core', 'AllowSelectType');
// const AllowSelectId = _ids?.['@deep-foundation/core']?.AllowSelect // await deep.id('@deep-foundation/core', 'AllowSelect');
// const AllowAdminId = _ids?.['@deep-foundation/core']?.AllowAdmin // await deep.id('@deep-foundation/core', 'AllowAdmin');

// log({handleInsertTypeId, handleUpdateTypeId, handleDeleteTypeId, userTypeId,packageTypeId, containTypeId,plv8SupportsJsTypeId, HandlerTypeId, SelectorTypeId, AllowSelectTypeId, AllowSelectId,  AllowAdminId})

describe('sync handlers', () => {
  describe('Prepare fuction', () => {
    it(`handleInsert`, async () => {
      const handlerId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const link = JSON.stringify({id: 1, type_id: 1}); // change for yours
      const result = await api.sql(sql`select links__sync__handler__prepare__function('${link}'::jsonb, ${handlerId}::bigint)`);
      log('prepare result', result?.data?.result?.[1]?.[0]);
    });
  });
  describe('DeepClient mini', () => {
    it(`id`, async () => {
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'id', '{"start": "deep", "path":["admin"]}'::jsonb)`);
      const clientResult = await deep.id('deep', 'admin');
      log('id result', result?.data?.result?.[1]?.[0]);
      assert.equal(JSON.parse(result?.data?.result?.[1]?.[0])?.[0], clientResult);
    });
    describe('select', () => {
      it(`select by id and type_id`, async () => {
        const debug = log.extend('selectByIdAndType');
        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;
        debug('inserted', inserted );
        let result;
        try {
          result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"id": "${customLinkId}", "type_id":1}'::jsonb)`);
        } catch (e) {
          debug('select error: ', e);
        }
        const selectedByDeep = (await deep.select(customLinkId))?.data.map(({__typename, ...filtered})=>filtered);
        debug('delete inserted', await deep.delete({ id: { _eq: customLinkId } }));
        const selectedBySql = JSON.parse(result?.data?.result?.[1]?.[0]).map((link) => { return {id: Number(link.id), value: link.value, to_id: Number(link.to_id), from_id: Number(link.from_id), type_id: Number(link.type_id)}});
        debug('selectedBySql', selectedBySql);
        assert.equal(selectedBySql.length, 1);
        debug('selectedBySql?.[0]', selectedBySql?.[0]);
        assert.deepEqual(selectedBySql, selectedByDeep);
      });
      it.skip(`select by only value`, async () => {
        const debug = log.extend('selectByValue');
        const value = 'testValue';
        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;
        debug('inserted', inserted );
        let result;
        try {
          result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"value":"${value}"}'::jsonb)`);
        } catch (e) {
          debug('select error: ', e);
        }
        const selectedByDeep = (await deep.select({value: { _eq: value}}))?.data.map(({__typename, ...filtered})=>filtered);
        debug('delete inserted', await deep.delete({ id: { _eq: customLinkId } }));
        const selectedBySql = JSON.parse(result?.data?.result?.[1]?.[0]).map((link) => { return {id: Number(link.id), value: link.value, to_id: Number(link.to_id), from_id: Number(link.from_id), type_id: Number(link.type_id)}});
        debug('selectedBySql', selectedBySql);
        assert.equal(selectedBySql.length, 1);
        debug('selectedBySql?.[0]', selectedBySql?.[0]);
        assert.deepEqual(selectedBySql, selectedByDeep);
      });
    });
    it(`insert`, async () => {
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'insert', '{"type_id":1}'::jsonb)`);
      const customLinkId = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.id;
      log('customLinkId', customLinkId);
      const clientResult = await deep.select({id: {_eq: customLinkId}});
      log('clientResult', clientResult);
      if (customLinkId === clientResult?.data?.[0]?.id) deep.delete({id: {_eq: customLinkId}});
      assert.equal(customLinkId, clientResult?.data?.[0]?.id);
    });
    it.skip(`update`, async () => {
      const inserted = await deep.insert({ type_id: 1 });
      const customLinkId = inserted?.data?.[0]?.id;
      log('inserted', inserted );
      const result = await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'update', '{"id": "${customLinkId}", "_set": { "to_id":${customLinkId}, "from_id": ${customLinkId} } }'::jsonb)`);
      log('result',  result?.data?.result?.[1]?.[0] );
      const clientResult = await deep.select({id: {_eq: customLinkId}});
      assert.equal(clientResult?.data[0]?.type_id, 2);
    });
    it(`delete`, async () => {
      const inserted = await deep.insert({ type_id: 2 });
      const customLinkId = inserted?.data?.[0]?.id;
      await api.sql(sql`select links__deep__client(${await deep.id('deep', 'admin')}::bigint, 'delete', '{"id": "${customLinkId}"}'::jsonb)`);
      const result = await deep.select({id: {_eq: customLinkId}});
      log('delete result', result);
      assert.equal(result?.data[0], undefined);
    });
    // describe.skip('permissions', () => {
    //   describe('select', () => {
    //     it(`user contain range`, async () => {
    //       const a1 = await deep.guest({});
    //       const a2 = await deep.guest({});
    //       const { data: [{ id }] } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         in: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Contain'),
    //           from_id: a1.linkId,
    //         } }
    //       });
    //       const n1 = await d1.select({ id });
    //       assert.lengthOf(n1?.data, 1, `item_id ${id} must be selectable by ${a1.linkId}`);
    //       const n2 = await d2.select({ id });
    //       assert.lengthOf(n2?.data, 0, `item_id ${id} must not be selectable by ${a2.linkId}`);
    //       const n3 = await admin.select({ id });
    //       assert.lengthOf(n3?.data, 1, `item_id ${id} must be selectable by ${admin.linkId}`);
    //     });
    //     it(`rule select include 1 depth but exclude 2 depth`, async () => {
    //       const a1 = await deep.guest({});
    //       const a2 = await deep.guest({});
    //       const a3 = await deep.guest({});
    //       const d1 = new DeepClient({ deep, ...a1 });
    //       const d2 = new DeepClient({ deep, ...a2 });
    //       const d3 = new DeepClient({ deep, ...a3 });
    //       const { data: [{ id: id1 }] } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         in: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Contain'),
    //           from_id: a1.linkId,
    //         } }
    //       });
    //       const { data: [{ id: id2 }] } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         in: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Contain'),
    //           from_id: id1,
    //         } }
    //       });
    //       await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //         out: { data: [
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: a2.linkId,
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: id1,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
    //                   to_id: id2,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //         ] },
    //       });
    
    //       const n1 = await d1.select({ id: id1 });
    //       assert.lengthOf(n1?.data, 1);
    //       const n2 = await d2.select({ id: id1 });
    //       assert.lengthOf(n2?.data, 1);
    //       const n3 = await d3.select({ id: id1 });
    //       assert.lengthOf(n3?.data, 0);
    
    //       const n4 = await admin.select({ id: id1 });
    //       assert.lengthOf(n4?.data, 1);
    
    //       const n5 = await d1.select({ id: id2 });
    //       assert.lengthOf(n5?.data, 1);
    //       const n6 = await d2.select({ id: id2 });
    //       assert.lengthOf(n6?.data, 0);
    //       const n7 = await d3.select({ id: id2 });
    //       assert.lengthOf(n7?.data, 0);
    
    //       const n8 = await admin.select({ id: id2 });
    //       assert.lengthOf(n8?.data, 1);
    //     });
    //   });
    //   describe('insert', () => {
    //     it(`root can insert`, async () => {
    //       const { data: [{ id }], error } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       const n1 = await deep.select({ id });
    //       assert.lengthOf(n1?.data, 1);
    //     });
    //     it(`guest cant insert by default`, async () => {
    //       const a1 = await deep.guest({});
    //       const d1 = new DeepClient({ deep, ...a1, silent: true });
    //       const { data, error } = await d1.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       assert.isNotEmpty(error);
    //     });
    //     it(`insert permission can be gived to guest`, async () => {
    //       const a1 = await deep.guest({});
    //       const a2 = await deep.guest({});
    //       const a3 = await deep.guest({});
    //       await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //         out: { data: [
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a1.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a2.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
    //                   to_id: a3.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //         ] },
    //       });
    //       const d1 = new DeepClient({ deep, ...a1, silent: true });
    //       const { data: da1, error: e1 } = await d1.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       if (e1) console.log('error', e1);
    //       expect(da1).to.not.be.undefined;
    //       expect(e1).to.be.undefined;
    //       const d2 = new DeepClient({ deep, ...a2, silent: true });
    //       const { data: da2, error: e2 } = await d2.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       expect(da2).to.not.be.undefined;
    //       expect(e2).to.be.undefined;
    //       const d3 = new DeepClient({ deep, ...a3, silent: true });
    //       const { data: da3, error: e3 } = await d3.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       expect(da3).to.be.undefined;
    //       expect(e3).to.not.be.undefined;
    //     });
    //     it(`insert permission with SelectorFilter`, async () => {
    //       const a1 = await deep.guest({});
    //       const a2 = await deep.guest({});
    //       const a3 = await deep.guest({});
    //       const { data: [{ id: TempType }] } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Type'),
    //         from_id: await deep.id('@deep-foundation/core', 'Any'),
    //         to_id: await deep.id('@deep-foundation/core', 'Any'),
    //       });
    //       await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //         out: { data: [
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a1.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a2.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a3.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: await deep.id('@deep-foundation/core'),
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //         ] },
    //       });
    //       await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //         out: { data: [
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a1.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a2.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a3.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: TempType,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
    //                   to: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'Query'),
    //                     object: { data: { value: {
    //                       to_id: { _eq: 'X-Deep-User-Id' } ,// <== HERE
    //                     }, }, },
    //                   }, },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //         ] },
    //       });
    
    //       await delay(5000);
    
    //       const d1 = new DeepClient({ deep, ...a1, silent: true });
    //       const { data: da1, error: e1 } = await d1.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       expect(da1).to.not.be.undefined;
    //       expect(e1).to.be.undefined;
    //       const { data: da1t, error: e1t } = await d1.insert({
    //         type_id: TempType,
    //         from_id: da1?.[0]?.id,
    //         to_id: a1.linkId,
    //       });
    //       expect(da1t).to.not.be.undefined;
    //       expect(e1t).to.be.undefined;
    //       const d2 = new DeepClient({ deep, ...a2, silent: true });
    //       const { data: da2, error: e2 } = await d2.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       expect(da2).to.not.be.undefined;
    //       expect(e2).to.be.undefined;
    //       const { data: da2t, error: e2t } = await d2.insert({
    //         type_id: TempType,
    //         from_id: da2?.[0]?.id,
    //         to_id: a1.linkId, // <== HERE
    //       });
    //       expect(da2t).to.be.undefined; // <== HERE
    //       expect(e2t).to.not.be.undefined;
    //       const d3 = new DeepClient({ deep, ...a3, silent: true });
    //       const { data: da3, error: e3 } = await d3.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       expect(da3).to.not.be.undefined;
    //       expect(e3).to.be.undefined;
    //       const { data: da3t, error: e3t } = await d3.insert({
    //         type_id: TempType,
    //         from_id: da2?.[0]?.id,
    //         to_id: a3.linkId,
    //       });
    //       expect(da3t).to.not.be.undefined;
    //       expect(e3t).to.be.undefined;
    //     });
    //   });
    //   describe('update', () => {
    //     it(`root can update string value`, async () => {
    //       const { data: [{ id }], error } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         string: { data: { value: 'abc' } },
    //       });
    //       await deep.update({ link_id: id }, {
    //         value: 'def',
    //       }, { table: 'strings' });
    //       const n1 = await deep.select({ id });
    //       assert.lengthOf(n1?.data, 1);
    //       assert.equal(n1?.data?.[0]?.value?.value, 'def');
    //     });
    //     it(`guest cant update string value`, async () => {
    //       const a1 = await deep.guest({});
    //       const { data: [{ id }], error } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         string: { data: { value: 'abc' } },
    //       });
    //       const d1 = new DeepClient({ deep, ...a1 });
    //       const { data: updated } = await d1.update({ link_id: id }, {
    //         value: 'def',
    //       }, { table: 'strings' });
    //       assert.lengthOf(updated, 0);
    //       const n1 = await deep.select({ id });
    //       assert.lengthOf(n1?.data, 1);
    //       assert.equal(n1?.data?.[0]?.value?.value, 'abc');
    //     });
    //     it(`update permission can be gived to guest`, async () => {
    //       const { data: [{ id }], error } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         string: { data: { value: 'abc' } },
    //       });
    //       const a1 = await deep.guest({});
    //       const a2 = await deep.guest({});
    //       const a3 = await deep.guest({});
    //       await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //         out: { data: [
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a1.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a2.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
    //                   to_id: a3.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core', 'AllowUpdateType'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //         ] },
    //       });
    //       const d1 = new DeepClient({ deep, ...a1 });
    //       const { data: u1 } = await d1.update({ link_id: id }, {
    //         value: 'def',
    //       }, { table: 'strings' });
    //       assert.lengthOf(u1, 1);
    //       const n1 = await deep.select({ id });
    //       assert.equal(n1?.data?.[0]?.value?.value, 'def');
    //       const d2 = new DeepClient({ deep, ...a2 });
    //       const { data: u2 } = await d2.update({ link_id: id }, {
    //         value: 'efg',
    //       }, { table: 'strings' });
    //       assert.lengthOf(u2, 1);
    //       const n2 = await deep.select({ id });
    //       assert.equal(n2?.data?.[0]?.value?.value, 'efg');
    //       const d3 = new DeepClient({ deep, ...a3 });
    //       const { data: u3 } = await d3.update({ link_id: id }, {
    //         value: 'fgj',
    //       }, { table: 'strings' });
    //       assert.lengthOf(u3, 0);
    //       const n3 = await deep.select({ id });
    //       assert.equal(n3?.data?.[0]?.value?.value, 'efg');
    //     });
    //   });
    //   describe('delete', () => {
    //     it(`root can delete`, async () => {
    //       const { data: [{ id }], error } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       const n1 = await deep.select({ id });
    //       assert.lengthOf(n1?.data, 1);
    //       const { data: deleted } = await deep.delete(id);
    //       assert.lengthOf(deleted, 1);
    //       const n2 = await deep.select({ id });
    //       assert.lengthOf(n2?.data, 0);
    //     });
    //     it(`guest cant delete by default`, async () => {
    //       const { data: [{ id }], error } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       const n1 = await deep.select({ id });
    //       assert.lengthOf(n1?.data, 1);
    //       const a1 = await deep.guest({});
    //       const d1 = new DeepClient({ deep, ...a1 });
    //       const { data: deleted } = await d1.delete(id);
    //       assert.lengthOf(deleted, 0);
    //       const n2 = await deep.select({ id });
    //     });
    //     it(`delete permission can be gived to guest`, async () => {
    //       const a1 = await deep.guest({});
    //       const a2 = await deep.guest({});
    //       const a3 = await deep.guest({});
    //       await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //         out: { data: [
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a1.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a2.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
    //                   to_id: a3.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] },
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core', 'AllowDeleteType'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //         ] },
    //       });
    //       const { data: [{ id: id1 }] } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       const d1 = new DeepClient({ deep, ...a1 });
    //       await d1.delete(id1);
    //       const n1 = await deep.select({ id: id1 });
    //       assert.lengthOf(n1?.data, 0);
    
    //       const { data: [{ id: id2 }] } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       const d2 = new DeepClient({ deep, ...a2 });
    //       await d2.delete(id2);
    //       const n2 = await deep.select({ id: id2 });
    //       assert.lengthOf(n2?.data, 0);
    
    //       const { data: [{ id: id3 }] } = await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //       });
    //       const d3 = new DeepClient({ deep, ...a3 });
    //       await d3.delete(id3);
    //       const n3 = await deep.select({ id: id3 });
    //       assert.lengthOf(n3?.data, 1);
    //     });
    //     it(`delete permission with SelectorFilter`, async () => {
    //       const a1 = await deep.guest({});
    //       const a2 = await deep.guest({});
    //       const a3 = await deep.guest({});
    //       await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //         out: { data: [
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a1.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a2.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a3.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: await deep.id('@deep-foundation/core', 'Operation'),
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //         ] },
    //       });
    //       await deep.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //         out: { data: [
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a1.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a2.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: a3.linkId,
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: [
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                   to_id: await deep.id('@deep-foundation/core', 'Operation'),
    //                   out: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                     to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                   } },
    //                 },
    //                 {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
    //                   to: { data: {
    //                     type_id: await deep.id('@deep-foundation/core', 'Query'),
    //                     object: { data: { value: {
    //                       string: { value: { _eq: 'abc2' } },// <== HERE
    //                     }, }, },
    //                   }, },
    //                 },
    //               ] }
    //             } }
    //           },
    //           {
    //             type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //             to: { data: {
    //               type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //               out: { data: {
    //                 type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    //                 to_id: await deep.id('@deep-foundation/core', 'AllowDeleteType'),
    //                 out: { data: {
    //                   type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
    //                   to_id: await deep.id('@deep-foundation/core', 'containTree'),
    //                 } },
    //               } }
    //             } }
    //           },
    //         ] },
    //       });
    
    //       await delay(5000);
    
    //       const d1 = new DeepClient({ deep, ...a1, silent: true });
    //       const { data: da1, error: e1 } = await d1.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         string: { data: { value: 'abc1' } },
    //       });
    //       expect(e1).to.be.undefined;
    //       expect(da1).to.not.be.undefined;
    //       const { data: da1d, error: e1d } = await d1.delete(da1?.[0]?.id);
    //       expect(e1d).to.not.be.undefined;
    //       expect(da1d).to.be.undefined;
    //       const d2 = new DeepClient({ deep, ...a2, silent: true });
    //       const { data: da2, error: e2 } = await d2.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         string: { data: { value: 'abc2' } },
    //       });
    //       expect(e2).to.be.undefined;
    //       expect(da2).to.not.be.undefined;
    //       const { data: da2d, error: e2d } = await d2.delete(da2?.[0]?.id);
    //       expect(e2d).to.be.undefined;
    //       expect(da2d).to.not.be.undefined;
    //       const d3 = new DeepClient({ deep, ...a3, silent: true });
    //       const { data: da3, error: e3 } = await d3.insert({
    //         type_id: await deep.id('@deep-foundation/core', 'Operation'),
    //         string: { data: { value: 'abc3' } },
    //       });
    //       expect(e3).to.be.undefined;
    //       expect(da3).to.not.be.undefined;
    //       const { data: da3d, error: e3d } = await d3.delete(da3?.[0]?.id);
    //       expect(e3d).to.not.be.undefined;
    //       expect(da3d).to.be.undefined;
    //     });
    //   });
    // });
  });
  describe('Handle operations', () => {
    describe('Handle insert', () => {
      it(`Handle insert on type`, async () => {
        const debug = log.extend('HandleInsert');

        const typeId = await deep.id('@deep-foundation/core', 'Type');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        
        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleInsertTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        debug('customLinkId', customLinkId);
        
        try {
          const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
          debug('linkId', linkId);
          debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler?.data?.[0]?.id);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        debug('delete handler', await deleteHandler(handler));
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      });
      it(`Handle insert 2 triggers and broke transaction in second`, async () => {
        const debug = log.extend('HandleInsert');

        const typeId = await deep.id('@deep-foundation/core', 'Type');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleInsertTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        debug('customLinkId', customLinkId);

        const handler2 = await insertHandler(
          handleInsertTypeId,
          typeId,
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); throw new Error('errorTest')}`,
          undefined,
          supportsId
        );
        
        try {
          const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
          debug('linkId', linkId);
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler?.data?.[0]?.id);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        debug('delete handler', await deleteHandler(handler));
        debug('delete handler2', await deleteHandler(handler2));
        assert.equal(insertedByHandler?.data?.[0]?.id, undefined);
      });
      it(`Handle insert 1 trigger and 2 types, check not triggered twice`, async () => {
        const debug = log.extend('HandleInsert1x2');

        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;
        debug('customLinkId', customLinkId);

        const inserted2 = await deep.insert({type_id: 1});
        const customLinkId2 = inserted2?.data?.[0]?.id;
        debug('customLinkId2', customLinkId2);

        const handler = await insertHandler(
          handleInsertTypeId,
          customLinkId2, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        
        try {
          const link = (await deep.insert({ type_id: customLinkId2 }))?.data?.[0];
          const linkId = link.id;
          if (linkId) await deep.delete(linkId);
          debug('linkId', linkId);
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        assert.equal(insertedByHandler?.data?.length, 1); // check triggered once

        const link2 = (await deep.insert({ type_id: customLinkId, from_id: customLinkId, to_id: customLinkId }))?.data?.[0];
        const insertedByHandler2 = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        assert.equal(insertedByHandler2?.data?.length, 2); // check not triggered again (inserted customLinkId type so 1 + 1 = 2)
        if (link2?.id) await deep.delete(link2?.id);

        debug('insertedByHandler', insertedByHandler?.data);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        await deep.delete(customLinkId2);
        debug('delete handler', await deleteHandler(handler));
      });
      it(`Handle insert on type throw error`, async () => {
        const debug = log.extend('HandleInsertError');

        const typeId = await deep.id('@deep-foundation/core', 'Type');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleInsertTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); throw new Error('testError');}`,
          undefined,
          supportsId
        );
        let linkId
        let error;
        debug('handler', handler);
        try {
          const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
          debug('ensureLinkIsCreated', linkId);
          throw new Error('Not errored hadnler!')
        } catch (e) {
          debug('error', e?.message);
          error = e?.message;
        }
       
        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler?.data?.[0]?.id);

        debug('delete handler', JSON.stringify(await deleteHandler(handler)));
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        if (linkId) {
          const deleteResult = await deep.delete({ id: { _eq: linkId } });
          debug('delete linkid', deleteResult);
        }
        assert.equal(error, 'testError');
      });
      it(`Handle insert on selector`, async () => {
        const debug = log.extend('HandleInsertSelect');

        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const selector = await insertSelector();
        debug('selector', selector);
        const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;

        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleInsertTypeId,
          selectorId,
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
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
        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler?.data?.[0]?.id);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        await deep.delete(customLinkId);
        debug('deleteSelector');
        await deleteSelector(selector);
        debug('deleteHandler');
        await deleteHandler(handler);
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      });
    });
    describe.skip('Handle update', () => {
      it(`Handle update on type`, async () => {
        const debug = log.extend('HandleUpdate');

        const typeId = await deep.id('@deep-foundation/core', 'Type');
        const HandlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
        const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleUpdateTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        debug('customLinkId', customLinkId);

        const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
        
        try {
          const updated = await deep.update(linkId, {type_id: HandlerTypeId});
          debug('updated', updated);
        } catch (e){
          debug('insert error: ', e);
        }
        
        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler);
        
        debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));

        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        debug('insertedByHandler', insertedByHandler?.data[0]);
        debug('delete handler', await deleteHandler(handler));
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      });
      it(`Handle update on selector`, async () => {
        const debug = log.extend('HandleUpdateSelect');

        const HandlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
        const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const selector = await insertSelector();
        debug('selector', selector);
        const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;

        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleUpdateTypeId,
          selectorId,
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
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

        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler);

        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        debug('selectorItem');
        if (selectorItem?.linkId) await deep.delete(selectorItem.linkId);
        debug('deleteSelector');
        await deleteSelector(selector);
        debug('deleteHandler');
        await deleteHandler(handler);
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      });
    });
    describe('Handle delete', () => {
      it(`Handle delete on type`, async () => {
        const debug = log.extend('HandleDelete');

        const typeId = await deep.id('@deep-foundation/core', 'Type');
        const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleDeleteTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        debug('customLinkId', customLinkId);

        const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
        
        try {
          const deleted = await deep.delete(linkId);
          debug('deleted', deleted);
        } catch (e){
          debug('insert error: ', e);
        }
        
        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler);

        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        debug('delete handler', await deleteHandler(handler));
        await deep.delete(customLinkId);
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      });
      it(`Handle delete on selector`, async () => {
        const debug = log.extend('HandleDeleteSelect');

        const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const selector = await insertSelector();
        debug('selector', selector);
        const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;

        const anyTypeId = await deep.id('@deep-foundation/core', 'Type');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleDeleteTypeId,
          selectorId,
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
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

        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler);

        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        debug('deleteSelector');
        await deleteSelector(selector);
        debug('deleteHandler');
        await deleteHandler(handler);
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      });
    });
  });
});