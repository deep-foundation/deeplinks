import Debug from 'debug';

import { generateApolloClient } from '@deep-foundation/hasura/client';
import { HasuraApi } from "@deep-foundation/hasura/api";
// import { sql } from '@deep-foundation/hasura/sql';
import { gql } from 'apollo-boost';
import vm from 'vm';

import { permissions } from '../permission';
import { findPromiseLink, reject, resolve } from '../promise';
import { DeepClient } from '../client';
import { ALLOWED_IDS, DENIED_IDS } from '../global-ids';
import { execSync } from 'child_process';
import axios from 'axios';
import crypto from 'crypto';
import { 
  handleOperation,
} from './links';
import { boolExpToSQL } from '../bool_exp_to_sql';
import { makePromiseResult, useRunner } from './links';

const SCHEMA = 'public';

const debug = Debug('deeplinks:eh:scheduler');

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
  // console.log('currentLinkId', currentLinkId);
  // console.log('currentTypeId', currentTypeId);

  const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
  const handleOperationTypeId = await deep.id('@deep-foundation/core', 'HandleSchedule');

  // console.log('handlerTypeId', handlerTypeId);
  // console.log('handleInsertTypeId', handleInsertTypeId);

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
              support: from {
                id
                isolation: from {
                  id
                  value
                }
              }
            }
          }
        } }`;

        // #{
        //   #  from: {
        //   #    type_id: { _eq: ${await deep.id('@deep-foundation/core', 'Selector')} },
        //   #    out: {
        //   #      type_id: { _eq: ${await deep.id('@deep-foundation/core', 'Include')} },
        //   #      to_id: { _eq: $linkId },
        //   #    }
        //   #  }
        //   #}
  // console.log('queryString', queryString);

  const query = gql`${queryString}`;
  // console.log('query', query);

  const variables = {
    scheduleId
  };
  // console.log('variables', JSON.stringify(variables));

  const handlersResult = await client.query({ query, variables });

  const promises: any[] = [];
  const handleInsertsIds: any[] = [];

  const handlersWithCode = handlersResult?.data?.links as any[];
  console.log('handlersWithCode.length', handlersWithCode?.length);
  if (handlersWithCode?.length > 0) {
    // console.log(queryString);
    // console.log(query);
    // console.log(JSON.stringify(query, null, 2));
    console.log("handlersWithCode: ", JSON.stringify(handlersWithCode, null, 2));
    console.log(handlersWithCode?.length);

    // console.log(handleStringResult);
    // console.log(JSON.stringify(handleStringResult, null, 2));
    // console.log(handleStringResult?.data?.links?.[0]?.value);
    for (const handlerWithCode of handlersWithCode) {
      const code = handlerWithCode?.value?.value;
      const isolationValue = handlerWithCode?.in?.[0]?.support?.isolation?.value?.value;
      const handleInsertId = handlerWithCode?.in?.[0]?.in?.[0].id;
      if (code) {
        try {
          promises.push(() => useRunner({ code, handler: isolationValue, moment }));
          handleInsertsIds.push(handleInsertId);
        } catch (error) {
          debug('error', error);
        }
      }
    }

    const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
    const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
    const promiseResultTypeId = await deep.id('@deep-foundation/core', 'PromiseResult');
    const promiseReasonTypeId = await deep.id('@deep-foundation/core', 'PromiseReason');

    const promise = await findPromiseLink({
      id: scheduleId, client: deep.apolloClient,
      Then: await deep.id('@deep-foundation/core', 'Then'),
      Promise: await deep.id('@deep-foundation/core', 'Promise'),
      Resolved: resolvedTypeId,
      Rejected: rejectedTypeId,
      Results: false,
    });
    // const promise = 
    await insertPromise(scheduleId);
    console.log('promise: ', promise);
    if (promise) {
      console.log("promises.length: ", promises.length);

      // Promise.allSettled([...promises, Promise.reject(new Error('an error'))])
      // Promise.allSettled(promises)
      await Promise.allSettled(promises.map((p) => p() as Promise<any>))
        .then(async (values) => {
          console.log("values: ", values);
          const promiseResults = [];
          for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const handleInsertId = handleInsertsIds[i];
            if (value.status == 'fulfilled') {
              const result = value.value;
              console.log("result: ", result);
              const promiseResult = makePromiseResult(promise, resolvedTypeId, promiseResultTypeId, result, promiseReasonTypeId, handleInsertId);
              promiseResults.push(promiseResult);
            }
            if (value.status == 'rejected') {
              const error = value.reason;
              console.log("error: ", error);
              const promiseResult = makePromiseResult(promise, rejectedTypeId, promiseResultTypeId, error, promiseReasonTypeId, handleInsertId);
              promiseResults.push(promiseResult);
            }
          }
          console.log("promiseResults: ", JSON.stringify(promiseResults, null, 2));
          try
          {
            await deep.insert(promiseResults, { name: 'IMPORT_PROMISES_RESULTS' });
            console.log("promiseResults are inserted");
          }
          catch(e)
          {
            console.log('promiseResults insert error: ', e?.message ?? e);
          }
        });
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

    console.log(`event`, event);

    try {
      // await handleOperation('Update', oldRow, newRow);
      await handleScheduleMomemt(event);
      
      // console.log("done");

      // if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
      //   debug('resolve', current.id);
      //   await resolve({
      //     id: current.id, client,
      //     Then: await deep.id('@deep-foundation/core', 'Then'),
      //     Promise: await deep.id('@deep-foundation/core', 'Promise'),
      //     Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
      //     Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
      //   });
      // }
      return res.status(200).json({});
    } catch(error) {
      debug('error', error);
      throw error;
      // if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
      //   debug('reject', current.id);
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
  } catch(error) {
    return res.status(500).json({ error: error.toString() });
  }
};