import { ApolloClient } from "@apollo/client";
import Debug from 'debug';
import { generateQuery, generateQueryData, generateSerial, insertMutation } from "./gql";


const debug = Debug('deeplinks:promise');

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
    debug('promise', { id });
    if (!id) {
      debug('!id', { id: options.id });
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
                { id: { _eq: id } },
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
        debug('result', result);
        try {
          if (result?.errors) {
            debug('error', result?.errors);
            return rej(result?.errors);
          }
          else if (result?.data) {
            const links = result.data?.q0;
            debug('data', JSON.stringify(links, null, 2));
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
            debug('analized', { thenExists });

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
              debug('analized', { thenResolved, thenRejected });

              const filteredLinks = links.filter(l => 
                l?.id === id ||
                l?.type?.id === options.Then ||
                (l?.type?.id === options.Promise && promises[l?.id]) ||
                (l?.type?.id === options.Resolved && promises[l?.from_id]) ||
                (l?.type?.id === options.Rejected && promises[l?.from_id])
              );
              debug('filteredLinks', JSON.stringify(filteredLinks, null, 2));

              if (thenResolved && !thenRejected) {
                debug('resolved');
                return res(options.Results ? filteredLinks : true);
              }
              else if (thenRejected) {
                debug('rejected');
                return res(options.Results ? filteredLinks : false);
              } else {
                debug('waiting');
              }
            } else {
              debug('!then');
              return res(options.Results ? [] : true);
            }
          }
        } catch(error) {
          debug('error', error);
          return rej(options.Results ? error : false);
        }
        await delay(timeout);
      }
    } catch(error) {
      debug('error', error);
      return rej(options.Results ? error : false);
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
  debug('reject', options.id);
  const promise = await findPromiseLink(options);
  if (promise) {
    debug('rejected', await options.client.mutate(generateSerial({
      actions: [insertMutation('links', { objects: { type_id: options.Rejected, from_id: promise.id, to_id: promise.id } })],
      name: 'REJECT',
    })));
    return true;
  }
  return false;
}

export async function resolve(options: PromiseOptions): Promise<boolean> {
  debug('resolve', options.id);
  const promise = await findPromiseLink(options);
  if (promise) {
    debug('resolved', await options.client.mutate(generateSerial({
      actions: [insertMutation('links', { objects: { type_id: options.Resolved, from_id: promise.id, to_id: promise.id } })],
      name: 'RESOLVE',
    })));
    return true;
  }
  return false;
}
