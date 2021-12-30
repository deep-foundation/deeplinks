import { ApolloClient, ApolloError, ApolloQueryResult, useApolloClient, gql, useQuery } from "@apollo/client";
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { useLocalStore } from "@deep-foundation/store/local";
import { useMemo } from "react";
import { deprecate, inherits } from "util";
import { deleteMutation, generateQuery, generateQueryData, generateSerial, insertMutation, updateMutation } from "./gql";
import { Link, minilinks, MinilinksInstance, MinilinksResult } from "./minilinks";
import { awaitPromise } from "./promise";
import { useTokenController } from "./react-token";
import { reserve } from "./reserve";

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
export const GLOBAL_ID_ADMIN=24;
export const GLOBAL_ID_TREE=33;
export const GLOBAL_ID_INCLUDE_DOWN=34;
export const GLOBAL_ID_INCLUDE_UP=35;
export const GLOBAL_ID_INCLUDE_NODE=36;
export const GLOBAL_ID_PACKAGE_NAMESPACE=40;
export const GLOBAL_ID_PACKAGE_ACTIVE=42;
export const GLOBAL_ID_PACKAGE_VERSION=43;

export interface DeepClientOptions<L = Link<number>> {
  linkId?: number;
  token?: string;
  handleAuth?: (linkId?: number, token?: string) => any;

  deep?: DeepClientInstance<L>;
  auth?: DeepClientAuthResult;

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
}

export interface DeepClientResult<R> extends ApolloQueryResult<R> {
  error?: ApolloError;
}

export type DeepClientPackageSelector = string;
export type DeepClientPackageContain = string;
export type DeepClientLinkId = number;
// export type DeepClientBoolExp = number;
export type DeepClientStartItem = DeepClientPackageSelector | DeepClientLinkId;
export type DeepClientPathItem = DeepClientPackageContain;

export interface DeepClientInstance<L = Link<number>> {
  linkId?: number;
  token?: string;
  handleAuth?: (linkId?: number, token?: string) => any;

  deep: DeepClientInstance<L>;

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

  guest(options: DeepClientGuestOptions): Promise<DeepClientAuthResult>;

  jwt(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;

  login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;

  logout(): Promise<DeepClientAuthResult>;
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
  relogin?: boolean;
}

export class DeepClient<L = Link<number>> implements DeepClientInstance<L> {
  linkId?: number;
  token?: string;
  handleAuth?: (linkId?: number, token?: string) => any;

  deep: DeepClientInstance<L>;

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

    this.deep = options.deep;

    if (options.deep && options.auth) {
      this.apolloClient = generateApolloClient({
        path: `${process.env.HASURA_PATH}/v1/graphql`,
        ssl: !!+process.env.HASURA_SSL,
        token: options.auth.token,
      });
    }

    // @ts-ignore
    this.minilinks = options.minilinks || minilinks([]);
    if (!this.apolloClient) this.apolloClient = options.apolloClient;
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
  }

  stringify(any?: any): string {
    if (typeof(any) === 'string') {
      let json;
      try { json = JSON.parse(any); } catch(error) {}
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
    let q;
    try {
      q = await this.apolloClient.mutate(generateSerial({
        actions: [insertMutation(table, { ...variables, objects: objects }, { tableName: table, operation: 'insert', returning })],
        name: name,
      }));
    } catch(error) {
      const sqlError = error?.graphQLErrors?.[0]?.extensions?.internal?.error;
      if (sqlError?.message) error.message = sqlError.message;
      if (!options?.silent) throw error;
      return { ...q, data: (q)?.data?.m0?.returning, error };
    }
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

  async guest(options: DeepClientGuestOptions): Promise<DeepClientAuthResult> {
    const result = await this.apolloClient.query({ query: GUEST });
    const { linkId, token, error } = result?.data?.guest;
    if (!error && !!token && typeof(options.relogin) === 'boolean' ? options.relogin : true) {
      if (this?.handleAuth) this?.handleAuth(linkId, token);
    }
    return { linkId, token, error };
  };

  async jwt(options: DeepClientJWTOptions): Promise<DeepClientAuthResult> {
    const result = await this.apolloClient.query({ query: JWT, variables: { linkId: +options.linkId } });
    const { linkId, token, error } = result?.data?.guest || {};
    if (!error && !!token && typeof(options.relogin) === 'boolean' ? options.relogin : true) {
      if (this?.handleAuth) this?.handleAuth(linkId, token);
    }
    return { linkId, token, error };
  };

  async login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult> {
    return await this.jwt({ ...options, relogin: true });
  };

  async logout(): Promise<DeepClientAuthResult> {
    if (this?.handleAuth) this?.handleAuth(0, '');
    return { linkId: 0, token: '' };
  };
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

const _ids = {
  '@deep-foundation/core': {
    'Contain': GLOBAL_ID_CONTAIN,
    'Package': GLOBAL_ID_PACKAGE,
    'PackageActive': GLOBAL_ID_PACKAGE_ACTIVE,
    'PackageVersion': GLOBAL_ID_PACKAGE_VERSION,
    'PackageNamespace': GLOBAL_ID_PACKAGE_NAMESPACE,
    'Promise': GLOBAL_ID_PROMISE,
    'Then': GLOBAL_ID_THEN,
    'Resolved': GLOBAL_ID_RESOLVED,
    'Rejected': GLOBAL_ID_REJECTED,
  },
};

export function useAuthNode() {
  return useLocalStore('use_auth_link_id', 0);
}

export function useDeep(apolloClientProps?: ApolloClient<any>) {
  const apolloClientHook = useApolloClient();
  const apolloClient = apolloClientProps || apolloClientHook;

  const [linkId, setLinkId] = useAuthNode();
  const [token, setToken] = useTokenController();

  const deep = useMemo(() => {
    return new DeepClient({
      apolloClient, linkId, token,
      handleAuth: (linkId, token) => {
        setToken('');
        setLinkId(0);
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
