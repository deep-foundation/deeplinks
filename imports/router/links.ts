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
import { ContainerController } from '../container-controller';

const SCHEMA = 'public';

const debug = Debug('deeplinks:eh:links');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

// const DEEPLINKS_URL = process.env.DEEPLINKS_URL || 'http://localhost:3006';

const DOCKER_DEEPLINKS_URL = process.env.DOCKER_DEEPLINKS_URL || 'http://host.docker.internal:3006';
const DOCKER = process.env.DOCKER || '0';

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

export function makePromiseResult(promiseId: number, resolvedTypeId: number, promiseResultTypeId: number, result: any, promiseReasonTypeId: number, handleInsertId: any): any {
  if (typeof handleInsertId === 'number') {
    return {
      from: {
        data: {
          from_id: promiseId,
          type_id: resolvedTypeId,
          to: {
            data: {
              type_id: promiseResultTypeId,
              object: { data: { value: result } },
            }
          }
        }
      },
      type_id: promiseReasonTypeId,
      to_id: handleInsertId
    };
  } else {
    return {
      from_id: promiseId,
      type_id: resolvedTypeId,
      to: {
        data: {
          type_id: promiseResultTypeId,
          object: { data: { value: result } },
        }
      }
    };
  }
};

export async function processPromises(promises: any[], handleInsertsIds: any[], promiseId: number, promiseResultTypeId: number, promiseReasonTypeId: number, resolvedTypeId: number, rejectedTypeId: number, log: any) {
  log("promises.length: ", promises.length);
  await Promise.allSettled(promises.map((p) => p() as Promise<any>))
      .then(async (values) => {
        log("values: ", values);
        const promiseResults = [];
        for (let i = 0; i < values.length; i++) {
          const value = values[i];
          const handleInsertId = handleInsertsIds[i];
          let resultTypeId = null;
          let result = null;
          if (value.status == 'fulfilled') {
            result = value.value;
            resultTypeId = resolvedTypeId;
          }
          if (value.status == 'rejected') {
            result = value.reason;
            resultTypeId = rejectedTypeId;
          }
          log("result: ", result);
          log("resultTypeId: ", resultTypeId);
          promiseResults.push(makePromiseResult(promiseId, resultTypeId, promiseResultTypeId, result, promiseReasonTypeId, handleInsertId));
        }
        try
        {
          await deep.insert(promiseResults, { name: 'IMPORT_PROMISES_RESULTS' });
          log("inserted promiseResults: ", JSON.stringify(promiseResults, null, 2));
        }
        catch(e)
        {
          log('promiseResults insert error: ', e?.message ?? e);
        }
      });
}

const containerController = new ContainerController({
  gql_docker_domain: +DOCKER ? 'links' : 'graphql-engine',
  gql_port_path: +DOCKER ? '3006/gql' : '8080/v1/graphql',
  network: 'deep_network',
  handlersHash: {}
})

export const useRunner = async ({
  code, handler, oldLink, newLink, moment, promiseId,
} : {
  code: string, handler: string, oldLink?: any, newLink?: any, moment?: any; promiseId?: number;
}) => {
  const useRunnerDebug = Debug('deeplinks:eh:links:useRunner');
  useRunnerDebug("handler4: ");
  const jwt = (await deep.jwt({ linkId: await deep.id('@deep-foundation/core', 'system', 'admin') })).token;

  // TODO:
  // const currentLink = newLink || oldLink;
  // if (currentLink has package up in contain tree) {
  //   generate jwt by package id
  // } else if (there is not package up in contain tree but there is user up in contain tree) {
  //   generate jwt by user id
  // } else {
  //   no jwt
  // }

  useRunnerDebug('jwt', jwt);
  const container = await containerController.newContainer({ publish: +DOCKER ? false : true, forceRestart: true, handler, code, jwt, data: { oldLink, newLink, moment }});
  useRunnerDebug('newContainerResult', container);
  const initResult = await containerController.initHandler(container);
  useRunnerDebug('initResult', initResult);
  const callResult = await containerController.callHandler({ code, container, jwt, data: { oldLink, newLink, moment, promiseId } });
  useRunnerDebug('callResult', callResult);
  return callResult;
}

export const handlerOperations = {
  Insert: 'HandleInsert',
  Update: 'HandleUpdate',
  Delete: 'HandleDelete',
};

export async function handleOperation(operation: keyof typeof handlerOperations, oldLink: any, newLink: any) {
  const handleOperationDebug = Debug('deeplinks:eh:links:handleOperation');
  const current = newLink ?? oldLink;
  const currentLinkId = current.id;
  const currentTypeId = current.type_id; // TODO: check if it is correct for type for update

  const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
  const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');

  const promise = await findPromiseLink({
    id: currentLinkId, client: deep.apolloClient,
    Then: await deep.id('@deep-foundation/core', 'Then'),
    Promise: await deep.id('@deep-foundation/core', 'Promise'),
    Resolved: resolvedTypeId,
    Rejected: rejectedTypeId,
    Results: false,
  });

  if (promise) {
    // log('currentLinkId', currentLinkId);
    // log('currentTypeId', currentTypeId);

    const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
    const handleOperationTypeId = await deep.id('@deep-foundation/core', handlerOperations[operation]);
    const dockerSupportsJsType = await deep.id('@deep-foundation/core', 'dockerSupportsJs');

    // log('handlerTypeId', handlerTypeId);
    // log('handleOperationTypeId', handleOperationTypeId);

    const queryString = `query SELECT_CODE($typeId: bigint) { links(where: {
            type_id: { _eq: ${await deep.id('@deep-foundation/core', 'SyncTextFile')} },
            in: {
              from_id: { _eq: ${dockerSupportsJsType} },
              type_id: { _eq: ${handlerTypeId} },
              in: {
                from_id: { _eq: $typeId },
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
                  value
                }
              }
            }
          } }`;

          // #{
          //   #  from: {
          //   #    type_id: { _eq: ${await deep.id('@deep-foundation/core', 'Selector')} },
          //   #    out: {
          //   #      type_id: { _eq: ${await deep.id('@deep-foundation/core', 'SelectorInclude')} },
          //   #      to_id: { _eq: $linkId },
          //   #    }
          //   #  }
          //   #}
    // log('queryString', queryString);

    const query = gql`${queryString}`;

    const variables = {
      typeId: currentTypeId
    };
    // log('variables', JSON.stringify(variables));

    const handlersResult = await client.query({ query, variables });

    const promises: any[] = [];
    const handleInsertsIds: any[] = [];

    const handlersWithCode = handlersResult?.data?.links as any[];
    // log('handlersWithCode.length', handlersWithCode?.length);

    const promiseResultTypeId = await deep.id('@deep-foundation/core', 'PromiseResult');
    const promiseReasonTypeId = await deep.id('@deep-foundation/core', 'PromiseReason');

    if (handlersWithCode?.length > 0) {
      // log(queryString);
      // log(query);
      // log(JSON.stringify(query, null, 2));
      handleOperationDebug("handlersWithCode: ", JSON.stringify(handlersWithCode, null, 2));
      handleOperationDebug("handlersWithCode?.length: ", handlersWithCode?.length);

      // log(handleStringResult);
      // log(JSON.stringify(handleStringResult, null, 2));
      // log(handleStringResult?.data?.links?.[0]?.value);
      for (const handlerWithCode of handlersWithCode) {
        const code = handlerWithCode?.value?.value;
        const isolationValue = handlerWithCode?.in?.[0]?.support?.isolation?.value?.value;
        const handleInsertId = handlerWithCode?.in?.[0]?.in?.[0].id;
        if (code) {
          try {
            promises.push(async () => useRunner({ code, handler: isolationValue, oldLink, newLink, promiseId: promise.id }));
            handleInsertsIds.push(handleInsertId);
          } catch (error) {
            handleOperationDebug('error', error);
          }
        } else {
          // TODO: !!
        }
      }

      // handleOperationDebug('promise: ', promise);
      
      // handleOperationDebug("promises.length: ", promises.length);

      // Promise.allSettled([...promises, Promise.reject(new Error('an error'))])
      // Promise.allSettled(promises)
      // await Promise.allSettled(promises.map((p) => p() as Promise<any>))
      //   .then(async (values) => {
      //     handleOperationDebug("values: ", values);
      //     const promiseResults = [];
      //     for (let i = 0; i < values.length; i++) {
      //       const value = values[i];
      //       const handleInsertId = handleInsertsIds[i];
      //       if (value.status == 'fulfilled') {
      //         const result = value.value;
      //         handleOperationDebug("result: ", result);
      //         const promiseResult = makePromiseResult(promise.id, resolvedTypeId, promiseResultTypeId, result, promiseReasonTypeId, handleInsertId);
      //         promiseResults.push(promiseResult);
      //       }
      //       if (value.status == 'rejected') {
      //         const error = value.reason;
      //         handleOperationDebug("error: ", error);
      //         const promiseResult = makePromiseResult(promise.id, rejectedTypeId, promiseResultTypeId, error, promiseReasonTypeId, handleInsertId);
      //         promiseResults.push(promiseResult);
      //       }
      //     }
      //     try
      //     {
      //       await deep.insert(promiseResults, { name: 'IMPORT_PROMISES_RESULTS' });
      //       handleOperationDebug("inserted promiseResults: ", JSON.stringify(promiseResults, null, 2));
      //     }
      //     catch(e)
      //     {
      //       handleOperationDebug('promiseResults insert error: ', e?.message ?? e);
      //     }
      //   });
      await processPromises(promises, handleInsertsIds, promise.id, promiseResultTypeId, promiseReasonTypeId, resolvedTypeId, rejectedTypeId, handleOperationDebug);
    } else {
      // TODO: insert reject for promise
    }
  }
}

export async function handleSelectorOperation(operation: keyof typeof handlerOperations, oldLink: any, newLink: any) {
  const handleSelectorDebug = debug.extend('handleSelector').extend('log');
  const current = newLink ?? oldLink;
  const currentLinkId = current.id;

  // handleSelectorDebug('currentLinkId', currentLinkId);
  // handleSelectorDebug('currentTypeId', currentTypeId);

  const handleOperationTypeId = await deep.id('@deep-foundation/core', handlerOperations[operation]);

  // handleSelectorDebug('handlerTypeId', handlerTypeId);
  handleSelectorDebug('handleOperation', operation);
  // handleSelectorDebug('handleOperationTypeId', handleOperationTypeId);

  const promiseSelectorsQueryString = `query SELECT_PROMISE_SELECTORS($itemId: bigint) { promise_selectors(where: {
    item_id: { _eq: $itemId },
    handle_operation: { type_id: { _eq: ${handleOperationTypeId} } }
  }) {
    id
    promise_id
    handle_operation {
      id
      handler: to {
        id
        supports: from {
          id
          isolation: from {
            id
            image: value
          }
        }
        file: to {
          id
          code: value
        }
      }
    }
  } }`;

  const promiseSelectorsQuery = gql`${promiseSelectorsQueryString}`;

  const promiseSelectorsQueryVariables = {
    itemId: currentLinkId
  };

  const promiseSelectorsResult = await client.query({ query: promiseSelectorsQuery, variables: promiseSelectorsQueryVariables });
  // handleSelectorDebug('promiseSelectorsResult', JSON.stringify(promiseSelectorsResult, null, 2));

  const promiseSelectors = promiseSelectorsResult?.data?.promise_selectors;
  handleSelectorDebug('promiseSelectors.length', promiseSelectors?.length);

  if (!promiseSelectors?.length) {
    return;
  }

  const resolvedTypeId = await deep.id('@deep-foundation/core', 'Resolved');
  const rejectedTypeId = await deep.id('@deep-foundation/core', 'Rejected');
  const promiseResultTypeId = await deep.id('@deep-foundation/core', 'PromiseResult');
  const promiseReasonTypeId = await deep.id('@deep-foundation/core', 'PromiseReason');

  // TODO: Group promiseSelectors by promise_id
  const promiseSelectorsByPromiseId = promiseSelectors.reduce((accumulator, current) => {
    const promiseId = current.promise_id;
    if (!accumulator[promiseId]) {
      accumulator[promiseId] = [];
    }
    accumulator[promiseId].push(current);
    return accumulator;
  }, {});
  handleSelectorDebug('promiseSelectorsByPromiseId', JSON.stringify(promiseSelectorsByPromiseId, null, 2));

  // For each promise_id
  for (const promiseIdString in promiseSelectorsByPromiseId) {
    const promiseSelectors = promiseSelectorsByPromiseId[promiseIdString];
    const promiseSelectorsIds = promiseSelectors.map(promiseSelector => promiseSelector.id);
    handleSelectorDebug('promiseSelectorsIds', JSON.stringify(promiseSelectorsIds, null, 2));
    const promiseId = parseInt(promiseIdString);

    const promises: any[] = [];
    const handleInsertsIds: any[] = [];

    for (const promiseSelector of promiseSelectors) {
      const code = promiseSelector?.handle_operation?.handler?.file?.code?.value;
      const isolationValue = promiseSelector?.handle_operation?.handler?.supports?.isolation?.image?.value;
      const handleInsertId = promiseSelector?.handle_operation?.id;
      // handleSelectorDebug('code', code);
      // handleSelectorDebug('isolationValue', isolationValue);
      // handleSelectorDebug('handleInsertId', handleInsertId);
      if (code && isolationValue && handleInsertId) {
        try {
          promises.push(async () => useRunner({ code, handler: isolationValue, oldLink, newLink, promiseId }));
          handleInsertsIds.push(handleInsertId);
        } catch (error) {
          handleSelectorDebug('error', error);
        }
      } else {
        promises.push(async () => Promise.reject(new Error('code or isolationValue or handleInsertId is undefined')));
        handleInsertsIds.push(null);
      }
    }
    processPromises(promises, handleInsertsIds, promiseId, promiseResultTypeId, promiseReasonTypeId, resolvedTypeId, rejectedTypeId, handleSelectorDebug);
    
    await deep.delete(promiseSelectorsIds, { name: 'DELETE_PROMISES_SELECTORS', table: 'promise_selectors' });
  }
}

export async function handleSchedule(handleScheduleLink: any, operation: 'INSERT' | 'DELETE') {
  const handleScheduleDebug = Debug('deeplinks:eh:links:handleSchedule');
  handleScheduleDebug('handleScheduleLink', handleScheduleLink);
  handleScheduleDebug('operation', operation);
  if (operation == 'INSERT') {
    // get schedule
    const schedule = await deep.select({
      type_id: await deep.id('@deep-foundation/core', 'Schedule'),
      out: {
        id: { _eq: handleScheduleLink.id },
      },
    }, {
      table: 'links',
      returning: 'id value',
    });
    handleScheduleDebug(schedule);
    const scheduleId = schedule?.data?.[0]?.id;
    const scheduleValue = schedule?.data?.[0]?.value.value;
    handleScheduleDebug('scheduleId', scheduleId);
    handleScheduleDebug('scheduleValue', scheduleValue);
    await api.query({
      type: 'create_cron_trigger',
      args: {
        name: `handle_schedule_${handleScheduleLink?.id}`,
        webhook: `${DOCKER_DEEPLINKS_URL}/api/scheduler`,
        schedule: scheduleValue,
        include_in_metadata: true,
        payload: {
          scheduleId,
          schedule: scheduleValue,
          handleScheduleLinkId: handleScheduleLink?.id,
        },
        retry_conf: {
          num_retries: 3,
          timeout_seconds: 120,
          tolerance_seconds: 21675,
          retry_interval_seconds: 12
        },
        comment: `Event trigger for handle schedule link ${handleScheduleLink?.id} with cron schedule definition ${scheduleValue} of ${scheduleId} schedule.`,
      }
    });
    handleScheduleDebug('cron trigger created');
  } else if (operation == 'DELETE') {
    await api.query({
      type: 'delete_cron_trigger',
      args: {
        name: `handle_schedule_${handleScheduleLink?.id}`,
      }
    });
    handleScheduleDebug('cron trigger deleted');
  }
}

export async function handlePort(handlePortLink: any, operation: 'INSERT' | 'DELETE') {
  const handlePortDebug = Debug('deeplinks:eh:links:handlePort');
  handlePortDebug('handlePortLink', handlePortLink);
  handlePortDebug('operation', operation);

  // get port
  const port = await deep.select({
    id: { _eq: handlePortLink.from_id },
  }, {
    table: 'links',
    returning: 'id value',
  });
  handlePortDebug(port);
  const portId = port?.data?.[0]?.id;
  const portValue = port?.data?.[0]?.value.value;
  handlePortDebug('portId', portId);
  handlePortDebug('portValue', portValue);

  if (operation == 'INSERT') {
    // get dockerImage from isolation provider
    const isolationProvider = await deep.select({
      type_id: await deep.id('@deep-foundation/core', 'DockerIsolationProvider'),
      in: {
        id: { _eq: handlePortLink.id },
      },
    }, {
      table: 'links',
      returning: 'id value',
    });
    handlePortDebug('INSERT', isolationProvider);
    const dockerImage = isolationProvider?.data?.[0]?.value.value;
    handlePortDebug('INSERT dockerImage', dockerImage);

    // start container
    const containerName = `deep${await containerController.getDelimiter()}handle_port_${portValue}`;
    handlePortDebug('INSERT containerName', containerName);

    const container = await containerController.newContainer({ publish: true, forcePort: portValue, forceName: containerName, handler: dockerImage, code: null, jwt: null, data: { }});

    handlePortDebug('INSERT newContainer result', container);

    if (container.error) return handlePortDebug('portResult.error', container.error);
    handlePortDebug(`INSERT port handler container ${JSON.stringify(container)} created`);
  } else if (operation == 'DELETE') {

    // docker stop ${containerName} && docker rm ${containerName}
    const containerName = `deep${await containerController.getDelimiter()}handle_port_${portValue}`;
    handlePortDebug('DELETE containerName', containerName);

    const container = await containerController.findContainer(containerName);
    handlePortDebug('DELETE container', container);

    await containerController.dropContainer(container);
    
    handlePortDebug('DELETE port handler container deleted');
  }
}

export default async (req, res) => {
  try {
    let handlePortId;
    try {
      handlePortId = await deep.id('@deep-foundation/core', 'HandlePort');
    } catch {
      return res.status(500).json({ error: '@deep-foundation/core package is not ready to support links handlers.' });
    }
    const event = req?.body?.event;
    const operation = event?.op;
    if (operation === 'INSERT' || operation === 'UPDATE' || operation === 'DELETE') {
      const oldRow = event?.data?.old;
      // select value into oldRow
      if(oldRow) {
        const queryResult = await deep.select({
          id: { _eq: oldRow.id },
        }, {
          returning: `value`,
        });
        // log("old queryResult: ", queryResult);
        oldRow.value = queryResult.data?.[0]?.value;
      }
      const newRow = event?.data?.new;
      // select value into newRow
      if (newRow) {
        const queryResult = await deep.select({
          id: { _eq: newRow.id },
        }, {
          returning: `value`,
        });
        // log("new queryResult: ", queryResult);
        newRow.value = queryResult.data?.[0]?.value;
      }
      
      const current = operation === 'DELETE' ? oldRow : newRow;
      log(`Processing ${current.id} link.`)
      // log('event', JSON.stringify(event, null, 2));
      log('operation', operation);
      // log('oldRow', oldRow);
      // log('newRow', newRow);
      log('current', current);
      try {
        if(operation === 'INSERT') {
          await handleOperation('Insert', oldRow, newRow);
          await handleSelectorOperation('Insert', oldRow, newRow);
        } else if(operation === 'DELETE') {
          await handleOperation('Delete', oldRow, newRow);
          await handleSelectorOperation('Delete', oldRow, newRow);
        }

        const typeId = current.type_id;

        const handleScheduleId = await deep.id('@deep-foundation/core', 'HandleSchedule');
        if (typeId === handleScheduleId && (operation === 'INSERT' || operation === 'DELETE')) {
          await handleSchedule(current, operation);
        }
        
        if (typeId === handlePortId && (operation === 'INSERT' || operation === 'DELETE')) {
          await handlePort(current, operation);
        }

        log(`Link ${current.id} is proccessed.`);

        if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
          log('resolve', current.id);
          await resolve({
            id: current.id, client,
            Then: await deep.id('@deep-foundation/core', 'Then'),
            Promise: await deep.id('@deep-foundation/core', 'Promise'),
            Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
            Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
            Results: false,
          });
        }
        return res.status(200).json({});
      } catch(e) {
        error('error', e);
        if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
          log('reject', current.id);
          await reject({
            id: current.id, client,
            Then: await deep.id('@deep-foundation/core', 'Then'),
            Promise: await deep.id('@deep-foundation/core', 'Promise'),
            Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
            Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
            Results: false,
          });
        }
      }
      return res.status(500).json({ error: 'notexplained' });
    }
    return res.status(500).json({ error: 'operation can be only INSERT or UPDATE' });
  } catch(e) {
    return res.status(500).json({ error: e.toString() });
  }
};
