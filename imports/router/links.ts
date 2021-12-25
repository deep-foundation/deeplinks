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

const SCHEMA = 'public';

const debug = Debug('deepcase:eh');

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

const portHash = {};
const containerHash = {};

export function makePromiseResult(promise: any, resolvedTypeId: number, promiseResultTypeId: number, result: any, promiseReasonTypeId: number, handleInsertId: any): Partial<{ from: { data: { from_id: any; type_id: number; to: { data: { type_id: number; object: { data: { value: any; }; }; }; }; }; }; type_id: number; to_id: any; }> {
  return {
    from: {
      data: {
        from_id: promise.id,
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
};

export const useRunner = async ({ code, beforeLink, afterLink }) => {
  // code example '() => { return (arg)=>{console.log(arg); return {result: 123}}}'
  console.log("handler4: ");
  // for now jwt only admin. In future jwt of client created event.
  const runnerPort = 3020;
  const runnerImageAndTag = 'konard/deep-runner-js:main';
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsibGluayJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJsaW5rIiwieC1oYXN1cmEtdXNlci1pZCI6IjM5In0sImlhdCI6MTYzNzAzMjQwNn0.EtYolslSV66xKe7Bx4x3MkS-dQL5hPqaUqE0eStH3KE';
  const data = jwt + code;
  
  const containerName = crypto.createHash('md5').update(data).digest("hex");
  let port;
  if (!portHash[containerName]){
    // port form 1000 to 2000
    port = Math.floor(Math.random() * 1000) + 1000;
    // check hash
    portHash[containerName] = port;
    containerHash[port] = containerName;
    const startDocker = `docker run --name ${containerName} -p ${port}:${runnerPort} -d ${runnerImageAndTag} && npx -q wait-on --timeout 20000 http://localhost:${port}/healthz`;
    let startResult;
    try {
      startResult = await execSync(startDocker).toString();
    } catch (e){
      startResult = e.stderr;
    }
    console.log('startResult', startResult.toString());
    //if hash not contain somethin in port retry start runner on other port
    console.log(1);
    while (startResult.indexOf('port is already arllocated') !== -1) {
      console.log(2);
      // fix hash that this port is busy
      containerHash[port] = 'broken';
      port = Math.floor(Math.random() * 1000) + 1000;
      containerHash[port] = containerName;
      const REstartDocker = `docker run --name ${containerName} -p ${port}:3020 -d ${runnerImageAndTag} && npx -q wait-on --timeout 20000 http://localhost:${port}/healthz`;
      const startResult = await execSync(REstartDocker).toString();
      console.log('REstartResult', startResult);
    }
    console.log(3);
    // if container for this code and jwt exists recreate container becouse we can not verify container port (or here may be ask docker to tell port instead)
    if (startResult.indexOf('is already in use by container') !== -1){
      console.log(4);
      const REstartDocker = `docker stop ${containerName} && docker rm ${containerName} && docker run --name ${containerName} -p ${port}:3020 -d ${runnerImageAndTag} && npx -q wait-on --timeout 10000 http://localhost:${port}/healthz`;
      try {
        await execSync(REstartDocker).toString();
      } catch (e){
        console.log(e?.status);
      }
    }
    console.log(5);
    const initResult = await axios.post(`http://localhost:${port}/init`, { params: { code, jwt } }); // code
    console.log('initResult', initResult.data);
    console.log(6);
  // if all ok and hash has container
  } else {
    port = portHash[containerName];
  }
  console.log(7);
  try {
    const result = await axios.post(`http://localhost:${port}/call`,  { params: { beforeLink, afterLink }});
    if(result?.data?.resolved) {
      return result.data.resolved;
    }
    return Promise.reject(result?.data?.rejected);
  } catch (e) {
    console.log('e', e);
  }
  // TODO: add action if hash has info about container which is not exists or not works fine
}

export async function handleOperation(operation: string, oldLink: any, newLink: any) {
  const current = newLink ?? oldLink;
  const currentLinkId = current.id;
  const currentTypeId = current.type_id; // TODO: check if it is correct for type for update

  console.log('currentLinkId', currentLinkId);
  console.log('currentTypeId', currentTypeId);

  const handlerTypeId = await deep.id('@deep-foundation/core', 'Handler');
  const handleInsertTypeId = await deep.id('@deep-foundation/core', `Handle${operation}`);

  console.log('handlerTypeId', handlerTypeId);
  console.log('handleInsertTypeId', handleInsertTypeId);

  const queryString = `query SELECT_CODE($typeId: bigint) { links(where: {
          type_id: { _eq: ${await deep.id('@deep-foundation/core', 'SyncTextFile')} },
          in: {
            from_id: { _eq: ${await deep.id('@deep-foundation/core', 'JSExecutionProvider')} },
            type_id: { _eq: ${handlerTypeId} },
            in: {
              _or: [
                {
                  from: {
                    type_id: { _eq: $typeId },
                  }
                },
              ],
              type_id: { _eq: ${handleInsertTypeId} },
            }
          }
        }) {
          id
          value
          in(where: { type_id: { _eq: ${handlerTypeId} } }) {
            id
            in(where: { type_id: { _eq: ${handleInsertTypeId} } }) {
              id
            }
          }
        } }`;

        // #{
        //   #  from: {
        //   #    type_id: { _eq: ${await deep.id('@deep-foundation/core', 'Selector')} },
        //   #    out: {
        //   #      type_id: { _eq: ${await deep.id('@deep-foundation/core', 'Selection')} },
        //   #      to_id: { _eq: $linkId },
        //   #    }
        //   #  }
        //   #}

  const query = gql`${queryString}`;

  const handleStringResult = await client.query({
    query, variables: {
      typeId: currentTypeId
    }
  });

  const promises: any[] = [];
  const handleInsertsIds: any[] = [];

  const handlersWithCode = handleStringResult?.data?.links as any[];
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
      const handleInsertId = handlerWithCode?.in?.[0]?.in?.[0].id;
      if (code) {
        try {
          promises.push(() => useRunner({ code, beforeLink: oldLink, afterLink: newLink }));
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
      id: currentLinkId, client: deep.apolloClient,
      Then: await deep.id('@deep-foundation/core', 'Then'),
      Promise: await deep.id('@deep-foundation/core', 'Promise'),
      Resolved: resolvedTypeId,
      Rejected: rejectedTypeId,
    });
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
          await deep.insert(promiseResults, { name: 'IMPORT_PROMISES_RESULTS' });
        });
    }
  }
}

export default async (req, res) => {
  try {
    const event = req?.body?.event;
    const operation = event?.op;
    if (operation === 'INSERT' || operation === 'UPDATE' || operation === 'DELETE') {
      const oldRow = event?.data?.old;
      const newRow = event?.data?.new;

      console.log('oldRow: ', oldRow);
      console.log('newRow: ', newRow);

      const current = operation === 'DELETE' ? oldRow : newRow;
      const typeId = current.type_id;
      console.log('current', current, typeId);

      try {
        if(operation === 'INSERT') {
          await handleOperation('Insert', oldRow, newRow);
        } else if(operation === 'UPDATE') {
          // await handleInsert(typeId, newRow);
        } else if(operation === 'DELETE') {
          // await handleOperation('Delete', typeId, oldRow, newRow);
        }

        console.log("done");

        if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
          debug('resolve', current.id);
          await resolve({
            id: current.id, client,
            Then: await deep.id('@deep-foundation/core', 'Then'),
            Promise: await deep.id('@deep-foundation/core', 'Promise'),
            Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
            Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
          });
        }
        return res.status(200).json({});
      } catch(error) {
        debug('error', error);
        if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
          debug('reject', current.id);
          await reject({
            id: current.id, client,
            Then: await deep.id('@deep-foundation/core', 'Then'),
            Promise: await deep.id('@deep-foundation/core', 'Promise'),
            Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
            Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
          });
        }
      }

      return res.status(500).json({ error: 'notexplained' });
    }
    return res.status(500).json({ error: 'operation can be only INSERT or UPDATE' });
  } catch(error) {
    return res.status(500).json({ error: error.toString() });
  }
};
