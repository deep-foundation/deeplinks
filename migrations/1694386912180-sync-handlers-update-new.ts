import { createPrepareFunction, createDeepClientFunction, createSyncInsertTriggerFunction, createSyncDeleteTriggerFunction, createSyncUpdateTriggerFunction, createSyncDeleteStringsTriggerFunction, createSyncInsertStringsTriggerFunction,  createSyncUpdateStringsTriggerFunction, createSyncDeleteNumbersTriggerFunction, createSyncInsertNumbersTriggerFunction, createSyncUpdateNumbersTriggerFunction, createSyncDeleteObjectsTriggerFunction, createSyncInsertObjectsTriggerFunction, createSyncUpdateObjectsTriggerFunction } from "./1655979260869-sync-handlers.js";
import Debug from 'debug';
import { api } from './1616701513782-links.js';
import { sql } from '@deep-foundation/hasura/sql.js';

const debug = Debug('deeplinks:migrations:plv8');
const log = debug.extend('log');


export const up = async () => {
  log('up');

  await api.sql(createPrepareFunction);
  await api.sql(createDeepClientFunction);
  await api.sql(createSyncInsertTriggerFunction);
  await api.sql(createSyncUpdateTriggerFunction);
  await api.sql(createSyncDeleteTriggerFunction);
  await api.sql(createSyncInsertStringsTriggerFunction);
  await api.sql(createSyncUpdateStringsTriggerFunction);
  await api.sql(createSyncDeleteStringsTriggerFunction);
  await api.sql(createSyncInsertNumbersTriggerFunction);
  await api.sql(createSyncUpdateNumbersTriggerFunction);
  await api.sql(createSyncDeleteNumbersTriggerFunction);
  await api.sql(createSyncInsertObjectsTriggerFunction);
  await api.sql(createSyncUpdateObjectsTriggerFunction);
  await api.sql(createSyncDeleteObjectsTriggerFunction);
};

export const down = async () => {
  log('down');
};
