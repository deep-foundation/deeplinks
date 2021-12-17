import { ApolloClient, ApolloQueryResult, useApolloClient } from "@apollo/client";
import { useMemo } from "react";
import { deprecate, inherits } from "util";
import { deleteMutation, generateQuery, generateQueryData, generateSerial, insertMutation, updateMutation } from "./gql";
import { Link, minilinks, MinilinksInstance, MinilinksResult } from "./minilinks";
import { awaitPromise } from "./promise";
import { reserve } from "./reserve";

export const ALLOWED_IDS = [5];
export const DENIED_IDS = [0, 10, 11, 12, 13];
export const GLOBAL_ID_PACKAGE=2;
export const GLOBAL_ID_CONTAIN=3;
export const GLOBAL_ID_ANY=8;
export const GLOBAL_ID_PROMISE=9;
export const GLOBAL_ID_THEN=10;
export const GLOBAL_ID_RESOLVED=11;
export const GLOBAL_ID_REJECTED=12;
export const GLOBAL_ID_PACKAGE_ACTIVE=42;
export const GLOBAL_ID_PACKAGE_VERSION=43;

export interface DeepClientOptions<L = Link<number>> {
  apolloClient: ApolloClient<any>;
  minilinks?: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;
}

export interface DeepClientResult<R> extends ApolloQueryResult<R> {}

export type DeepClientPackageSelector = string;
export type DeepClientPackageContain = string;
export type DeepClientLinkId = number;
// export type DeepClientBoolExp = number;
export type DeepClientStartItem = DeepClientPackageSelector | DeepClientLinkId;
export type DeepClientPathItem = DeepClientPackageContain;

export interface DeepClientInstance<L = Link<number>> {
  apolloClient?: ApolloClient<any>;
  minilinks?: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;

  stringify(any?: any): string;

  select<LL = L>(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }): Promise<DeepClientResult<LL[]>>;

  insert<LL = L>(objects: Partial<LL> | Partial<LL>[], options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>>;

  update(exp: any, value: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>>;

  delete(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ returning: { id }[] }>>;

  reserve<LL = L>(count: number): Promise<number[]>;

  await(id: number): Promise<boolean>;

  serializeWhere(exp: any, env?: string): any;
  serializeQuery(exp: any, env?: string): any;

  id(start: DeepClientStartItem, ...path: DeepClientPathItem[]): Promise<number>;
}

export class DeepClient<L = Link<number>> implements DeepClientInstance<L> {
  apolloClient?: ApolloClient<any>;
  minilinks?: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;

  constructor(options: DeepClientOptions<L>) {
    // @ts-ignore
    this.minilinks = options.minilinks || minilinks([]);
    this.apolloClient = options.apolloClient;
    this.table = options.table || 'links';

    this.selectReturning = options.selectReturning || 'id type_id from_id to_id value';
    this.insertReturning = options.insertReturning || 'id';
    this.updateReturning = options.updateReturning || 'id';
    this.deleteReturning = options.deleteReturning || 'id';

    this.defaultSelectName = options.defaultSelectName || 'SELECT';
    this.defaultInsertName = options.defaultInsertName || 'INSERT';
    this.defaultUpdateName = options.defaultUpdateName || 'UPDATE';
    this.defaultDeleteName = options.defaultDeleteName || 'DELETE';
  }

  stringify(any?: any): string {
    if (typeof(any) === 'object') {
      let json;
      try { json = JSON.parse(any); } catch(error) {}
      return json || any.toString();
    } else return any;
  }

  async select<LL = L>(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }): Promise<DeepClientResult<LL[]>> {
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : this.serializeWhere(exp, options?.table === this.table || !options?.table ? 'link' : 'value') : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || this.selectReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultSelectName;
    const q = await this.apolloClient.query(generateQuery({
      queries: [
        generateQueryData({
          tableName: table,
          returning,
          variables: {
            ...variables,
            where,
          } }),
      ],
      name: name,
    }));
    // @ts-ignore
    return { ...q, data: (q)?.data?.q0 };
  };

  async insert<LL = L>(objects: Partial<LL> | Partial<LL>[] = {}, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>> {
    const _objects = Object.prototype.toString.call(objects) === '[object Array]' ? objects : [objects];
    const table = options?.table || this.table;
    const returning = options?.returning || this.insertReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultInsertName;
    const q = await this.apolloClient.mutate(generateSerial({
      actions: [insertMutation(table, { ...variables, objects: objects }, { tableName: table, operation: 'insert', returning })],
      name: name,
    }));
    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  async update(exp: any, value: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>> {
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : this.serializeWhere(exp, options?.table === this.table || !options?.table ? 'link' : 'value') : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || this.updateReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultUpdateName;
    const q = await this.apolloClient.mutate(generateSerial({
      actions: [updateMutation(table, { ...variables, where, _set: value }, { tableName: table, operation: 'update', returning })],
      name: name,
    }));
    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  async delete(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ returning: { id }[] }>> {
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : this.serializeWhere(exp, options?.table === this.table || !options?.table ? 'link' : 'value') : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || this.deleteReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultDeleteName;
    const q = await this.apolloClient.mutate(generateSerial({
      actions: [deleteMutation(table, { ...variables, where, returning }, { tableName: table, operation: 'delete', returning })],
      name: name,
    }));
    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  reserve<LL = L>(count: number): Promise<number[]> {
    return reserve({ count, client: this.apolloClient });
  };

  async await(id: number): Promise<boolean> {
    return awaitPromise({
      id, client: this.apolloClient,
      Then: await this.id('@deep-foundation/core', 'Then'),
      Promise: await this.id('@deep-foundation/core', 'Promise'),
      Resolved: await this.id('@deep-foundation/core', 'Resolved'),
      Rejected: await this.id('@deep-foundation/core', 'Rejected'),
    });
  };

  _serialize = {
    link: {
      value: 'value',
      relations: {
        string: 'value',
        number: 'value',
        object: 'value',
        to: 'link',
        from: 'link',
        in: 'link',
        out: 'link',
        type: 'link',
        typed: 'link',
      },
    },
    value: {
      relations: {
        link: 'link',
      },
    },
  };

  _boolExpFields = {
    _and: true,
    _not: true,
    _or: true,
  };

  /**
   * Watch relations to links and values.
   * If not-relation field values contains primitive type - string/number, it wrap into `{ _eq: value }`.
   * If not-relation field `value` in links query level contains promitive type - stirng/number, value wrap into `{ value: { _eq: value } }`.
   */
  serializeWhere(exp: any, env: string = 'link'): any {
    if (Object.prototype.toString.call(exp) === '[object Array]') return exp.map((e) => this.serializeWhere(e, env));
    else if (typeof(exp) === 'object') {
      const keys = Object.keys(exp);
      const result = {};
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const type = typeof(exp[key]);
        let setted: any = false;
        if (env === 'link') {
          if (type === 'string' || type === 'number') {
            if (key === 'value' || key === type) {
              setted = result[type] = { value: { _eq: exp[key] } };
            } else {
              setted = result[key] = { _eq: exp[key] };
            }
          } else if (!this._boolExpFields[key] && Object.prototype.toString.call(exp[key]) === '[object Array]') {
            // @ts-ignore
            setted = result[key] = this.serializeWhere(this.pathToWhere(...exp[key]));
          }
        } else if (env === 'value') {
          if (type === 'string' || type === 'number') {
            setted = result[key] = { _eq: exp[key] };
          }
        }
        if (!setted) result[key] = this._boolExpFields[key] ? this.serializeWhere(exp[key], env) : this._serialize?.[env]?.relations?.[key] ? this.serializeWhere(exp[key], this._serialize?.[env]?.relations?.[key]) : exp[key];
      }
      return result;
    } else return exp;
  };

  serializeQuery(exp: any, env: string = 'link'): any {
    const { limit, order_by, offset, distinct_on, ...where } = exp;
    return { limit, order_by, offset, distinct_on, where: this.serializeWhere(where, env) };
  }

  pathToWhere(start: DeepClientStartItem, ...path: DeepClientPathItem[]): any {
    const pckg = { type_id: GLOBAL_ID_PACKAGE, value: start };
    let where: any = pckg;
    for (let p = 0; p < path.length; p++) {
      const item = path[p];
      const nextWhere = { in: { type_id: GLOBAL_ID_CONTAIN, value: item, from: where } };
      where = nextWhere;
    }
    return where;
  }

  async id(start: DeepClientStartItem, ...path: DeepClientPathItem[]): Promise<number> {
    const q = await this.select(this.pathToWhere(start, ...path));
    if (q.error) throw q.error;
    // @ts-ignore
    const result = (q?.data?.[0]?.id | _ids?.[start]?.[path?.[0]] | 0);
    return result;
  };
}

const _ids = {
  '@deep-foundation/core': {
    'Contain': GLOBAL_ID_CONTAIN,
    'Package': GLOBAL_ID_PACKAGE,
    'PackageActive': GLOBAL_ID_PACKAGE_ACTIVE,
    'PackageVersion': GLOBAL_ID_PACKAGE_VERSION,
    'Promise': GLOBAL_ID_PROMISE,
    'Then': GLOBAL_ID_THEN,
    'Resolved': GLOBAL_ID_RESOLVED,
    'Rejected': GLOBAL_ID_REJECTED,
  },
};

export function useDeep(apolloClientProps?: ApolloClient<any>) {
  const apolloClientHook = useApolloClient();
  const apolloClient = apolloClientProps || apolloClientHook;
  const deep = useMemo(() => {
    return new DeepClient({ apolloClient });
  }, [apolloClient]);
  return deep;
}
