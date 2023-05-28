import type { ApolloClient } from '@apollo/client';
import Debug from 'debug';
import { generateQuery, generateQueryData, generateSerial, insertMutation } from './gql/index.js';


const debug = Debug('deeplinks:promise');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

export const delay = (time) => new Promise(res => setTimeout(() => res(null), time));

export interface PromiseOptions {
  id: number;
  timeout?: number;
  client: ApolloClient<any>;
  Then: number;
  Promise: number;
  Resolved: number;
  Rejected: number;
  Results: boolean;
}

export function awaitPromise(options: PromiseOptions): Promise<any> {
  const id = options.id;
  const timeout = options.timeout || 1000; // @TODO todo dynamic timeout based on handlers avg runtime
  const client: ApolloClient<any> = options.client;
  return new Promise(async (res, rej) => {
    log('promise', { id });
    if (!id) {
      log('!id', { id: options.id });
      return rej('options.id must be defined!');
    }
    let promises = null;
    try {
      while (true) {
        const result = await client.query(generateQuery({
          queries: [generateQueryData({ tableName: 'links', returning: `
          id type { id value } from_id to_id
          `, variables: {
            where: {
              _or: [
                // { id: { _eq: id } },
                { 
                  from_id: { _eq: id },
                  type_id: { _eq: options.Then },
                  to: {
                    _not: {
                      out: {
                        type_id: { _in: [options.Resolved, options.Rejected] }
                      }
                    }
                  }
                },
                {
                  type_id: { _eq: options.Promise },
                  in: { type_id: { _eq: options.Then }, from_id: { _eq: id } },
                },
                {
                  from: {
                    type_id: { _eq: options.Promise },
                    in: { type_id: { _eq: options.Then }, from_id: { _eq: id } },
                  },
                  type_id: { _in: [options.Resolved, options.Rejected] },
                },
              ],
            },
          } })],
          name: 'PROMISE',
        }));
        log('result', JSON.stringify(result, null, 2));
        try {
          if (result?.errors) {
            log('error', result?.errors);
            return rej(result?.errors);
          }
          else if (result?.data) {
            const links = result.data?.q0;
            log('data', JSON.stringify(links, null, 2));
            if (promises === null) {
              promises = {};
              for (let l = 0; l < links.length; l++) {
                const link = links[l];
                if (link?.type?.id === options.Then) promises[link?.to_id] = true;
              }
            }
            let promiseResolves = {};
            let promiseRejects = {};
            for (let l = 0; l < links.length; l++) {
              const link = links[l];
              if (link?.type?.id === options.Resolved) promiseResolves[link?.from_id] = true;
              else if (link?.type?.id === options.Rejected) promiseRejects[link?.from_id] = true;
            }
            
            let promisesCount = Object.keys(promises).length;
            let thenExists = promisesCount > 0;
            log('analized', { thenExists });

            if (thenExists) {
              let thenResolvedByPromise: boolean[] = [];
              let thenRejectedByPromise: boolean[] = [];
              for (let key in promises)
              {
                thenResolvedByPromise.push(!!promiseResolves[key]);
                thenRejectedByPromise.push(!!promiseRejects[key]);
              }
              const thenResolved = thenResolvedByPromise.some(r => r);
              const thenRejected = thenRejectedByPromise.some(r => r);
              log('analized', { thenResolved, thenRejected });

              const filteredLinks = links.filter(l => 
                l?.id === id ||
                l?.type?.id === options.Then ||
                (l?.type?.id === options.Promise && promises[l?.id]) ||
                (l?.type?.id === options.Resolved && promises[l?.from_id]) ||
                (l?.type?.id === options.Rejected && promises[l?.from_id])
              );
              log('filteredLinks', JSON.stringify(filteredLinks, null, 2));

              if (thenResolved && !thenRejected) {
                log('resolved');
                return res(options.Results ? filteredLinks : true);
              }
              else if (thenRejected) {
                log('rejected');
                return res(options.Results ? filteredLinks : false);
              } else {
                log('waiting');
              }
            } else {
              log('!then');
              return res(options.Results ? [] : true);
            }
          }
        } catch(e) {
          error('error', e);
          return rej(options.Results ? e : false);
        }
        await delay(timeout);
      }
    } catch(e) {
      error('error', e);
      return rej(options.Results ? e : false);
    }
  });
};

export async function findPromiseLink(options: PromiseOptions) {
  const result = await options.client.query(generateQuery({
    queries: [
      generateQueryData({ tableName: 'links', returning: `id`, variables: { where: {
        type_id: { _eq: options.Promise },
        in: {
          type_id: { _eq: options.Then },
          from_id: { _eq: options.id },
          to: {
            _not: {
              out: {
                type_id: { _in: [options.Resolved, options.Rejected] }
              }
            }
          }
        },
      } } }),
    ],
    name: 'FIND_PROMISE',
  }));
  return result?.data?.q0?.[0];
}

export async function reject(options: PromiseOptions): Promise<boolean> {
  log('reject', options.id);
  const promise = await findPromiseLink(options);
  if (promise) {
    log('rejected', await options.client.mutate(generateSerial({
      actions: [insertMutation('links', { objects: { type_id: options.Rejected, from_id: promise.id, to_id: promise.id } })],
      name: 'REJECT',
    })));
    return true;
  }
  return false;
}

export async function resolve(options: PromiseOptions): Promise<boolean> {
  log('resolve', options.id);
  const promise = await findPromiseLink(options);
  if (promise) {
    log('resolved', await options.client.mutate(generateSerial({
      actions: [insertMutation('links', { objects: { type_id: options.Resolved, from_id: promise.id, to_id: promise.id } })],
      name: 'RESOLVE',
    })));
    return true;
  }
  return false;
}
