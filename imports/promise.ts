import { ApolloClient } from "@apollo/client";
import { GLOBAL_NAME_PROMISE, GLOBAL_NAME_REJECTED, GLOBAL_NAME_RESOLVED, GLOBAL_NAME_THEN } from "./global-ids";
import { generateQuery, generateQueryData, generateSerial, insertMutation } from "./gql";

export interface PromiseOptions {
  id: number;
  client: ApolloClient<any>;
}

export function awaitPromise(options: PromiseOptions) {
  const id = options.id;
  const client: ApolloClient<any> = options.client;
  return new Promise((res, rej) => {
    const subscription = client.subscribe(generateQuery({
      queries: [generateQueryData({ tableName: 'links', returning: `
        id type { id value }
      `, variables: {
        where: {
          _or: [
            { id: { _eq: id } },
            { from_id: id, type: { value: { _contains: { value: GLOBAL_NAME_THEN } } } },
            { from: { type: { value: { _contains: { value: GLOBAL_NAME_PROMISE } } }, in: { type: { value: { _contains: { value: GLOBAL_NAME_THEN } } }, from_id: { _eq: id } } }, _or: [
              { type: { value: { _contains: { value: GLOBAL_NAME_RESOLVED } } } },
              { type: { value: { _contains: { value: GLOBAL_NAME_REJECTED } } } },
            ] },
          ],
        },
      } })],
      name: 'PROMISE',
    }));
    const observing = subscription.subscribe((result) => {
      if (result?.errors) rej(result?.errors);
      else if (result?.data) {
        const links = result?.data?.q0;
        if (links.length) {
          let thenExists = false;
          let thenResolved = false;
          let thenRejected = false;
          for (let l = 0; l < links.length; l++) {
            const link = links[l];
            if (link?.type?.value?.value === GLOBAL_NAME_THEN) thenExists = true;
            else if (link?.type?.value?.value === GLOBAL_NAME_RESOLVED) thenResolved = true;
            else if (link?.type?.value?.value === GLOBAL_NAME_REJECTED) thenRejected = true;
          }
          if (thenExists) {
            if (thenResolved && !thenRejected) {
              observing.unsubscribe();
              res(true);
            }
            else if (thenRejected) {
              observing.unsubscribe();
              rej(false);
            }
          } else observing.unsubscribe();
        }
      }
    });
  });
};

export async function findPromise(options: PromiseOptions) {
  const result = await options.client.query(generateQuery({
    queries: [
      generateQueryData({ tableName: 'links', returning: `id`, variables: { where: {
        type: { value: { _contains: { value: GLOBAL_NAME_PROMISE } } },
        in: {
          type: { value: { _contains: { value: GLOBAL_NAME_THEN } } },
          from_id: options.id,
        },
      } } }),
    ],
    name: 'FIND_PROMISE',
  }));
  return result?.data?.q0;
}

export async function findLinkByValue(options: PromiseOptions, value: string) {
  const result = await options.client.query(generateQuery({
    queries: [
      generateQueryData({ tableName: 'links', returning: `id`, variables: { where: {
        value: { _contains: { value: value } },
      } } }),
    ],
    name: 'FIND_LINK_BY_VALUE',
  }));
  return result?.data?.q0;
}

export async function reject(options: PromiseOptions): Promise<boolean> {
  const rej = await findLinkByValue(options, GLOBAL_NAME_REJECTED);
  const promise = await findPromise(options);
  if (promise) {
    await options.client.mutate(generateSerial({
      actions: [insertMutation('links', { objects: { type_id: rej.id, from_id: promise.id, to_id: promise.id } })],
      name: 'REJECT',
    }));
    return true;
  }
  return false;
}

export async function resolve(options: PromiseOptions): Promise<boolean> {
  const res = await findLinkByValue(options, GLOBAL_NAME_RESOLVED);
  const promise = await findPromise(options);
  if (promise) {
    await options.client.mutate(generateSerial({
      actions: [insertMutation('links', { objects: { type_id: res.id, from_id: promise.id, to_id: promise.id } })],
      name: 'RESOLVE',
    }));
    return true;
  }
  return false;
}
