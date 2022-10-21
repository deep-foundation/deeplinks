import Debug from 'debug';

import { HasuraApi } from "@deep-foundation/hasura/api";
import { generateApolloClient } from '@deep-foundation/hasura/client';
// import { sql } from '@deep-foundation/hasura/sql';
import { gql } from 'apollo-boost';

import { DeepClient } from '../client';
import { ContainerController } from '../container-controller';
import { ALLOWED_IDS, DENIED_IDS } from '../global-ids';
import { findPromiseLink, reject, resolve } from '../promise';
import { promisify } from 'util';
import {exec} from 'child_process';
import waitOn from 'wait-on';
const execAsync = promisify(exec);

const SCHEMA = 'public';

const debug = Debug('deeplinks:eh:links');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

// const DEEPLINKS_URL = process.env.DEEPLINKS_URL || 'http://localhost:3006';

const DOCKER_DEEPLINKS_URL = process.env.DOCKER_DEEPLINKS_URL || 'http://host.docker.internal:3006';
const DEEPLINKS_ROUTE_HANDLERS_HOST = process.env.DEEPLINKS_ROUTE_HANDLERS_HOST || 'host.docker.internal';
export const DOCKER = process.env.DOCKER || '0';

const delay = time => new Promise(res => setTimeout(res, time));

const toJSON = (data) => JSON.stringify(data, Object.getOwnPropertyNames(data), 2);

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
          await deep.insert(promiseResults as any, { name: 'IMPORT_PROMISES_RESULTS' });
          log("inserted promiseResults: ", JSON.stringify(promiseResults, null, 2));
        }
        catch(e)
        {
          log('promiseResults insert error: ', e?.message ?? e);
        }
      });
}

export const containerController = new ContainerController({
  gql_docker_domain: +DOCKER ? 'links' : 'hasura',
  gql_port_path: +DOCKER ? '3006/gql' : '8080/v1/graphql',
  handlersHash: {}
});

export async function getJwt(handlerId: number, useRunnerDebug: any) {
  const getJwtDebug = Debug('deeplinks:eh:links:getJwt');
  const userTypeId = await deep.id('@deep-foundation/core', 'User');
  getJwtDebug("userTypeId: ", JSON.stringify(userTypeId, null, 2));
  const packageTypeId = await deep.id('@deep-foundation/core', 'Package');
  getJwtDebug("packageTypeId: ", JSON.stringify(packageTypeId, null, 2));
  const queryString = `query {
    mpUp: mp(where: {
      item_id: {_eq: "${handlerId}"},
      path_item: {type_id: {_in: ["${userTypeId}", "${packageTypeId}"]}}
    }) {
      id
      path_item {
        id
        type_id
        value
      }
      path_item_depth
      position_id
    }
    mpMe: mp(where: {item_id: {_eq: "${handlerId}"}, path_item_id: { _eq: "${handlerId}" }}) {
      id
      path_item_depth
      position_id
    }
  }`;
  const ownerResults = await client.query({ query: gql`${queryString}` });
  getJwtDebug("ownerResults: ", JSON.stringify(ownerResults, null, 2));

  const mpUp = ownerResults.data.mpUp;
  const mpMe = ownerResults.data.mpMe;
  const possibleOwners = mpMe.map((me) => {
    const getDepthDifference = (depth: number) => me.path_item_depth - depth;
    const up = mpUp.filter((up) => up.position_id == me.position_id);
    const closestUp = up.sort((a, b) => getDepthDifference(a.path_item_depth) - getDepthDifference(b.path_item_depth))[0];
    return closestUp?.path_item;
  }).filter(r => !!r);
  getJwtDebug("possibleOwners: ", JSON.stringify(possibleOwners, null, 2));

  const ownerPackage = possibleOwners.find(r => r.type_id == packageTypeId);
  const ownerUser = possibleOwners.find(r => r.type_id == userTypeId);

  let ownerId;
  if (ownerPackage) {
    ownerId = ownerPackage.id;
    getJwtDebug("owner is package");
  } else if (ownerUser) {
    ownerId = ownerUser.id;
    getJwtDebug("owner is user");
  } else {
    throw new Error("No handler owner found.");
  }
  getJwtDebug("ownerId: ", ownerId);

  // TODO:
  // const currentLink = newLink || oldLink;
  // if (currentLink has package up in contain tree) {
  //   generate jwt by package id
  // } else if (there is not package up in contain tree but there is user up in contain tree) {
  //   generate jwt by user id
  // } else {
  //   no jwt
  // }
  const jwt = (await deep.jwt({ linkId: ownerId })).token;
  useRunnerDebug('jwt', jwt);
  return jwt;
}

export const useRunner = async ({
  code, handler, handlerId, oldLink, newLink, moment, promiseId,
} : {
  code: string, handlerId: number, handler: string, oldLink?: any, newLink?: any, moment?: any; promiseId?: number;
}) => {
  const useRunnerDebug = Debug('deeplinks:eh:links:useRunner');
  useRunnerDebug("handler4: ");

  const jwt = await getJwt(handlerId, useRunnerDebug);
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
  const currentTypeId = current.type_id;

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

    const queryString = `query SELECT_CODE($typeId: bigint) {
      links(where: {
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
      }
    }`;

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
        const handlerId = handlerWithCode?.in?.[0]?.id;
        const handleInsertId = handlerWithCode?.in?.[0]?.in?.[0].id;
        if (code && isolationValue && handlerId && handleInsertId) {
          try {
            promises.push(async () => useRunner({ code, handlerId, handler: isolationValue, oldLink, newLink, promiseId: promise.id }));
            handleInsertsIds.push(handleInsertId);
          } catch (error) {
            handleOperationDebug('error', error);
          }
        } else {
          promises.push(async () => Promise.reject(new Error('Code of a handler is not loaded.')));
          handleInsertsIds.push(null);
        }
      }
      await processPromises(promises, handleInsertsIds, promise.id, promiseResultTypeId, promiseReasonTypeId, resolvedTypeId, rejectedTypeId, handleOperationDebug);
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
      const handlerId = promiseSelector?.handle_operation?.handler?.id;
      const handleInsertId = promiseSelector?.handle_operation?.id;
      // handleSelectorDebug('code', code);
      // handleSelectorDebug('isolationValue', isolationValue);
      // handleSelectorDebug('handleInsertId', handleInsertId);
      if (code && isolationValue && handlerId && handleInsertId) {
        try {
          promises.push(async () => useRunner({ code, handlerId, handler: isolationValue, oldLink, newLink, promiseId }));
          handleInsertsIds.push(handleInsertId);
        } catch (error) {
          handleSelectorDebug('error', error);
        }
      } else {
        promises.push(async () => Promise.reject(new Error('Code of a handler is not loaded.')));
        handleInsertsIds.push(null);
      }
    }
    processPromises(promises, handleInsertsIds, promiseId, promiseResultTypeId, promiseReasonTypeId, resolvedTypeId, rejectedTypeId, handleSelectorDebug);
    
    await deep.delete(promiseSelectorsIds, { name: 'DELETE_PROMISES_SELECTORS', table: 'promise_selectors' as any });
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

export async function handleGql(handleGqlLink: any, operation: 'INSERT' | 'DELETE') {
  const handleGqlDebug = Debug('deeplinks:eh:links:handleGql');
  handleGqlDebug('handleGqlLink', handleGqlLink);
  handleGqlDebug('operation', operation);
  if (operation == 'INSERT') {
    // insert gql handler
    const portTypeId = await deep.id('@deep-foundation/core', 'Port');
    const routerStringUseTypeId = await deep.id('@deep-foundation/core', 'RouterStringUse');
    const routerListeningTypeId = await deep.id('@deep-foundation/core', 'RouterListening');
    const handleRouteTypeId = await deep.id('@deep-foundation/core', 'HandleRoute');

    const routesResult = await client.query({
      query: gql`
        query {
          ports: links(where: {
            type_id: { _eq: ${portTypeId} },
            in: {
              type_id: { _eq: ${routerListeningTypeId} }
              from: {
                in: {
                  type_id: { _eq: ${routerStringUseTypeId} }
                  from: {
                    out: {
                      type_id: { _eq: ${handleRouteTypeId} },
                      in: {
                        id: { _eq: ${handleGqlLink?.id} }
                      }
                    }
                  }
                }
              }
            }
          }) {
            id
            port: value
            routerListening: in(where: {
              type_id: { _eq: ${routerListeningTypeId} }
            }) {
              id
              router: from {
                id
                routerStringUse: in(where: {
                  type_id: { _eq: ${routerStringUseTypeId} }
                }) {
                  id
                  routeString: value
                  route: from {
                    id
                    handleRoute: out(where: {
                      type_id: { _eq: ${handleRouteTypeId} },
                      in: {
                        id: { _eq: ${handleGqlLink?.id} }
                      }
                    }) {
                      id
                      handleGql: in(where: {
                        id: { _eq: ${handleGqlLink?.id} }
                      }) {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `, variables: {} });
    const portsResult = routesResult.data.ports;
    handleGqlDebug('portsResult', JSON.stringify(portsResult, null, 2));

    const urls = {};

    for (const port of portsResult) {
      const portValue = port?.port?.value;
      // TODO: Use better way to get base url
      // const baseUrl = (await execAsync(`gp url ${portValue}`)).stdout.trim();
      const baseUrl = `http://${DEEPLINKS_ROUTE_HANDLERS_HOST}:${portValue}`;
      for (const routerListening of port?.routerListening) {
        for (const routerStringUse of routerListening?.router?.routerStringUse) {
          const url = `${baseUrl}${routerStringUse?.routeString?.value}`;
          urls[url] = routerStringUse?.route?.handleRoute?.[0]?.id;
        }
      }
    }

    handleGqlDebug('urls', JSON.stringify(urls, null, 2));

    for (const url of Object.keys(urls)) {
      const handleRouteId = urls[url];
      // add_remote_schema
      const options = {
        type: 'add_remote_schema',
        args: {
          // TODO: It is now possible to create only single schema per all urls
          name: `handle_gql_handler_${handleGqlLink?.id}`,
          definition: {
            url,
            headers: [{ name: 'x-hasura-client', value: 'deeplinks-gql-handler' }],
            forward_client_headers: true,
            timeout_seconds: 60
          }
        }
      };
      handleGqlDebug('options', JSON.stringify(options, null, 2));
      const waitOnUrl = `${url.replace(DEEPLINKS_ROUTE_HANDLERS_HOST, "localhost").replace('http://','http-get://')}?query=%7B__typename%7D`
      handleGqlDebug('waitOnUrl', waitOnUrl);
      await waitOn({ resources: [waitOnUrl] });
      try 
      {
        const response = await api.query(options);
        handleGqlDebug('remote schema addition response', JSON.stringify(JSON.parse(toJSON(response)), null, 2));
        if (response.data.error) {
          throw response;
        }
        handleGqlDebug('remote schema is added');
      }
      catch(rejected)
      {
        const processedRejection = JSON.parse(toJSON(rejected));
        handleGqlDebug('rejected', processedRejection);
        const handlingErrorTypeId = await deep.id('@deep-foundation/core', 'HandlingError');
        handleGqlDebug('handlingErrorTypeId', handlingErrorTypeId);

        const insertResult = await deep.insert({
          type_id: handlingErrorTypeId,
          object: { data: { value: processedRejection } },
          out: { data: [
            {
              type_id: await deep.id('@deep-foundation/core', 'HandlingErrorReason'),
              to_id: handleRouteId,
            },
          ]},
        }, {
          name: 'INSERT_HANDLING_ERROR',
        }) as any;
        handleGqlDebug('remote schema addition error is inserted');
      }
    }
  } else if (operation == 'DELETE') {
    const reasonResult = await client.query({
      query: gql`
        query {
          handleGql: links(where: {
            id: { _eq: ${handleGqlLink?.id} }
          }) {
            id
          }
          handleRoute: links(where: {
            id: { _eq: ${handleGqlLink?.to_id} }
          }) {
            id
          }
        }
      `, variables: {} });
    const data = reasonResult.data;
    const reasonId = data?.handleGql?.[0]?.id ?? data?.handleRoute?.[0]?.id;
    handleGqlDebug('reasonId', reasonId);

    try 
    {
      // delete gql handler
      const response = await api.query({
        type: 'remove_remote_schema',
        args: {
          name: `handle_gql_handler_${handleGqlLink?.id}`,
        },
      });
      handleGqlDebug('remote schema removal response', JSON.stringify(JSON.parse(toJSON(response)), null, 2));
      if (response.data.error) {
        throw response;
      }
      handleGqlDebug('remote schema is removed');
    }
    catch(rejected)
    {
      const processedRejection = JSON.parse(toJSON(rejected));
      handleGqlDebug('rejected', processedRejection);
      const handlingErrorTypeId = await deep.id('@deep-foundation/core', 'HandlingError');
      handleGqlDebug('handlingErrorTypeId', handlingErrorTypeId);

      const insertResult = await deep.insert({
        type_id: handlingErrorTypeId,
        object: { data: { value: processedRejection } },
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'HandlingErrorReason'),
            to_id: reasonId,
          },
        ]},
      }, {
        name: 'INSERT_HANDLING_ERROR',
      }) as any;
      handleGqlDebug('remote schema removal error is inserted');
    }
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
    const containerName = `deep-handle-port-${portValue}`;
    handlePortDebug('INSERT containerName', containerName);

    const container = await containerController.newContainer({ publish: true, forcePort: portValue, forceName: containerName, handler: dockerImage, code: null, jwt: null, data: { }});

    handlePortDebug('INSERT newContainer result', container);

    if (container.error) return handlePortDebug('portResult.error', container.error);
    handlePortDebug(`INSERT port handler container ${JSON.stringify(container)} created`);
  } else if (operation == 'DELETE') {

    // docker stop ${containerName} && docker rm ${containerName}
    const containerName = `deep-handle-port-${portValue}`;
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
        const handleGqlTypeId = await deep.id('@deep-foundation/core', 'HandleGql');
        if (typeId === handleGqlTypeId && (operation === 'INSERT' || operation === 'DELETE')) {
          await handleGql(current, operation);
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
        error('error', e, e?.graphQLErrors?.[0]?.extensions);
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
