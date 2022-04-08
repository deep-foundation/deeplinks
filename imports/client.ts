import { ApolloClient, ApolloError, ApolloQueryResult, useApolloClient, gql, useQuery } from "@apollo/client";
import { generateApolloClient, IApolloClient } from "@deep-foundation/hasura/client";
import { useLocalStore } from "@deep-foundation/store/local";
import { useMemo } from "react";
import { deprecate, inherits } from "util";
import { deleteMutation, generateQuery, generateQueryData, generateSerial, insertMutation, updateMutation } from "./gql";
import { Link, minilinks, MinilinksInstance, MinilinksResult } from "./minilinks";
import { awaitPromise } from "./promise";
import { useTokenController } from "./react-token";
import { reserve } from "./reserve";
import Debug from 'debug';

const debug = Debug('deeplinks:client');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

export const ALLOWED_IDS = [5];
export const DENIED_IDS = [0, 10, 11, 12, 13];
export const GLOBAL_ID_PACKAGE=2;
export const GLOBAL_ID_CONTAIN=3;
export const GLOBAL_ID_STRING=5;
export const GLOBAL_ID_NUMBER=6;
export const GLOBAL_ID_OBJECT=7;
export const GLOBAL_ID_ANY=8;
export const GLOBAL_ID_PROMISE=9;
export const GLOBAL_ID_THEN=10;
export const GLOBAL_ID_RESOLVED=11;
export const GLOBAL_ID_REJECTED=12;
export const GLOBAL_ID_TREE=36;
export const GLOBAL_ID_INCLUDE_DOWN=37;
export const GLOBAL_ID_INCLUDE_UP=38;
export const GLOBAL_ID_INCLUDE_NODE=39;
export const GLOBAL_ID_CONTAIN_TREE=40;
export const GLOBAL_ID_PACKAGE_NAMESPACE=43;
export const GLOBAL_ID_PACKAGE_ACTIVE=45;
export const GLOBAL_ID_PACKAGE_VERSION=46;
export const GLOBAL_ID_HANDLE_UPDATE=50;
export const GLOBAL_ID_SELECTOR_FILTER=75;

const _ids = {
  '@deep-foundation/core': {
    'Contain': GLOBAL_ID_CONTAIN,
    'containTree': GLOBAL_ID_CONTAIN_TREE,
    'Package': GLOBAL_ID_PACKAGE,
    'PackageActive': GLOBAL_ID_PACKAGE_ACTIVE,
    'PackageVersion': GLOBAL_ID_PACKAGE_VERSION,
    'PackageNamespace': GLOBAL_ID_PACKAGE_NAMESPACE,
    'Promise': GLOBAL_ID_PROMISE,
    'Then': GLOBAL_ID_THEN,
    'Resolved': GLOBAL_ID_RESOLVED,
    'Rejected': GLOBAL_ID_REJECTED,
    'HandleUpdate': GLOBAL_ID_HANDLE_UPDATE,
  },
};

// https://stackoverflow.com/a/38552302/4448999
export function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};
export interface DeepClientOptions<L = Link<number>> {
  linkId?: number;
  token?: string;
  handleAuth?: (linkId?: number, token?: string) => any;

  deep?: DeepClientInstance<L>;

  apolloClient?: IApolloClient<any>;
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

  silent?: boolean;
}

export interface DeepClientResult<R> extends ApolloQueryResult<R> {
  error?: any;
}

export type DeepClientPackageSelector = string;
export type DeepClientPackageContain = string;
export type DeepClientLinkId = number;
// export type DeepClientBoolExp = number;
export type DeepClientStartItem = DeepClientPackageSelector | DeepClientLinkId;
export type DeepClientPathItem = DeepClientPackageContain | boolean;

export interface DeepClientInstance<L = Link<number>> {
  linkId?: number;
  token?: string;
  handleAuth?: (linkId?: number, token?: string) => any;

  deep: DeepClientInstance<L>;

  apolloClient?: IApolloClient<any>;
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

  guest(options: DeepClientGuestOptions): Promise<DeepClientAuthResult>;

  jwt(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;

  login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;

  logout(): Promise<DeepClientAuthResult>;

  can(objectIds: number[], subjectIds: number[], actionIds: number[]): Promise<boolean>;
}

export interface DeepClientAuthResult {
  linkId?: number;
  token?: string;
  error?: any;
}

export interface DeepClientGuestOptions {
  relogin?: boolean;
}

export interface DeepClientJWTOptions {
  linkId?: number;
  token?: string;
  relogin?: boolean;
}

export class DeepClient<L = Link<number>> implements DeepClientInstance<L> {
  linkId?: number;
  token?: string;
  handleAuth?: (linkId?: number, token?: string) => any;

  deep: DeepClientInstance<L>;

  apolloClient?: IApolloClient<any>;
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

  silent: boolean;
  _silent(options: Partial<{ silent?: boolean }> = {}): boolean {
    return typeof(options.silent) === 'boolean' ? options.silent : this.silent;
  }

  constructor(options: DeepClientOptions<L>) {
    this.deep = options.deep;
    if (!this.apolloClient) this.apolloClient = options.apolloClient;

    if (!this.deep && !options.apolloClient) throw new Error('options.apolloClient or options.deep is required');

    if (this.deep && !this.apolloClient && !options.apolloClient && options.token) {
      this.apolloClient = generateApolloClient({
        // @ts-ignore
        path: this.deep.apolloClient?.path,
        // @ts-ignore
        ssl: this.deep.apolloClient?.ssl,
        token: options.token,
      });
    }

    if (!this.apolloClient) throw new Error('apolloClient is invalid');

    // @ts-ignore
    this.minilinks = options.minilinks || minilinks([]);
    this.table = options.table || 'links';

    this.linkId = options.linkId;
    this.token = options.token;
    this.handleAuth = options?.handleAuth || options?.deep?.handleAuth;

    this.selectReturning = options.selectReturning || 'id type_id from_id to_id value';
    this.insertReturning = options.insertReturning || 'id';
    this.updateReturning = options.updateReturning || 'id';
    this.deleteReturning = options.deleteReturning || 'id';

    this.defaultSelectName = options.defaultSelectName || 'SELECT';
    this.defaultInsertName = options.defaultInsertName || 'INSERT';
    this.defaultUpdateName = options.defaultUpdateName || 'UPDATE';
    this.defaultDeleteName = options.defaultDeleteName || 'DELETE';
    
    this.silent = options.silent || false;
  }

  stringify(any?: any): string {
    if (typeof(any) === 'string') {
      let json;
      try { json = JSON.parse(any); } catch(e) {}
      return json ? JSON.stringify(json, null, 2) : any.toString();
    } else if (typeof(any) === 'object') {
      return JSON.stringify(any, null, 2);
    }
    return any;
  }

  async select<LL = L>(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }): Promise<DeepClientResult<LL[]>> {
    if (!exp) {
      return { error: { message: '!exp' }, data: undefined, loading: false, networkStatus: undefined };
    }
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
    silent?: boolean;
  }):Promise<DeepClientResult<{ id }[]>> {
    const _objects = Object.prototype.toString.call(objects) === '[object Array]' ? objects : [objects];
    const table = options?.table || this.table;
    const returning = options?.returning || this.insertReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultInsertName;
    let q: any = {};
    try {
      q = await this.apolloClient.mutate(generateSerial({
        actions: [insertMutation(table, { ...variables, objects: objects }, { tableName: table, operation: 'insert', returning })],
        name: name,
      }));
    } catch(e) {
      const sqlError = e?.graphQLErrors?.[0]?.extensions?.internal?.error;
      if (sqlError?.message) e.message = sqlError.message;
      if (!this._silent(options)) throw e;
      return { ...q, data: (q)?.data?.m0?.returning, error: e };
    }
    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  async update(exp: any, value: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
    silent?: boolean;
  }):Promise<DeepClientResult<{ id }[]>> {
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : this.serializeWhere(exp, options?.table === this.table || !options?.table ? 'link' : 'value') : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || this.updateReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultUpdateName;
    let q;
    try {
      q = await this.apolloClient.mutate(generateSerial({
        actions: [updateMutation(table, { ...variables, where, _set: value }, { tableName: table, operation: 'update', returning })],
        name: name,
      }));
    } catch(e) {
      const sqlError = e?.graphQLErrors?.[0]?.extensions?.internal?.error;
      if (sqlError?.message) e.message = sqlError.message;
      if (!this._silent(options)) throw e;
      return { ...q, data: (q)?.data?.m0?.returning, error: e };
    }
    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  async delete(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
    silent?: boolean;
  }):Promise<DeepClientResult<{ returning: { id }[] }>> {
    if (!exp) throw new Error('!exp');
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : this.serializeWhere(exp, options?.table === this.table || !options?.table ? 'link' : 'value') : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || this.deleteReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultDeleteName;
    let q;
    try {
      q = await this.apolloClient.mutate(generateSerial({
        actions: [deleteMutation(table, { ...variables, where, returning }, { tableName: table, operation: 'delete', returning })],
        name: name,
      }));
      // @ts-ignore
    } catch(e) {
      const sqlError = e?.graphQLErrors?.[0]?.extensions?.internal?.error;
      if (sqlError?.message) e.message = sqlError.message;
      if (!this._silent(options)) throw e;
      return { ...q, data: (q)?.data?.m0?.returning, error: e };
    }
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  reserve<LL = L>(count: number): Promise<number[]> {
    return reserve({ count, client: this.apolloClient });
  };

  async await(id: number, options: { results: boolean } = { results: false } ): Promise<any> {
    return awaitPromise({
      id, client: this.apolloClient,
      Then: await this.id('@deep-foundation/core', 'Then'),
      Promise: await this.id('@deep-foundation/core', 'Promise'),
      Resolved: await this.id('@deep-foundation/core', 'Resolved'),
      Rejected: await this.id('@deep-foundation/core', 'Rejected'),
      Results: options.results
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
    } else {
      if (typeof(exp) === 'undefined') throw new Error('undefined in query');
      return exp;
    }
  };

  serializeQuery(exp: any, env: string = 'link'): any {
    const { limit, order_by, offset, distinct_on, ...where } = exp;
    return { limit, order_by, offset, distinct_on, where: this.serializeWhere(where, env) };
  }

  pathToWhere(start: DeepClientStartItem, ...path: DeepClientPathItem[]): any {
    const pckg = typeof(start) === 'string' ? { type_id: GLOBAL_ID_PACKAGE, value: start } : { id: start };
    let where: any = pckg;
    for (let p = 0; p < path.length; p++) {
      const item = path[p];
      if (typeof(item) !== 'boolean') {
        const nextWhere = { in: { type_id: GLOBAL_ID_CONTAIN, value: item, from: where } };
        where = nextWhere;
      }
    }
    return where;
  }

  /**
   * Find id of link by packageName/id as first argument, and Contain value (name) as path items.
   * @description Thows error if id not founded. You can set last argument true, for disable throwing error.
   * @returns number
   */
  async id(start: DeepClientStartItem, ...path: DeepClientPathItem[]): Promise<number> {
    const q = await this.select(this.pathToWhere(start, ...path));
    if (q.error) {
      throw q.error;
    }
    // @ts-ignore
    const result = (q?.data?.[0]?.id | _ids?.[start]?.[path?.[0]] | 0);
    if (!result && path[path.length - 1] !== true) {
      throw new Error(`Id not found by [${JSON.stringify([start, ...path])}]`);
    }
    return result;
  };

  async guest(options: DeepClientGuestOptions = {}): Promise<DeepClientAuthResult> {
    const relogin = typeof(options.relogin) === 'boolean' ? options.relogin : true;
    const result = await this.apolloClient.query({ query: GUEST });
    const { linkId, token, error } = result?.data?.guest || {};
    if (!error && !!token && relogin) {
      if (this?.handleAuth) setTimeout(() => this?.handleAuth(+linkId, token), 0);
    }
    return { linkId, token, error: !error && (!linkId || !token) ? 'unexepted' : error };
  };

  async jwt(options: DeepClientJWTOptions): Promise<DeepClientAuthResult> {
    const relogin = typeof(options.relogin) === 'boolean' ? options.relogin : false;
    if (options?.token) {
      try {
        const token = options?.token;
        const decoded = parseJwt(token);
        const linkId = decoded?.[`https://hasura.io/jwt/claims`]?.['x-hasura-user-id'];
        if (!!token && relogin) {
          if (this?.handleAuth) setTimeout(() => this?.handleAuth(+linkId, token), 0);
        }
        return { linkId, token, error: (!linkId || !token) ? 'unexepted' : undefined };
      } catch(e) {
        return { error: e };
      }
    } else if (options?.linkId) {
      const result = await this.apolloClient.query({ query: JWT, variables: { linkId: +options.linkId } });
      const { linkId, token, error } = result?.data?.jwt || {};
      if (!error && !!token && relogin) {
        if (this?.handleAuth) setTimeout(() => this?.handleAuth(+linkId, token), 0);
      }
      return { linkId, token, error: !error && (!linkId || !token) ? 'unexepted' : error };
    } else return { error: `linkId or token must be provided` };
  };

  async login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult> {
    return await this.jwt({ ...options, relogin: true });
  };

  async logout(): Promise<DeepClientAuthResult> {
    if (this?.handleAuth) setTimeout(() => this?.handleAuth(0, ''), 0);
    return { linkId: 0, token: '' };
  };

  async can(objectIds: number | number[], subjectIds: number | number[], actionIds: number | number[]) {
    const result = await this.select({
      object_id: typeof(objectIds) === 'number' ? { _eq: +objectIds } : { _in: objectIds },
      subject_id: typeof(subjectIds) === 'number' ? { _eq: +subjectIds } : { _in: subjectIds },
      action_id: typeof(actionIds) === 'number' ? { _eq: +actionIds } : { _in: actionIds },
    }, { table: 'can', returning: 'rule_id' });
    return !!result?.data?.length;
  }
}

export const JWT = gql`query JWT($linkId: Int) {
  jwt(input: {linkId: $linkId}) {
    linkId
    token
  }
}`;

export const GUEST = gql`query GUEST {
  guest {
    linkId
    token
  }
}`;

export function useAuthNode() {
  return useLocalStore('use_auth_link_id', 0);
}

export function useDeep(apolloClientProps?: IApolloClient<any>) {
  const apolloClientHook = useApolloClient();
  const apolloClient: IApolloClient<any> = apolloClientProps || apolloClientHook;

  const [linkId, setLinkId] = useAuthNode();
  const [token, setToken] = useTokenController();

  const deep = useMemo(() => {
    if (!apolloClient?.jwt_token) {
      log({ token, apolloClient });
    }
    return new DeepClient({
      apolloClient, linkId, token,
      handleAuth: (linkId, token) => {
        setToken(token);
        setLinkId(linkId);
      },
    });
  }, [apolloClient]);
  return deep;
}

export function useDeepQuery(query: any, options?: any): any {
  const deep = useDeep();
  const wq = useMemo(() => {
    const sq = deep.serializeQuery(query);
    return generateQuery({
      operation: 'query',
      queries: [generateQueryData({
        tableName: 'links',
        returning: `
          id type_id from_id to_id value
          string { id value }
          number { id value }
          object { id value }
        `,
        variables: { ...sq, ...options?.variables }
      })],
      name: options?.name || 'USE_DEEP_QUERY',
    });
  }, []);
  return useQuery(wq.query, { variables: wq?.variables });
}
