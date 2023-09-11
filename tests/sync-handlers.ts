import { assert, expect } from 'chai';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { insertHandler, insertSelector, insertSelectorItem, deleteHandler, deleteSelector }  from "../imports/handlers";
import { HasuraApi } from'@deep-foundation/hasura/api';
import { sql } from '@deep-foundation/hasura/sql.js';
import { _ids } from '../imports/client.js';
import { createPrepareFunction, createDeepClientFunction, createSyncInsertTriggerFunction, dropSyncInsertTriggerFunction, dropSyncInsertTrigger, createSyncInsertTrigger, createSyncDeleteTriggerFunction, createSyncDeleteTrigger, dropSyncDeleteTriggerFunction, dropSyncDeleteTrigger, createSyncDeleteStringsTrigger, createSyncDeleteStringsTriggerFunction, createSyncInsertStringsTrigger, createSyncInsertStringsTriggerFunction, createSyncUpdateStringsTrigger, createSyncUpdateStringsTriggerFunction, dropSyncDeleteStringsTrigger, dropSyncDeleteStringsTriggerFunction, dropSyncInsertStringsTrigger, dropSyncInsertStringsTriggerFunction, dropSyncUpdateStringsTrigger, dropSyncUpdateStringsTriggerFunction, createSyncDeleteNumbersTrigger, createSyncDeleteNumbersTriggerFunction, createSyncInsertNumbersTrigger, createSyncInsertNumbersTriggerFunction, createSyncUpdateNumbersTrigger, createSyncUpdateNumbersTriggerFunction, dropSyncDeleteNumbersTrigger, dropSyncDeleteNumbersTriggerFunction, dropSyncInsertNumbersTrigger, dropSyncInsertNumbersTriggerFunction, dropSyncUpdateNumbersTrigger, dropSyncUpdateNumbersTriggerFunction, createSyncDeleteObjectsTrigger, createSyncDeleteObjectsTriggerFunction, createSyncInsertObjectsTrigger, createSyncInsertObjectsTriggerFunction, createSyncUpdateObjectsTrigger, createSyncUpdateObjectsTriggerFunction, dropSyncDeleteObjectsTrigger, dropSyncDeleteObjectsTriggerFunction, dropSyncInsertObjectsTrigger, dropSyncInsertObjectsTriggerFunction, dropSyncUpdateObjectsTrigger, dropSyncUpdateObjectsTriggerFunction } from "../migrations/1655979260869-sync-handlers";
import Debug from 'debug';
import { MutationInputLink } from '../imports/client_types.js';
// import { _ids } from '../imports/client.js';

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

// beforeAll(async () => {
  // manual remigrate plv8
  // console.log('manual remigrating...');
  // await api.sql(`${createPrepareFunction}`);
  // await api.sql(`${createDeepClientFunction}`);
  
  // await api.sql(dropSyncInsertTrigger);
  // await api.sql(dropSyncInsertTriggerFunction);

  // await api.sql(dropSyncDeleteTrigger);
  // await api.sql(dropSyncDeleteTriggerFunction);

  // await api.sql(dropSyncInsertStringsTrigger);
  // await api.sql(dropSyncInsertStringsTriggerFunction);

  // await api.sql(dropSyncUpdateStringsTrigger);
  // await api.sql(dropSyncUpdateStringsTriggerFunction);

  // await api.sql(dropSyncDeleteStringsTrigger);
  // await api.sql(dropSyncDeleteStringsTriggerFunction);

  // await api.sql(dropSyncInsertNumbersTrigger);
  // await api.sql(dropSyncInsertNumbersTriggerFunction);

  // await api.sql(dropSyncUpdateNumbersTrigger);
  // await api.sql(dropSyncUpdateNumbersTriggerFunction);

  // await api.sql(dropSyncDeleteNumbersTrigger);
  // await api.sql(dropSyncDeleteNumbersTriggerFunction);

  // await api.sql(dropSyncInsertObjectsTrigger);
  // await api.sql(dropSyncInsertObjectsTriggerFunction);

  // await api.sql(dropSyncUpdateObjectsTrigger);
  // await api.sql(dropSyncUpdateObjectsTriggerFunction);

  // await api.sql(dropSyncDeleteObjectsTrigger);
  // await api.sql(dropSyncDeleteObjectsTriggerFunction);

  // await api.sql(createSyncInsertObjectsTriggerFunction);
  // await api.sql(createSyncInsertObjectsTrigger);

  // await api.sql(createSyncUpdateObjectsTriggerFunction);
  // await api.sql(createSyncUpdateObjectsTrigger);

  // await api.sql(createSyncDeleteObjectsTriggerFunction);
  // await api.sql(createSyncDeleteObjectsTrigger);

  // await api.sql(createSyncInsertNumbersTriggerFunction);
  // await api.sql(createSyncInsertNumbersTrigger);

  // await api.sql(createSyncUpdateNumbersTriggerFunction);
  // await api.sql(createSyncUpdateNumbersTrigger);

  // await api.sql(createSyncDeleteNumbersTriggerFunction);
  // await api.sql(createSyncDeleteNumbersTrigger);
  
  // await api.sql(createSyncInsertTriggerFunction);
  // await api.sql(createSyncInsertTrigger);

  // await api.sql(createSyncDeleteTriggerFunction);
  // await api.sql(createSyncDeleteTrigger);

  // await api.sql(createSyncInsertStringsTriggerFunction);
  // await api.sql(createSyncInsertStringsTrigger);

  // await api.sql(createSyncUpdateStringsTriggerFunction);
  // await api.sql(createSyncUpdateStringsTrigger);

  // await api.sql(createSyncDeleteStringsTriggerFunction);
  // await api.sql(createSyncDeleteStringsTrigger);
// });

const handleInsertTypeId = _ids?.['@deep-foundation/core']?.HandleInsert; // await deep.id('@deep-foundation/core', 'HandleInsert');
const handleUpdateTypeId = _ids?.['@deep-foundation/core']?.HandleUpdate; // await deep.id('@deep-foundation/core', 'HandleUpdate');
const handleDeleteTypeId = _ids?.['@deep-foundation/core']?.HandleDelete;; // await deep.id('@deep-foundation/core', 'HandleDelete');
const userTypeId = _ids?.['@deep-foundation/core']?.User // await deep.id('@deep-foundation/core', 'User');
const packageTypeId = _ids?.['@deep-foundation/core']?.Package // await deep.id('@deep-foundation/core', 'Package');
const containTypeId = _ids?.['@deep-foundation/core']?.Contain // await deep.id('@deep-foundation/core', 'Contain');
const plv8SupportsJsTypeId = _ids?.['@deep-foundation/core']?.plv8SupportsJs // await deep.id('@deep-foundation/core', 'plv8SupportsJs');
const HandlerTypeId = _ids?.['@deep-foundation/core']?.Handler // await deep.id('@deep-foundation/core', 'Handler');
const SelectorTypeId = _ids?.['@deep-foundation/core']?.Selector // await deep.id('@deep-foundation/core', 'SelectorType');
const AllowSelectTypeId = _ids?.['@deep-foundation/core']?.AllowSelectType // await deep.id('@deep-foundation/core', 'AllowSelectType');
const AllowSelectId = _ids?.['@deep-foundation/core']?.AllowSelect // await deep.id('@deep-foundation/core', 'AllowSelect');
const AllowAdminId = _ids?.['@deep-foundation/core']?.AllowAdmin // await deep.id('@deep-foundation/core', 'AllowAdmin');

log({handleInsertTypeId, handleUpdateTypeId, handleDeleteTypeId, userTypeId,packageTypeId, containTypeId,plv8SupportsJsTypeId, HandlerTypeId, SelectorTypeId, AllowSelectTypeId, AllowSelectId,  AllowAdminId});

describe('sync handlers', () => {
  describe('Prepare fuction', () => {
    it(`handleInsert`, async () => {
      const handlerId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const link = JSON.stringify({id: 1, type_id: 1}); // change for yours
      const result = await api.sql(sql`select links__sync__handlers__prepare__function('${link}'::jsonb, ${handlerId}::bigint)`);
      log('prepare result', result?.data?.result?.[1]?.[0]);
    });
  });
  describe('DeepClient mini', () => {
    it(`id`, async () => {
      const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'id', '["@deep-foundation/core", "Rule"]'::jsonb, '{}'::jsonb)`);
      const clientResult = await deep.id('@deep-foundation/core', 'Rule');
      log('id result', result?.data?.result?.[1]?.[0]);
      assert.equal(JSON.parse(result?.data?.result?.[1]?.[0])?.[0], clientResult);
    });
    it(`login as guest and insert`, async () => {
      const debug = log.extend('HandleInsert');

      const guest = await deep.guest({});
      const typeId = await deep.id('@deep-foundation/core', 'Operation');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      
      const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
      const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
      const customLinkId = inserted?.data?.[0]?.id;
      debug('customLinkId', customLinkId);

      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `({deep, data}) => {
          const initId = deep.linkId;
          deep.login({linkId:${guest.linkId}});
          deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}, object: { initId, guestId: deep.linkId }});
        }`,
        undefined,
        supportsId
      );
      debug('handler', handler);
      
      try {
        const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
        debug('linkId', linkId);
        debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      } catch (e){
        debug('insert error: ', e);
      }

      const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });

      debug('adminId', await deep.id('deep', 'admin'));
      debug('insertedByHandler', insertedByHandler?.data);
      debug('insertedByHandler data', insertedByHandler?.data?.[0]?.value?.value);
      if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
      await deep.delete(customLinkId);
      debug('delete handler', await deleteHandler(handler));
      assert.equal(!!insertedByHandler?.data?.[0]?.id, false);
    });
    it(`login as guest, relogin as admin and insert`, async () => {
      const debug = log.extend('HandleInsert');

      const guest = await deep.guest({});
      const typeId = await deep.id('@deep-foundation/core', 'Operation');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      
      const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
      const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
      const customLinkId = inserted?.data?.[0]?.id;
      debug('customLinkId', customLinkId);

      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `({deep, data}) => {
          deep.login({linkId:${await deep.id('deep', 'admin')}});
          deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}});
        }`,
        undefined,
        supportsId
      );
      debug('handler', handler);
      
      try {
        const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
        debug('linkId', linkId);
        debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      } catch (e){
        debug('insert error: ', e);
      }

      const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });

      debug('adminId', await deep.id('deep', 'admin'));
      debug('insertedByHandler', insertedByHandler?.data);
      debug('insertedByHandler data', insertedByHandler?.data?.[0]?.value?.value);
      if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
      await deep.delete(customLinkId);
      debug('delete handler', await deleteHandler(handler));
      assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
    });
    it(`new client by linkId`, async () => {
      const debug = log.extend('HandleInsert');

      const typeId = await deep.id('@deep-foundation/core', 'Operation');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      
      const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
      const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
      const customLinkId = inserted?.data?.[0]?.id;
      debug('customLinkId', customLinkId);

      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `({deep, data}) => {
          const newDeep = deep.new({linkId:${await deep.id('deep', 'admin')}});
          newDeep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}, object: {linkId: newDeep.linkId}});
        }`,
        undefined,
        supportsId
      );
      debug('handler', handler);
      
      try {
        const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
        debug('linkId', linkId);
        debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      } catch (e){
        debug('insert error: ', e);
      }

      const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });

      debug('adminId', await deep.id('deep', 'admin'));
      debug('insertedByHandler', insertedByHandler?.data);
      debug('insertedByHandler data', insertedByHandler?.data?.[0]?.value?.value);
      if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
      await deep.delete(customLinkId);
      debug('delete handler', await deleteHandler(handler));
      assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      assert.equal(insertedByHandler?.data?.[0]?.value?.value?.linkId, await deep.id('deep', 'admin'));
    });
    it(`new client by jwt`, async () => {
      const debug = log.extend('HandleInsert');

      const typeId = await deep.id('@deep-foundation/core', 'Operation');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      
      const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
      const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
      const customLinkId = inserted?.data?.[0]?.id;
      debug('admin Token', (await deep.jwt({ linkId: await deep.id('deep', 'admin') })).token);
      

      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `({deep, data}) => {
          const newDeep = deep.new({token:'${(await deep.jwt({ linkId: await deep.id('deep', 'admin') })).token}'});
          newDeep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}, object: {linkId: newDeep.linkId}});
        }`,
        undefined,
        supportsId
      );
      debug('handler', handler);
      
      try {
        const linkId = (await deep.insert({ type_id: typeId }))?.data?.[0].id;
        debug('linkId', linkId);
        debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      } catch (e){
        debug('insert error: ', e);
      }

      const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });

      debug('adminId', await deep.id('deep', 'admin'));
      debug('insertedByHandler', insertedByHandler?.data);
      debug('insertedByHandler data', insertedByHandler?.data?.[0]?.value?.value);
      if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
      await deep.delete(customLinkId);
      debug('delete handler', await deleteHandler(handler));
      assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      assert.equal(insertedByHandler?.data?.[0]?.value?.value?.linkId, await deep.id('deep', 'admin'));
    });
    it(`can`, async () => {
      const debug = log.extend('HandleInsert');

      const guest = await deep.guest({});
      const typeId = await deep.id('@deep-foundation/core', 'Operation');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      
      const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
      const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
      const customLinkId = inserted?.data?.[0]?.id;
      const admin_token = (await deep.jwt({ linkId: await deep.id('deep', 'admin') })).token;
      debug('admin Token', admin_token);
      

      const apolloClientAdmin = generateApolloClient({
        path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
        ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
        token: admin_token,
      });
      
      const deepAdmin = new DeepClient({ apolloClient: apolloClientAdmin });

      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `({deep, data}) => {
          deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}, object: {
            canAdmin: deep.can(null, deep.linkId, ${await deep.id('@deep-foundation/core', 'AllowAdmin')}),
            canGuest: deep.can(null, ${guest.linkId}, ${await deep.id('@deep-foundation/core', 'AllowAdmin')}),
            linkId: String(deep.linkId),
          }});
        }`,
        undefined,
        supportsId
      );
      debug('handler', handler);
      
      try {
        const linkId = (await deepAdmin.insert({ type_id: typeId }))?.data?.[0].id;
        debug('linkId', linkId);
        debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));
      } catch (e){
        debug('insert error: ', e);
      }

      const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });

      debug('adminId', await deep.id('deep', 'admin'));
      debug('insertedByHandler', insertedByHandler?.data);
      debug('insertedByHandler data', insertedByHandler?.data?.[0]?.value?.value);
      if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
      await deep.delete(customLinkId);
      debug('delete handler', await deleteHandler(handler));
      assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      assert.equal(insertedByHandler?.data?.[0]?.value?.value?.canAdmin, true);
      assert.equal(insertedByHandler?.data?.[0]?.value?.value?.canGuest, false);
    });
    it(`objectGet`, async () => {
      const { data: [{ id }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
        object: { data: { value: { a: 3 }}}
      });
      const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'objectGet','[${id},["a"]]'::jsonb, '{}'::jsonb)`);
      log('objectGet result', result?.data?.result?.[1]?.[0]);
      const selected = await deep.select(id);
      log('selected', selected?.data?.[0]);
      assert.equal(3, JSON.parse(result?.data?.result?.[1]?.[0])['data']);
    });
    it(`objectSet`, async () => {
      const { data: [{ id }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Operation'),
        object: { data: { value: { a: 3 }}}
      });
      
      const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'objectSet','[${id},["a"], { "b": 3 }]'::jsonb, '{}'::jsonb)`);
      log('objectSet result', result?.data?.result?.[1]?.[0]);
      const selected = await deep.select(id);
      log('selected', selected?.data?.[0]);
      assert.equal(3, selected?.data?.[0]?.value?.value?.a?.b);
    });
    describe('unsafe', () => {
      it(`objectSet`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          object: { data: { a: { value: 'HelloBugFixers'}, b: { value: 'HelloBugFixers2'}}},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const path = ['a'];
        const sqlString = sql`update objects set value = jsonb_set(value, $2, $3, true) where link_id = $1`;
        const value = 'HelloBugFixers3';
        log('sqlAll', `select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'unsafe'::text, $select$["${sqlString}",  ${id}, ${JSON.stringify(path)}, "${value}"]$select$::jsonb, '{}'::jsonb)`);
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'unsafe'::text, $select$["${sqlString}",  ${id}, ${JSON.stringify(path)}, "${value}"]$select$::jsonb, '{}'::jsonb)`);
        log('select result', result?.data?.result?.[1]?.[0]);
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        assert.equal(selected?.data?.[0]?.value?.value?.a, 'HelloBugFixers3');
      });
      it(`objectGet`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          object: { a: { value: 'HelloBugFixers'}, b: { value: 'HelloBugFixers2'}},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const path = ['a', 'value'];
        const sqlString = sql`select value#>$2 from objects where link_id = $1`;
        const sqlAll = sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'unsafe'::text, $select$["${sqlString}",  ${id}, ${JSON.stringify(path)}]$select$::jsonb, '{}'::jsonb)`;
        log('sqlAll', sqlAll);
        const result = await api.sql(sqlAll);
        log('select result', result?.data?.result?.[1]?.[0]);
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        assert.equal(selected?.data?.[0]?.value?.value?.a?.value, 'HelloBugFixers');
      });
    });
    describe('select', () => {
      it(`select should return value`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          string: { data: { value: 'HelloBugFixers'}},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"id": ${id}}'::jsonb, '{}'::jsonb)`);
        log('select result', result?.data?.result?.[1]?.[0]);
        const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        assert.equal(value?.value, 'HelloBugFixers');
        assert.equal(value?.id, selected?.data?.[0]?.value?.id);
      });
      describe('number', () => {
        it(`number: { value: number }}`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            number: { data: { value: 1515}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "number": {"value": 1515}}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 1515);
        });
        it(`number: { value: { "_in": [ number, number ] }}`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            number: { data: { value: 1515}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "number": {"value": { "_in": [ 1515, 12 ]}}}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 1515);
        });
        it(`number: number`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            number: { data: { value: 1515}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "number": 1515}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 1515);
        });
        it(`number: { "_in": [ number, number ]}`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            number: { data: { value: 1515}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "number": { "_in": [ 1515, 9999 ]}}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 1515);
        });
      });
      describe('string', () => {
        it(`string: { value: string }`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          string: { data: { value: 'HelloBugFixers'}},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "string": {"value": "HelloBugFixers"}}'::jsonb, '{}'::jsonb)`);
        log('select result', result?.data?.result?.[1]?.[0]);
        const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        await deep.delete(id);
        assert.equal(value?.value, 'HelloBugFixers');
        });
        it(`string: { value: { "_in": [ string, string ] }}`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'HelloBugFixers2'}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "string": {"value": { "_in": [ "HelloBugFixers2", "noNoNO" ]}}}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 'HelloBugFixers2');
        });
        it(`string: 'string'`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'HelloBugFixersTest'}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const { data: [{ id : id2 }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'hellobugfixerstest'}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "string": "hellobugfixerstest"}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result);
          log('select result?.[1]', result?.data?.result?.[1]);
          log('select result?.[1]?.[0]', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id2);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          await deep.delete(id2);
          assert.equal(value?.value, 'hellobugfixerstest');
        });
        it(`string: { "_in": ['string', 'string'] }`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'HelloBugFixersTest'}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "string": { "_in": ["hellobugfixerstest", "goodbyebugfixerstest"]}}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 'hellobugfixerstest');
        });
      });
      describe('object', () => {
        it(`object: { value: object }`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            object: { data: { value: { key: 'HelloBugFixers' }}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "object": {"value": { "key": "HelloBugFixers" }}}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value?.key, 'HelloBugFixers');
        });
        it(`object: { value: { "_in": [ object, object ] }}`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            object: { data: { value: { key: 'HelloBugFixersObject' }}},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "object": { "value": { "_in": [ { "key": "HelloBugFixersObject" }, { "key": "asdasd" }]}}}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          await deep.delete(id);
          assert.equal(value?.value?.key, 'HelloBugFixersObject');
        });
        it(`object: object`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          object: { data: { value: { key: 'HelloBugFixersTestObject123' }}},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "object": { "key": "HelloBugFixersTestObject123" }}'::jsonb, '{}'::jsonb)`);
        log('select result', result?.data?.result?.[1]?.[0]);
        const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        await deep.delete(id);
        assert.equal(value?.value?.key, 'HelloBugFixersTestObject123');
        });
        it(`object: { "_in": [object, object] }`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          object: { data: { value: { key: 'HelloBugFixersTestObject123' }}},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "object": { "_in": [{ "key": "HelloBugFixersTestObject123" }, { "key": "HelloBugFixersTestObject124" }] }}'::jsonb, '{}'::jsonb)`);
        log('select result', result?.data?.result?.[1]?.[0]);
        const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        await deep.delete(id);
        assert.equal(value?.value?.key, 'HelloBugFixersTestObject123');
        });
      });
      describe('value', () => {
        it(`value: { value: string }`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'HelloBugFixersValue2' }},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "value": { "value": "HelloBugFixersValue2" }}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 'HelloBugFixersValue2');
        });
        it(`value: string`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'HelloBugFixersValue2' }},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text,'{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "value": "HelloBugFixersValue2"}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 'HelloBugFixersValue2');
        });
        it(`value: { value: object }`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            object: { data: { value: { key: 'HelloBugFixersValue2' } }},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "value": { "value": { "key": "HelloBugFixersValue2" } }}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value?.key, 'HelloBugFixersValue2');
        });
        it(`value: object`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            object: { data: { value: { key: 'HelloBugFixersValue2' } }},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "value": { "key": "HelloBugFixersValue2" } }'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value?.key, 'HelloBugFixersValue2');
        });
        it(`value: { value: { _in: [ string, number, object ] } }}`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'HelloBugFixers' }},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "value": { "value": { "_in": ["HelloBugFixers", 1516, { "key": "HelloBugFixers"} ] }}}'::jsonb, '{}'::jsonb)`);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 'HelloBugFixers');
        });
        it(`value: {"_in":[ string, number, object ]} }`, async () => {
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'HelloBugFixers' }},
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: await deep.id('deep', 'admin')
            } }
          });
          console.log(11);
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select'::text, '{"type_id": ${await deep.id('@deep-foundation/core', 'Operation')}, "value": { "_in": ["HelloBugFixers", 1516, { "key": "HelloBugFixers"} ] }}'::jsonb, '{}'::jsonb)`);
          console.log(123);
          log('select result', result?.data?.result?.[1]?.[0]);
          const value = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.value;
          const selected = await deep.select(id);
          log('selected', selected?.data?.[0]);
          await deep.delete(id);
          assert.equal(value?.value, 'HelloBugFixers');
        });
      });
    });
    describe('update', () => {
      it(`update string`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          string: { data: { value: 'HelloBugFixers'}},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'update', '[{"link_id":${id}}, { "value": "HelloBugFixers2"}, { "table": "strings"}]'::jsonb, '{}'::jsonb)`);
        log('update result', result?.data?.result?.[1]?.[0]);
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        assert.equal('HelloBugFixers2', selected?.data?.[0]?.value?.value);
      });
      it(`update number`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          number: { data: { value: 1515 }},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'update', '[{"link_id":${id}}, { "value": 1516 }, { "table": "numbers"}]'::jsonb, '{}'::jsonb)`);
        log('update result', result?.data?.result?.[1]?.[0]);
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        assert.equal(1516, selected?.data?.[0]?.value?.value);
      });
      it(`update object value`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          object: { data: { value: { key: 'HelloBugFixers' } }},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'update', '[{"link_id":${id}}, { "value": { "key": "HelloBugFixers2"} }, { "table": "objects"}]'::jsonb, '{}'::jsonb)`);
        log('update result', result?.data?.result?.[1]?.[0]);
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        assert.equal('HelloBugFixers2', selected?.data?.[0]?.value?.value?.key);
      });
      it(`update object value by value`, async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: await deep.id('@deep-foundation/core', 'Operation'),
          object: { data: { value: { key: 'HelloBugFixers' } }},
          in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            from_id: await deep.id('deep', 'admin')
          } }
        });
        const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'update', '[{ "value": { "key": "HelloBugFixers"} }, { "value": { "key": "HelloBugFixers2"} }, { "table": "objects"}]'::jsonb, '{}'::jsonb)`);
        log('update result', result?.data?.result?.[1]?.[0]);
        const selected = await deep.select(id);
        log('selected', selected?.data?.[0]);
        assert.equal('HelloBugFixers2', selected?.data?.[0]?.value?.value?.key);
      });
    });
    describe('permissions', () => {
      describe('select', () => {
        it(`root can select from tree`, async () => {
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"link_id":1}'::jsonb, '{"table":"tree"}'::jsonb)`);
          const n1 = result?.data?.result?.[1];
          log('n1', JSON.parse(n1?.[0]).data);
          assert.equal(!!JSON.parse(n1?.[0]).data.length, true);
        });
        it(`root can select from can`, async () => {
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"subject_id":${await deep.id('deep', 'admin')}}'::jsonb, '{"table":"can"}'::jsonb)`);
          const n1 = result?.data?.result?.[1];
          log('n1', JSON.parse(n1?.[0]).data);
          assert.equal(!!JSON.parse(n1?.[0]).data.length, true);
        });
        it(`root can select from selectors`, async () => {
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"item_id":213}'::jsonb, '{"table":"selectors"}'::jsonb)`);
          const n1 = result?.data?.result?.[1];
          log('n1', JSON.parse(n1?.[0]).data);
          assert.equal(!!JSON.parse(n1?.[0]).data.length, true);
        });
        it(`nobody can select from not permitted tables`, async () => {
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"id":1}'::jsonb, '{"table":"strings"}'::jsonb)`);
          assert.equal(result.error, 'Bad Request');
        });
        it(`user contain range`, async () => {
          const a1 = await deep.guest({});
          log('a1', a1);
          const a2 = await deep.guest({});
          log('a2', a2);
          const { data: [{ id }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: a1.linkId,
            } }
          });
          log('id', id);

          const result1 = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'select', '{"id": ${id}}'::jsonb, '{}'::jsonb)`);
          const n1 = result1?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n1?.[0]).data, 1, `item_id ${id} must be selectable by ${a1.linkId}`);
          log(`${a1.linkId} n1`, n1);

          const result2 = await api.sql(sql`select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'select', '{"id": ${id}}'::jsonb, '{}'::jsonb)`);
          const n2 = result2?.data?.result?.[1];
          log(`${a2.linkId} n2`, n2);
          assert.lengthOf(JSON.parse(n2?.[0]).data, 0, `item_id ${id} must not be selectable by ${a2.linkId}`);
          
          const result3 = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"id": ${id}}'::jsonb, '{}'::jsonb)`);
          const n3 = result3?.data?.result?.[1];
          log(`${await deep.id('deep', 'admin')} n3`, n3);
          assert.lengthOf(JSON.parse(n3?.[0]).data, 1, `item_id ${id} must be selectable by admin`);

        });
        it(`rule select include 1 depth but exclude 2 depth`, async () => {
          const a1 = await deep.guest({});
          const a2 = await deep.guest({});
          const a3 = await deep.guest({});
          const { data: [{ id: id1 }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: a1.linkId,
            } }
          });
          const { data: [{ id: id2 }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            in: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Contain'),
              from_id: id1,
            } }
          });
          await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Rule'),
            out: { data: [
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: a2.linkId,
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: id1,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
                      to_id: id2,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
            ] },
          });
    
          const result1 = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'select', '{"id": ${id1}}'::jsonb, '{}'::jsonb)`);
          const n1 = result1?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n1?.[0]).data, 1);

          const result2 = await api.sql(sql`select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'select', '{"id": ${id1}}'::jsonb, '{}'::jsonb)`);
          const n2 = result2?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n2?.[0]).data, 1);
          const result3 = await api.sql(sql`select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'select', '{"id": ${id1}}'::jsonb, '{}'::jsonb)`);
          const n3 = result3?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n3?.[0]).data, 0);
    
          const result4 = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"id": ${id1}}'::jsonb, '{}'::jsonb)`);
          const n4 = result4?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n4?.[0]).data, 1);

          const result5 = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'select', '{"id": ${id2}}'::jsonb, '{}'::jsonb)`);
          const n5 = result5?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n5?.[0]).data, 1);
          const result6 = await api.sql(sql`select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'select', '{"id": ${id2}}'::jsonb, '{}'::jsonb)`);
          const n6 = result6?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n6?.[0]).data, 0);
          const result7 = await api.sql(sql`select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'select', '{"id": ${id2}}'::jsonb, '{}'::jsonb)`);
          const n7 = result7?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n7?.[0]).data, 0);
    
          const result8 = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'select', '{"id": ${id2}}'::jsonb, '{}'::jsonb)`);
          const n8 = result8?.data?.result?.[1];
          assert.lengthOf(JSON.parse(n8?.[0]).data, 1);
        });
      });
      describe('insert', () => {
        it(`root can insert`, async () => {
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'insert', '{"type_id":${await deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
          const customLinkId = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.id;
          log('customLinkId', customLinkId);
          const clientResult = await deep.select({id: {_eq: customLinkId}});
          log('clientResult', clientResult);
          if (customLinkId === clientResult?.data?.[0]?.id) await deep.delete({id: {_eq: customLinkId}});
          assert.equal(customLinkId, clientResult?.data?.[0]?.id);
        });
        it(`guest cant insert by default`, async () => {
          const a1 = await deep.guest({});
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'insert', '{"type_id":${await deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
          assert.isNotEmpty(result?.error);
        });
        it(`insert permission can be gived to guest`, async () => {
          const a1 = await deep.guest({});
          const a2 = await deep.guest({});
          const a3 = await deep.guest({});
          const ruleResult = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Rule'),
            out: { data: [
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a1.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a2.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
                      to_id: a3.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
            ] },
          });
          
          const r1 = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'insert', '{"type_id":${await deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
          const e1 = r1?.error;
          log('r1', r1?.data?.result?.[1]?.[0]);
          const da1 = JSON.parse(r1?.data?.result?.[1]?.[0])?.data; 
          log('a1.linkId', a1.linkId);
          log('da1', da1);
          if (e1) log('error', e1);
          expect(da1).to.not.be.undefined;
          assert.equal(!!e1, false);
          
          const r2 = await api.sql(sql`select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'insert', '{"type_id":${await deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
          const e2 = r2?.error;
          const da2 = JSON.parse(r2?.data?.result?.[1]?.[0])?.data;
          expect(da2).to.not.be.undefined;
          assert.equal(!!e2, false);

          const r3 = await api.sql(sql`select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'insert', '{"type_id":${await deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
          const e3 = r3?.error;
          const da3 = r3?.data?.result?.[1]?.[0] ? JSON.parse(r3?.data?.result?.[1]?.[0])?.data : undefined;
          log('da3', da3);
          expect(e3).to.not.be.undefined;
        });
        it(`insert permission with SelectorFilter`, async () => {
          const a1 = await deep.guest({});
          const a2 = await deep.guest({});
          const a3 = await deep.guest({});
          const { data: [{ id: TempType }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Type'),
            from_id: await deep.id('@deep-foundation/core', 'Any'),
            to_id: await deep.id('@deep-foundation/core', 'Any'),
          });
          await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Rule'),
            out: { data: [
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a1.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a2.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a3.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await deep.id('@deep-foundation/core'),
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
            ] },
          });
          await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Rule'),
            out: { data: [
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a1.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a2.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a3.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: TempType,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
                      to: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'Query'),
                        object: { data: { value: {
                          to_id: { _eq: 'X-Deep-User-Id' } ,// <== HERE
                        }, }, },
                      }, },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
            ] },
          });
    
          await delay(5000);

          const r1 = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'insert', '{"type_id":${await deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
          const e1 = r1?.error;
          const da1 = JSON.parse(r1?.data?.result?.[1]?.[0])?.data;

          expect(da1).to.not.be.undefined;
          assert.equal(!!e1, false);

          const r2 = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'insert', '{"type_id":${TempType}, "from_id": ${da1?.[0]?.id}, "to_id": ${a1.linkId}}'::jsonb, '{}'::jsonb)`);
          const e1t = r2?.error;
          const da1t = JSON.parse(r2?.data?.result?.[1]?.[0])?.data;
          expect(da1t).to.not.be.undefined;
          assert.equal(!!e1t, false);

          const r3 = await api.sql(sql`select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'insert', '{"type_id":${await deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
          const e2 = r3?.error;
          const da2 = JSON.parse(r3?.data?.result?.[1]?.[0])?.data;

          expect(da2).to.not.be.undefined;
          assert.equal(!!e1t, false);

          let r4;
          try {
            r4 = await api.sql(sql`select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'insert', '{"type_id":${TempType}, "from_id": ${da2?.[0]?.id}, "to_id": ${a1.linkId}}'::jsonb, '{}'::jsonb)`);
          } catch (e) {
            log(e);
          }
          const da2t = r4?.data?.result?.[1]?.[0] ? JSON.parse(r4?.data?.result?.[1]?.[0])?.data : undefined;
          const e2t = r4?.error;
          expect(da2t).to.be.undefined;
          expect(e2t).to.not.be.undefined;

          const r5 = await api.sql(sql`select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'insert', '{"type_id":${await deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
          const e3 = r5?.error;
          const da3 = JSON.parse(r5?.data?.result?.[1]?.[0])?.data;
          expect(da3).to.not.be.undefined;
          assert.equal(!!e3, false);

          const r6 = await api.sql(sql`select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'insert', '{"type_id":${TempType}, "from_id": ${da2?.[0]?.id}, "to_id": ${a3.linkId}}'::jsonb, '{}'::jsonb)`);
          const e4 = r6?.error;
          const da4 = JSON.parse(r6?.data?.result?.[1]?.[0])?.data;
          expect(da4).to.not.be.undefined;
          assert.equal(!!e4, false);
        });
      });
      describe('update', () => {
        describe('values', () => {
          it(`root can update value`, async () => {
            const { data: [{ id }], error } = await deep.insert({
              type_id: await deep.id('@deep-foundation/core', 'Operation'),
            });
            const n1 = await deep.select({ id });
            assert.lengthOf(n1?.data, 1);

            // no error, no update (nothing to update)
            await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'update', '[{"link_id":${id}}, { "value": "test2"}, { "table": "strings"}]'::jsonb, '{}'::jsonb)`);
            const clientResult = await deep.select({id: {_eq: id}});
            log('clientResult', clientResult);
            assert.equal(undefined, clientResult?.data?.[0]?.value?.value);

            const n2 = await deep.insert({link_id: id, value: 'test1'}, {table: 'strings'});
            log('n2', n2);
            const inserted = await deep.select({id: {_eq: id}});
            log('inserted', inserted);
            assert.equal('test1', inserted?.data?.[0]?.value?.value);

            await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'update', '[{"link_id":${id}}, { "value": "test2"}, { "table": "strings"}]'::jsonb, '{}'::jsonb)`);
            const clientResult2 = await deep.select({id: {_eq: id}});
            log('clientResult2', clientResult2);
            assert.equal('test2', clientResult2?.data?.[0]?.value?.value);
            
            await deep.delete({id: {_eq: id}});
          });
        });
      });
      describe('delete', () => {
        it(`root can delete`, async () => {
          const { data: [{ id }], error } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
          });
          const n1 = await deep.select({ id });
          assert.lengthOf(n1?.data, 1);

          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'delete', '{"id":${id}}'::jsonb, '{}'::jsonb)`);
          const customLinkId = JSON.parse(result?.data?.result?.[1]?.[0])?.data?.[0]?.id;
          log('customLinkId', customLinkId);
          const clientResult = await deep.select({id: {_eq: customLinkId}});
          log('clientResult', clientResult);
          if (clientResult?.data?.[0]?.id) deep.delete({id: {_eq: customLinkId}});
          assert.lengthOf(clientResult?.data, 0);
        });
        it(`nobody can delete from not permitted tables`, async () => {
          const { data: [{ id }], error } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
          });
          const n1 = await deep.select({ id });
          assert.lengthOf(n1?.data, 1);

          const result = await api.sql(sql`select links__sync__handlers__deep__client(${await deep.id('deep', 'admin')}::bigint, 'delete', '{"id":${id}}'::jsonb, '{"table":"selectors"}'::jsonb)`);
          log('result.error', JSON.stringify(result.error));
          assert.equal(result.error, 'Bad Request');
        });
        it(`guest cant delete by default`, async () => {
          const { data: [{ id }], error } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
          });
          const n1 = await deep.select({ id });
          assert.lengthOf(n1?.data, 1);

          const a1 = await deep.guest({});
          const result = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'delete', '{"id":${id}}'::jsonb, '{}'::jsonb)`);
          if (result?.data?.result?.[1]?.[0]) assert.lengthOf(JSON.parse(result?.data?.result?.[1]?.[0])?.data, 0);
          const n2 = await deep.select({ id });
          assert.lengthOf(n2?.data, 1);
        });
        it(`delete permission can be gived to guest`, async () => {
          const a1 = await deep.guest({});
          const a2 = await deep.guest({});
          const a3 = await deep.guest({});
          await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Rule'),
            out: { data: [
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a1.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a2.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
                      to_id: a3.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] },
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core', 'AllowDeleteType'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
            ] },
          });
          const { data: [{ id: id1 }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
          });
          const { data: [{ id: id2 }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
          });
          const { data: [{ id: id3 }] } = await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
          });

          const r1 = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'delete', '{"id":${id1}}'::jsonb, '{}'::jsonb)`);
          const r2 = await api.sql(sql`select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'delete', '{"id":${id2}}'::jsonb, '{}'::jsonb)`);
          const r3 = await api.sql(sql`select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'delete', '{"id":${id3}}'::jsonb, '{}'::jsonb)`);
          
          const da1 = JSON.parse(r1?.data?.result?.[1]?.[0])?.data; 
          expect(da1).to.not.be.undefined;
          const n1 = await deep.select({ id: id1 });
          assert.lengthOf(n1?.data, 0);

          const da2 = JSON.parse(r2?.data?.result?.[1]?.[0])?.data; 
          expect(da2).to.not.be.undefined;
          const n2 = await deep.select({ id: id2 });
          assert.lengthOf(n2?.data, 0);

          const da3 = r3?.data?.result?.[1]?.[0] ? JSON.parse(r3?.data?.result?.[1]?.[0])?.data : undefined;
          expect(da3).to.be.undefined;
          const n3 = await deep.select({ id: id3 });
          assert.lengthOf(n3?.data, 1);
          
          await deep.delete(id1);
          await deep.delete(id2);
          await deep.delete(id3);
        });
        it(`delete permission with SelectorFilter`, async () => {
          const a1 = await deep.guest({});
          const a2 = await deep.guest({});
          const a3 = await deep.guest({});
          await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Rule'),
            out: { data: [
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a1.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a2.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a3.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await deep.id('@deep-foundation/core', 'Operation'),
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
            ] },
          });
          await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Rule'),
            out: { data: [
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a1.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a2.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: a3.linkId,
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: [
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await deep.id('@deep-foundation/core', 'Operation'),
                      out: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: await deep.id('@deep-foundation/core', 'containTree'),
                      } },
                    },
                    {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
                      to: { data: {
                        type_id: await deep.id('@deep-foundation/core', 'Query'),
                        object: { data: { value: {
                          string: { value: { _eq: 'abc2' } },// <== HERE
                        }, }, },
                      }, },
                    },
                  ] }
                } }
              },
              {
                type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
                to: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'Selector'),
                  out: { data: {
                    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                    to_id: await deep.id('@deep-foundation/core', 'AllowDeleteType'),
                    out: { data: {
                      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                      to_id: await deep.id('@deep-foundation/core', 'containTree'),
                    } },
                  } }
                } }
              },
            ] },
          });
    
          await delay(5000);

          const d1 = new DeepClient({ deep, ...a1, silent: true });
          const { data: da1, error: e1 } = await d1.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'abc1' } },
          });
          assert.equal(!!e1, false);

          const r1 = await api.sql(sql`select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'delete', '{"id":${da1?.[0]?.id}}'::jsonb, '{}'::jsonb)`);
          const e1d = r1.error;
          expect(e1d).to.not.be.undefined;
          if (r1?.data?.result?.[1]?.[0]) assert.lengthOf(JSON.parse(r1?.data?.result?.[1]?.[0])?.data, 0);
          const n1 = await deep.select(da1?.[0]?.id);
          assert.lengthOf(n1?.data, 1);

          const d2 = new DeepClient({ deep, ...a2, silent: true });
          const { data: da2, error: e2 } = await d2.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'abc2' } },
          });
          assert.equal(!!e2, false);

          const r2 = await api.sql(sql`select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'delete', '{"id":${da2?.[0]?.id}}'::jsonb, '{}'::jsonb)`);
          const e2d = r2.error;
          assert.equal(!!e2d, false);
          if (r2?.data?.result?.[1]?.[0]) assert.lengthOf(JSON.parse(r2?.data?.result?.[1]?.[0])?.data, 1);
          const n2 = await deep.select(da2?.[0]?.id);
          assert.lengthOf(n2?.data, 0);

          const d3 = new DeepClient({ deep, ...a3, silent: true });
          const { data: da3, error: e3 } = await d3.insert({
            type_id: await deep.id('@deep-foundation/core', 'Operation'),
            string: { data: { value: 'abc3' } },
          });
          assert.equal(!!e3, false);

          const r3 = await api.sql(sql`select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'delete', '{"id":${da3?.[0]?.id}}'::jsonb, '{}'::jsonb)`);
          const e3d = r3.error;
          expect(e3d).to.not.be.undefined;
          if (r3?.data?.result?.[1]?.[0]) assert.lengthOf(JSON.parse(r3?.data?.result?.[1]?.[0])?.data, 0);
          const n3 = await deep.select(da3?.[0]?.id);
          assert.lengthOf(n3?.data, 1);
        });
      });
    });
  });

  describe('require package', () => {
    it(`require mathjs`, async () => {
      const debug = log.extend('HandleInsert');

      const typeId = await deep.id('@deep-foundation/core', 'Operation');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      
      const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
      const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
      const customLinkId = inserted?.data?.[0]?.id;
      debug('customLinkId', customLinkId);

      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `({deep, require, data}) => { const mathjs = require('mathjs'); if (mathjs.atan2(3, -3) / mathjs.pi == 0.75) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
        undefined,
        supportsId
      );
      debug('handler', handler);
      
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
    it(`require jsonschema`, async () => {
      const debug = log.extend('HandleInsert');

      const typeId = await deep.id('@deep-foundation/core', 'Operation');
      const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
      const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
      
      const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
      const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
      const customLinkId = inserted?.data?.[0]?.id;
      debug('customLinkId', customLinkId);

      const handler = await insertHandler(
        handleInsertTypeId,
        typeId, 
        `({deep, require, data}) => { var validate = require('jsonschema').validate; if (validate(4, {"type": "number"}).valid) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
        undefined,
        supportsId
      );
      debug('handler', handler);
      
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
  });
  describe('Handle operations', () => {
    describe('Handle insert', () => {
      it(`Handle insert on type`, async () => {
        const debug = log.extend('HandleInsert');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        
        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;
        debug('customLinkId', customLinkId);

        const handler = await insertHandler(
          handleInsertTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        
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
      it.skip(`Handle insert on type with sql injection (DAMAGES DATABASE SHOULD BE SKIPPED UNTIL FIXED)`, async () => {
        const debug = log.extend('HandleInsert');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        
        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;
        debug('customLinkId', customLinkId);

        const handler = await insertHandler(
          handleInsertTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: "${customLinkId}) RETURNING id; DROP TABLE promise_links; INSERT INTO links (type_id, from_id, to_id) VALUES (${customLinkId}, ${customLinkId}, ${customLinkId}) RETURNING id; -- ", from_id: ${customLinkId}}); }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        
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

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
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

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
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

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
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
          throw new Error('Not errored handler!')
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
        assert.equal(error, 'DeepClient Insert Error: testError');
      });
      it(`Handle insert on selector`, async () => {
        const debug = log.extend('HandleInsertSelect');

        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const selector = await insertSelector();
        debug('selector', selector);
        const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
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
      it(`Handle insert on type any`, async () => {
        const debug = log.extend('HandleInsert');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const anyTypeLinkId = await deep.id('@deep-foundation/core', 'Any');
        
        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const inserted2 = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;
        debug('customLinkId', customLinkId);
        const customLinkId2 = inserted2?.data?.[0]?.id;
        debug('customLinkId2', customLinkId2);

        const handler = await insertHandler(
          handleInsertTypeId,
          anyTypeLinkId, 
          `({deep, data}) => { 
            if (data?.newLink?.type_id !== ${customLinkId}) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}});
          }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        
        try {
          const linkId = (await deep.insert({ type_id: customLinkId2 }))?.data?.[0].id;
          debug('linkId', linkId);
          debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler?.data?.[0]?.id);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        await deep.delete(customLinkId);
        await deep.delete(customLinkId2);
        debug('delete handler', await deleteHandler(handler));
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      });
    });
    describe('Handle delete', () => {
      it(`Handle delete on type`, async () => {
        const debug = log.extend('HandleDelete');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
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

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
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

      it(`Handle delete on type any`, async () => {
        let linkIdsToDelete = [];
        const handleDeleteTypeLinkId = await deep.id('@deep-foundation/core', 'HandleDelete');
        const supportsLinkId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const typeTypeLinkId = await deep.id("@deep-foundation/core", "Type");
        const anyTypeLinkId = await deep.id('@deep-foundation/core', 'Any');
        const errorMessage = "Success! Handler is called";
        const expectedErrorMessage = `DeepClient Delete Error: ${errorMessage}`;
        let actualErrorMessage: string;
        const handler = await insertHandler(
          handleDeleteTypeLinkId,
          anyTypeLinkId,
          `() => {
            throw new Error("${errorMessage}");
          }`,
          undefined,
          supportsLinkId);
          try {
            const {data: [newLink]} = await deep.insert({
              type_id: typeTypeLinkId
            });
            linkIdsToDelete.push(newLink.id)
            await deep.delete(newLink.id);
          } catch (error) {
            actualErrorMessage = error.message;
          } finally {
            await deleteHandler(handler);
            await deep.delete(linkIdsToDelete)
            console.log({actualErrorMessage, expectedErrorMessage})
            assert.strictEqual(actualErrorMessage, expectedErrorMessage)
          }
      })
    });
    describe('Handle update', () => {
      it(`Handle update on type`, async () => {
        const debug = log.extend('HandleUpdate');

        const typeId = await deep.id('@deep-foundation/core', 'Type');
        const anyId = await deep.id('@deep-foundation/core', 'Any');
        const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
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

        const linkId = (await deep.insert({ type_id: typeId, from_id: typeId, to_id: typeId }))?.data?.[0].id;
        
        try {
          const updated = await deep.update(linkId, { to_id: anyId });
          console.log('updated', updated);
        } catch (e){
          debug('update error: ', e);
        }
        
        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler);

        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        debug('delete handler', await deleteHandler(handler));
        await deep.delete(customLinkId);
        await deep.delete(linkId);
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
      });
      it(`Handle update on selector`, async () => {
        const debug = log.extend('HandleUpdateSelect');

        const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const selector = await insertSelector();
        debug('selector', selector);
        const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleUpdateTypeId,
          selectorId,
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
          undefined,
          supportsId);

        const { data: [{ id: newToId }] } = await deep.insert({ type_id: nodeTypeId });
        const selectorItem = await insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });

        debug('handler', handler);
        try {
          const updated = await deep.update(selectorItem.linkId, { to_id: newToId });
          debug('updated', updated);
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

      it(`Handle update on type any`, async () => {
        let linkIdsToUpdate = [];
        const handleUpdateTypeLinkId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsLinkId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const typeTypeLinkId = await deep.id("@deep-foundation/core", "Type");
        const anyTypeLinkId = await deep.id('@deep-foundation/core', 'Any');
        const errorMessage = "Success! Handler is called";
        const expectedErrorMessage = `DeepClient Update Error: ${errorMessage}`;
        let actualErrorMessage: string;
        const handler = await insertHandler(
          handleUpdateTypeLinkId,
          anyTypeLinkId,
          `() => {
            throw new Error("${errorMessage}");
          }`,
          undefined,
          supportsLinkId);
          try {
            const {data: [newLink]} = await deep.insert({
              type_id: typeTypeLinkId,
              from_id: anyTypeLinkId,
              to_id: anyTypeLinkId,
            });
            linkIdsToUpdate.push(newLink.id);
            await deep.update(newLink.id, {
              to_id: typeTypeLinkId,
            });
          } catch (error) {
            actualErrorMessage = error.message;
          } finally {
            await deleteHandler(handler);
            await deep.delete(linkIdsToUpdate)
            debug({actualErrorMessage, expectedErrorMessage})
            assert.strictEqual(actualErrorMessage, expectedErrorMessage)
          }
      })
    });
    describe('Handle value', () => {
      describe('Handle strings', () => {
        it('Handle insert string', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, string: { data: { value: 'helloBugFixers' } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
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
        it('Handle update string', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, string: { data: { value: 'helloBugFixers' } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            const notInsertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
            const updated = await deep.update({ link_id: linkId }, { value: 'helloBugFixers!' }, { table: 'strings' });
            const updatedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
            debug('notInsertedByHandler', notInsertedByHandler?.data);
            debug('updated', updated?.data);
            debug('updatedLink', updatedLink?.data);
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
        it('Handle delete string', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, string: { data: { value: 'helloBugFixers' } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            const notInsertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
            const deleted = await deep.delete({ link_id: linkId }, { table: 'strings' });
            const deletedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
            debug('notInsertedByHandler', notInsertedByHandler?.data);
            debug('deleted', deleted?.data);
            debug('deletedLink', deletedLink?.data);
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
      });
      describe('Handle numbers', () => {
        it('Handle insert number', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, number: { data: { value: 1 } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
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
        it('Handle update number', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, number: { data: { value: 1 } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            const notInsertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
            const updated = await deep.update({ link_id: linkId }, { value: 2 }, { table: 'numbers' });
            const updatedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
            debug('notInsertedByHandler', notInsertedByHandler?.data);
            debug('updated', updated?.data);
            debug('updatedLink', updatedLink?.data);
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
        it('Handle delete number', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, number: { data: { value: 1 } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            const notInsertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
            const deleted = await deep.delete({ link_id: linkId }, { table: 'numbers' });
            const deletedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
            debug('notInsertedByHandler', notInsertedByHandler?.data);
            debug('deleted', deleted?.data);
            debug('deletedLink', deletedLink?.data);
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
      });
      describe('Handle objects', () => {
        it('Handle insert object', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, object: { data: { value: { a: 'helloBugFixers' } } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
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
        it('Handle update object', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, object: { data: { value: { a: 'helloBugFixers' } } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            const notInsertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
            const updated = await deep.update({ link_id: linkId }, { value: { b: 'helloBugFixers' } }, { table: 'objects' });
            const updatedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
            debug('notInsertedByHandler', notInsertedByHandler?.data);
            debug('updated', updated?.data);
            debug('updatedLink', updatedLink?.data);
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
        it('Handle delete object', async () => {
          const debug = log.extend('HandleInsertString');
  
          const typeId = await deep.id('@deep-foundation/core', 'Operation');
          const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
          const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
          
          const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
          const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
          const customLinkId = inserted?.data?.[0]?.id;
          debug('customLinkId', customLinkId);
  
          const handler = await insertHandler(
            handleUpdateId,
            typeId, 
            `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`,
            undefined,
            supportsId
          );
          debug('handler', handler);
          
          try {
            const linkId = (await deep.insert({ type_id: typeId, object: { data: { value: { a: 'helloBugFixers' } } } } ))?.data?.[0].id;
            const insertedLink = await deep.select(linkId);
            const notInsertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
            const deleted = await deep.delete({ link_id: linkId }, { table: 'objects' });
            const deletedLink = await deep.select(linkId);
            debug('linkId', linkId);
            debug('insertedLink', insertedLink?.data);
            debug('notInsertedByHandler', notInsertedByHandler?.data);
            debug('deleted', deleted?.data);
            debug('deletedLink', deletedLink?.data);
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
      });
      it(`Handle update on type any`, async () => {
        let linkIdsToDelete = [];
        const handleUpdateTypeLinkId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsLinkId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        const typeTypeLinkId = await deep.id("@deep-foundation/core", "Type");
        const anyTypeLinkId = await deep.id('@deep-foundation/core', 'Any');
        const errorMessage = "Success! Handler is called";
        const expectedErrorMessage = "DeepClient Insert Error: Success! Handler is called";
        let actualErrorMessage: string;
        const handler = await insertHandler(
          handleUpdateTypeLinkId,
          anyTypeLinkId,
          `() => {
            throw new Error("${errorMessage}");
          }`,
          undefined,
          supportsLinkId);
          try {
            const {data: [newLink]} = await deep.insert({
              type_id: typeTypeLinkId
            });
            linkIdsToDelete.push(newLink.id);
            await deep.insert(
              {
                link_id: newLink.id, value: "newValue" 
              },
              {
                table: `strings`
              }
            );
          } catch (error) {
            actualErrorMessage = error.message;
          } finally {
            await deleteHandler(handler);
            await deep.delete(linkIdsToDelete)
            assert.strictEqual(actualErrorMessage, expectedErrorMessage)
          }
      });
    });
    describe('Handle IUD for values', () => {
      it('Handle IUD for strings', async () => {
        const debug = log.extend('HandleIUDStrings');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        
        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const typeToHandle = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const typeToInsertInHandler = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const typeIdToInsertInHandler = typeToInsertInHandler?.data?.[0]?.id;
        const typeIdToHandle = typeToHandle?.data?.[0]?.id;
        debug('typeIdToHandle', typeIdToHandle);

        const onInsertHandler = await insertHandler(
          handleInsertId,
          typeIdToHandle,
          `({deep, data}) => { 
            const inserted = deep.insert({type_id: ${typeIdToInsertInHandler}, to_id: ${typeIdToInsertInHandler}, from_id: ${typeIdToInsertInHandler}, string: 'HelloBugFixers'});
            deep.update({link_id: inserted.data[0].id}, { value: 'GoodbyeBugFixers'}, { table: 'strings' });
          }`.trim(),
          undefined,
          supportsId
        );
        debug('onInsertHandler', onInsertHandler);

        try {
          const linkId = (await deep.insert({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle } ))?.data?.[0].id;
          debug('linkId', linkId);
          const insertedLink = await deep.select(linkId);
          debug('insertedLink', insertedLink?.data);
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ type_id: { _eq: typeIdToInsertInHandler }, to_id: { _eq: typeIdToInsertInHandler }, from_id: { _eq: typeIdToInsertInHandler } });
        const insertedByHandlerId = insertedByHandler.data[0].id;
        debug('insertedByHandler', insertedByHandler?.data);
        const value = insertedByHandler?.data?.[0]?.value;
        assert.equal(value?.value, 'GoodbyeBugFixers');
        debug('delete insert handler', await deleteHandler(onInsertHandler));

        const onUpdateHandler = await insertHandler(
          handleUpdateId,
          typeIdToHandle,
          `({deep, data}) => { 
            deep.delete({link_id: ${insertedByHandlerId}}, { table: 'strings' });
          }`.trim(),
          undefined,
          supportsId
        );
        debug('onUpdateHandler', onUpdateHandler);

        try {
          const linkId = (await deep.select({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle }))?.data?.[0].id;
          await deep.update({ link_id: linkId }, { value: 'TERMINATING'}, { table: 'strings' } );
          debug('linkId', linkId);

          const linkWithoutValue = await deep.select({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle });
          const value = linkWithoutValue?.data?.[0]?.value;
          debug('value', value);
          assert.equal(value?.value, undefined);

          const deletedLink = await deep.select(linkId);
          debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));

        } catch (e){
          debug('insert error: ', e);
        }

        debug('delete update handler', await deleteHandler(onUpdateHandler));
      });
      it('Handle IUD for numbers', async () => {
        const debug = log.extend('HandleIUDStrings');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        
        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const typeToHandle = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const typeToInsertInHandler = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const typeIdToInsertInHandler = typeToInsertInHandler?.data?.[0]?.id;
        const typeIdToHandle = typeToHandle?.data?.[0]?.id;
        debug('typeIdToHandle', typeIdToHandle);

        const onInsertHandler = await insertHandler(
          handleInsertId,
          typeIdToHandle,
          `({deep, data}) => { 
            const inserted = deep.insert({type_id: ${typeIdToInsertInHandler}, to_id: ${typeIdToInsertInHandler}, from_id: ${typeIdToInsertInHandler}, number: 1});
            deep.update({link_id: inserted.data[0].id}, { value: 2 }, { table: 'numbers' });
          }`.trim(),
          undefined,
          supportsId
        );
        debug('onInsertHandler', onInsertHandler);

        try {
          const linkId = (await deep.insert({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle } ))?.data?.[0].id;
          debug('linkId', linkId);
          const insertedLink = await deep.select(linkId);
          debug('insertedLink', insertedLink?.data);
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ type_id: { _eq: typeIdToInsertInHandler }, to_id: { _eq: typeIdToInsertInHandler }, from_id: { _eq: typeIdToInsertInHandler } });
        const insertedByHandlerId = insertedByHandler.data[0].id;
        debug('insertedByHandler', insertedByHandler?.data);
        const value = insertedByHandler?.data?.[0]?.value;
        assert.equal(value?.value, 2);
        debug('delete insert handler', await deleteHandler(onInsertHandler));

        const onUpdateHandler = await insertHandler(
          handleUpdateId,
          typeIdToHandle,
          `({deep, data}) => { 
            deep.delete({link_id: ${insertedByHandlerId}}, { table: 'numbers' });
          }`.trim(),
          undefined,
          supportsId
        );
        debug('onUpdateHandler', onUpdateHandler);

        try {
          const linkId = (await deep.select({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle }))?.data?.[0].id;
          await deep.update({ link_id: linkId }, { value: 3}, { table: 'numbers' } );
          debug('linkId', linkId);

          const linkWithoutValue = await deep.select({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle });
          const value = linkWithoutValue?.data?.[0]?.value;
          debug('value', value);
          assert.equal(value?.value, undefined);

          const deletedLink = await deep.select(linkId);
          debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));

        } catch (e){
          debug('insert error: ', e);
        }

        debug('delete update handler', await deleteHandler(onUpdateHandler));
      });
      it('Handle IUD for object', async () => {
        const debug = log.extend('HandleIUDStrings');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const handleUpdateId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');
        
        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const typeToHandle = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const typeToInsertInHandler = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const typeIdToInsertInHandler = typeToInsertInHandler?.data?.[0]?.id;
        const typeIdToHandle = typeToHandle?.data?.[0]?.id;
        debug('typeIdToHandle', typeIdToHandle);

        const onInsertHandler = await insertHandler(
          handleInsertId,
          typeIdToHandle,
          `({deep, data}) => { 
            const inserted = deep.insert({
              type_id: ${typeIdToInsertInHandler},
              to_id: ${typeIdToInsertInHandler},
              from_id: ${typeIdToInsertInHandler},
              object: { string: 'HelloBugFixers' }
            });
          }`.trim(),
          undefined,
          supportsId
        );
        debug('onInsertHandler', onInsertHandler);

        try {
          const linkId = (await deep.insert({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle } ))?.data?.[0].id;
          debug('linkId', linkId);
          const insertedLink = await deep.select(linkId);
          debug('insertedLink', insertedLink?.data);
        } catch (e){
          debug('insert error: ', e);
        }

        const insertedByHandler = await deep.select({ type_id: { _eq: typeIdToInsertInHandler }, to_id: { _eq: typeIdToInsertInHandler }, from_id: { _eq: typeIdToInsertInHandler } });
        const insertedByHandlerId = insertedByHandler.data[0].id;
        debug('insertedByHandler', insertedByHandler?.data);
        const value = insertedByHandler?.data?.[0]?.value;
        assert.equal(value?.value?.string, 'HelloBugFixers');
        debug('delete insert handler', await deleteHandler(onInsertHandler));

        const onUpdateHandler = await insertHandler(
          handleUpdateId,
          typeIdToHandle,
          `({deep, data}) => { 
            deep.delete({link_id: ${insertedByHandlerId}}, { table: 'objects' });
          }`.trim(),
          undefined,
          supportsId
        );
        debug('onUpdateHandler', onUpdateHandler);

        try {
          const linkId = (await deep.select({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle }))?.data?.[0].id;
          await deep.update({ link_id: linkId }, { value: { string: 'TERMINATING' }}, { table: 'objects' } );
          debug('linkId', linkId);

          const linkWithoutValue = await deep.select({ type_id: typeIdToHandle, to_id: typeIdToHandle, from_id: typeIdToHandle });
          const value = linkWithoutValue?.data?.[0]?.value;
          debug('value', value);
          assert.equal(value?.value, undefined);

          const deletedLink = await deep.select(linkId);
          debug('delete linkid', await deep.delete({ id: { _eq: linkId } }));

        } catch (e){
          debug('insert error: ', e);
        }

        debug('delete update handler', await deleteHandler(onUpdateHandler));
      });
    });
    describe('Check data for not bigint', () => {
      it(`Check in delete link`, async () => {
        const debug = log.extend('HandleDelete');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;

        const handler = await insertHandler(
          handleDeleteTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}, object: data }) }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        debug('customLinkId', customLinkId);

        const linkId = (await deep.insert({ type_id: typeId, string: 'helloBugFixers' }))?.data?.[0].id;
        
        try {
          const deleted = await deep.delete(linkId);
          debug('deleted', deleted);
        } catch (e){
          debug('insert error: ', e);
        }
        
        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        debug('insertedByHandler', insertedByHandler?.data?.[0]);
        debug('insertHandler data', insertedByHandler?.data?.[0]?.value?.value);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(customLinkId);
        debug('delete handler', await deleteHandler(handler));
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
        assert.equal(insertedByHandler?.data?.[0]?.value?.value?.oldLink?.value?.value, 'helloBugFixers');
      });
      it(`Check in update link`, async () => {
        const debug = log.extend('HandleInsert');

        const typeId = await deep.id('@deep-foundation/core', 'Operation');
        const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
        const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        const supportsId = await deep.id('@deep-foundation/core', 'plv8SupportsJs');

        const anyTypeId = await deep.id('@deep-foundation/core', 'Any');
        const inserted = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId = inserted?.data?.[0]?.id;
        const inserted2 = await deep.insert({type_id: 1, from_id: anyTypeId, to_id: anyTypeId});
        const customLinkId2 = inserted2?.data?.[0]?.id;

        const handler = await insertHandler(
          handleInsertTypeId,
          typeId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}, object: data }) }`,
          undefined,
          supportsId
        );
        debug('handler', handler);
        debug('customLinkId', customLinkId);

        const handlerUpdate = await insertHandler(
          handleUpdateTypeId,
          customLinkId, 
          `({deep, data}) => { deep.insert({type_id: ${customLinkId2}, to_id: ${customLinkId2}, from_id: ${customLinkId2}, object: data }) }`,
          undefined,
          supportsId
        );

        let linkId;
        try {
          linkId = (await deep.insert({ type_id: typeId, string: { data: { value: 'azaza' }} }))?.data?.[0].id;
          const deleted = await deep.delete(linkId);
          debug('deleted', deleted);
        } catch (e){
          debug('insert error: ', e);
        }
        
        const insertedByHandler = await deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
        const insertedByHandler2 = await deep.select({ type_id: { _eq: customLinkId2 }, to_id: { _eq: customLinkId2 }, from_id: { _eq: customLinkId2 } });
        debug('insertedByHandler1', insertedByHandler?.data?.[0]?.value?.value);
        debug('insertedByHandler2', insertedByHandler2?.data?.[0]?.value?.value);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(insertedByHandler?.data?.[0]?.id);
        if (insertedByHandler2?.data?.[0]?.id) await deep.delete(insertedByHandler2?.data?.[0]?.id);
        if (insertedByHandler?.data?.[0]?.id) await deep.delete(customLinkId);
        if (insertedByHandler2?.data?.[0]?.id) await deep.delete(customLinkId2);
        debug('delete handler', await deleteHandler(handler));
        debug('delete handler', await deleteHandler(handlerUpdate));
        assert.equal(!!insertedByHandler?.data?.[0]?.id, true);
        assert.equal(!!insertedByHandler2?.data?.[0]?.id, true);
        assert.equal(!!insertedByHandler?.data?.[0]?.value, true);
        assert.equal(!!insertedByHandler2?.data?.[0]?.value, true);
      });
    });
  });
});