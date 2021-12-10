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
}

export function awaitPromise(options: PromiseOptions): Promise<boolean> {
  const id = options.id;
  const timeout = options.timeout || 1000; // @TODO todo dynamic timeout based on handlers avg runtime
  const client: ApolloClient<any> = options.client;
  return new Promise(async (res, rej) => {
    debug('promise', { id });
    if (!id) {
      debug('!id', { id: options.id });
      return rej('options.id must be defined!');
    }
    let observing;
    try {
      while (true) {
        const result = await client.query(generateQuery({
          queries: [generateQueryData({ tableName: 'links', returning: `
          id type { id value }
          `, variables: {
            where: {
              _or: [
                { id: { _eq: id } },
                { from_id: { _eq: id }, type_id: { _eq: options.Then } },
                {
                  from: {
                    type_id: { _eq: options.Promise },
                    in: { type_id: { _eq: options.Then }, from_id: { _eq: id } },
                  },
                  _or: [
                    { type_id: { _eq: options.Resolved } },
                    { type_id: { _eq: options.Rejected } },
                  ],
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
            debug('data', result.data);
            const links = result.data?.q0;
            let thenExists = false;
            let thenResolved = false;
            let thenRejected = false;
            for (let l = 0; l < links.length; l++) {
              const link = links[l];
              if (link?.type?.id === options.Then) thenExists = true;
              else if (link?.type?.id === options.Resolved) thenResolved = true;
              else if (link?.type?.id === options.Rejected) thenRejected = true;
            }
            debug('analized', { thenExists, thenResolved, thenRejected });
            if (thenExists) {
              if (thenResolved && !thenRejected) {
                debug('resolved');
                return res(true);
              }
              else if (thenRejected) {
                debug('rejected');
                return rej(false);
              } else {
                debug('waiting');
              }
            } else {
              debug('!then');
              return res(true);
            }
          }
        } catch(error) {
          debug('error', error);
          return rej(false);
        }
        await delay(timeout);
      }
    } catch(error) {
      debug('error', error);
      return rej(false);
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
