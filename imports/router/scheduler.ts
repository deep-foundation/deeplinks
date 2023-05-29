import Debug from 'debug';

import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { HasuraApi } from '@deep-foundation/hasura/api.js';
// import { sql } from '@deep-foundation/hasura/sql.js';
import { gql } from '@apollo/client/index.js';
import vm from 'vm';

import { permissions } from '../permission.js';
import { findPromiseLink, reject, resolve } from '../promise.js';
import { DeepClient } from '../client.js';
import { ALLOWED_IDS, DENIED_IDS } from '../global-ids.js';
import axios from 'axios';
import crypto from 'crypto';
import { 
  handleOperation,
} from './links.js';
import { boolExpToSQL } from '../bool_exp_to_sql.js';
import { useRunner, processPromises } from './links.js';

const SCHEMA = 'public';

const debug = Debug('deeplinks:eh:scheduler');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

export const api = new HasuraApi({
  path: process.env.DEEPLINKS_HASURA_PATH,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const client = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export const insertPromise = async (scheduleId: number) => {
  const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
  const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
  const promise = (await deep.insert({ 
    type_id: promiseTypeId,
  }, { name: 'IMPORT_HANDLER_JS_FILE' })).data[0];
  const then = (await deep.insert({
    from_id: scheduleId,
    type_id: thenTypeId,
    to_id: promise?.id,
  }, { name: 'IMPORT_HANDLER' })).data[0];
  return {
    id: promise?.id,
    thenId: then?.id,
  };
};

export async function handleScheduleMomemt(moment: any) {
  const scheduleId: number = moment.payload.scheduleId;
  // log('currentLinkId', currentLinkId);
  // log('currentTypeId', currentTypeId);

  const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
  const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');

  const promise = await findPromiseLink({
    id: scheduleId, client: deep.apolloClient,
    Then: await deep.id('@deep-foundation/core', 'Then'),
    Promise: await deep.id('@deep-foundation/core', 'Promise'),
    Resolved: resolvedTypeId,
    Rejected: rejectedTypeId,
    Results: false,
  });
  log('promise: ', promise);
  if (promise)
  {
    const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
    const handleOperationTypeId = await deep.id('@deep-foundation/core', 'HandleSchedule');
  
    // log('handlerTypeId', handlerTypeId);
    // log('handleInsertTypeId', handleInsertTypeId);
  
    const queryString = `query SELECT_CODE($scheduleId: bigint) { links(where: {
            type_id: { _eq: ${await deep.id('@deep-foundation/core', 'SyncTextFile')} },
            in: {
              from_id: { _eq: ${await deep.id('@deep-foundation/core', 'dockerSupportsJs')} },
              type_id: { _eq: ${handlerTypeId} },
              in: {
                from_id: { _eq: $scheduleId },
                type_id: { _eq: ${handleOperationTypeId} },
              }
            }
          }) {
            id
            value
            in(where: { type_id: { _eq: ${handlerTypeId} } }) {
              id
              in(where: { type_id: { _eq: ${handleOperationTypeId} } }) {
                id
              }
              support: from {
                id
                isolation: from {
                  id
                  image: value
                }
              }
            }
          } }`;
    // log('queryString', queryString);
  
    const query = gql`${queryString}`;
    // log('query', query);
  
    const variables = {
      scheduleId
    };
    // log('variables', JSON.stringify(variables));
  
    const handlersResult = await client.query({ query, variables });
  
    const promises: any[] = [];
    const handleOperationsIds: any[] = [];

    const handlersWithCode = handlersResult?.data?.links as any[];
    log('handlersWithCode.length', handlersWithCode?.length);
    if (handlersWithCode?.length > 0) {
      // log(queryString);
      // log(query);
      // log(JSON.stringify(query, null, 2));
      log("handlersWithCode: ", JSON.stringify(handlersWithCode, null, 2));
      log(handlersWithCode?.length);

      // log(handleStringResult);
      // log(JSON.stringify(handleStringResult, null, 2));
      // log(handleStringResult?.data?.links?.[0]?.value);
      for (const handlerWithCode of handlersWithCode) {
        const code = handlerWithCode?.value?.value;
        const isolationProviderImageName = handlerWithCode?.in?.[0]?.support?.isolation?.image?.value;
        const handlerId = handlerWithCode?.in?.[0]?.id;
        const handleOperationId = handlerWithCode?.in?.[0]?.in?.[0].id;
        if (code && isolationProviderImageName && handlerId && handleOperationId) {
          try {
            promises.push(() => useRunner({ code, handlerId, isolationProviderImageName, data: { moment, promiseId: promise.id } }));
            handleOperationsIds.push(handleOperationId);
          } catch (e) {
            error('error', e);
          }
        } else {
          promises.push(async () => Promise.reject(new Error('Code of a handler is not loaded.')));
          handleOperationsIds.push(handleOperationId);
        }
      }

      const promiseResultTypeId = await deep.id('@deep-foundation/core', 'PromiseResult');
      const promiseReasonTypeId = await deep.id('@deep-foundation/core', 'PromiseReason');

      await insertPromise(scheduleId);

      await processPromises(promises, handleOperationsIds, promise.id, promiseResultTypeId, promiseReasonTypeId, resolvedTypeId, rejectedTypeId, log);
    }
  }
}

export default async (req, res) => {
  try {
    // event {
    //   scheduled_time: '2022-01-30T08:35:00Z',
    //   payload: { schedule: '* * * * *', handleScheduleLinkId: 236, scheduleId: 235 },
    //   name: 'handle_schedule_236',
    //   id: '4d8593eb-e414-4341-894e-aa97e8df07e0',
    //   comment: 'Event trigger for handle schedule link 236 with cron schedule definition * * * * * of 235 schedule.'
    // }
    const event = req?.body;
    const operation = event?.op;

    log(`event`, event);

    try {
      // await handleOperation('Update', oldRow, newRow);
      await handleScheduleMomemt(event);
      
      // log("done");

      // if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
      //   log('resolve', current.id);
      //   await resolve({
      //     id: current.id, client,
      //     Then: await deep.id('@deep-foundation/core', 'Then'),
      //     Promise: await deep.id('@deep-foundation/core', 'Promise'),
      //     Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
      //     Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
      //   });
      // }
      return res.status(200).json({});
    } catch(e) {
      error('error', e);
      throw e;
      // if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
      //   log('reject', current.id);
      //   await reject({
      //     id: current.id, client,
      //     Then: await deep.id('@deep-foundation/core', 'Then'),
      //     Promise: await deep.id('@deep-foundation/core', 'Promise'),
      //     Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
      //     Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
      //   });
      // }
    }

    return res.status(500).json({ error: 'notexplained' });
  } catch(e) {
    return res.status(500).json({ error: e.toString() });
  }
};