import atob from 'atob';
import { ApolloClient, ApolloError, ApolloQueryResult, useApolloClient, gql, useQuery, useSubscription } from "@apollo/client";
import { generateApolloClient, IApolloClient } from "@deep-foundation/hasura/client";
import { useLocalStore } from "@deep-foundation/store/local";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deprecate, inherits } from "util";
import { deleteMutation, generateQuery, generateQueryData, generateSerial, insertMutation, updateMutation } from "./gql";
import { Link, minilinks, MinilinksInstance, MinilinksResult } from "./minilinks";
import { awaitPromise } from "./promise";
import { useTokenController } from "./react-token";
import { reserve } from "./reserve";
import Debug from 'debug';
import { corePckg } from './core';
import { BoolExpCan, BoolExpHandler, BoolExpLink, BoolExpSelector, BoolExpTree, BoolExpValue, MutationInputLink, MutationInputLinkPlain, MutationInputValue } from './client_types';

const debug = Debug('deeplinks:client');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const corePckgIds: { [key: string]: number; } = {};
corePckg.data.filter(l => !!l.type).forEach((l, i) => {
  corePckgIds[l.id] = i+1;
});

export const _ids = {
  '@deep-foundation/core': corePckgIds,
};

// https://stackoverflow.com/a/38552302/4448999
export function parseJwt (token): { userId: number; role: string; roles: string[], [key: string]: any; } {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  const parsed = JSON.parse(jsonPayload);
  const { 'x-hasura-allowed-roles': roles, 'x-hasura-default-role': role, 'x-hasura-user-id': userId, ...other } = parsed['https://hasura.io/jwt/claims'] || {};
  return {
    userId: +userId, role, roles,
    ...other,
  };
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

  select<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: (
    Table extends 'numbers' ? BoolExpValue<number> :
    Table extends 'strings' ? BoolExpValue<string> :
    Table extends 'objects' ? BoolExpValue<object> :
    Table extends 'can' ? BoolExpCan :
    Table extends 'selectors' ? BoolExpSelector :
    Table extends 'tree' ? BoolExpTree :
    Table extends 'handlers' ? BoolExpHandler :
    BoolExpLink
  ) | number | number[], options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
  }): Promise<DeepClientResult<LL[]>>;

  insert<Table extends 'links'|'numbers'|'strings'|'objects', LL = L>(objects: (
    Table extends 'numbers' ? MutationInputValue<number> :
    Table extends 'strings' ? MutationInputValue<string> :
    Table extends 'objects' ? MutationInputValue<any> :
    MutationInputLink
  ), options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>>;

  update<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers'>(exp: (
    Table extends 'numbers' ? BoolExpValue<number> :
    Table extends 'strings' ? BoolExpValue<string> :
    Table extends 'objects' ? BoolExpValue<object> :
    Table extends 'can' ? BoolExpCan :
    Table extends 'selectors' ? BoolExpSelector :
    Table extends 'tree' ? BoolExpTree :
    Table extends 'handlers' ? BoolExpHandler :
    BoolExpLink
  ) | number | number[], value: (
    Table extends 'numbers' ? MutationInputValue<number> :
    Table extends 'strings' ? MutationInputValue<string> :
    Table extends 'objects' ? MutationInputValue<any> :
    MutationInputLinkPlain
  ), options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>>;

  delete<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers'>(exp: (
    Table extends 'numbers' ? BoolExpValue<number> :
    Table extends 'strings' ? BoolExpValue<string> :
    Table extends 'objects' ? BoolExpValue<object> :
    Table extends 'can' ? BoolExpCan :
    Table extends 'selectors' ? BoolExpSelector :
    Table extends 'tree' ? BoolExpTree :
    Table extends 'handlers' ? BoolExpHandler :
    BoolExpLink
  ) | number | number[], options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>>;

  reserve<LL = L>(count: number): Promise<number[]>;

  await(id: number): Promise<boolean>;

  serializeWhere(exp: any, env?: string): any;
  serializeQuery(exp: any, env?: string): any;

  id(start: DeepClientStartItem | BoolExpLink, ...path: DeepClientPathItem[]): Promise<number>;
  idSync(start: DeepClientStartItem, ...path: DeepClientPathItem[]): number;

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

  async select<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: (
    Table extends 'numbers' ? BoolExpValue<number> :
    Table extends 'strings' ? BoolExpValue<string> :
    Table extends 'objects' ? BoolExpValue<object> :
    Table extends 'can' ? BoolExpCan :
    Table extends 'selectors' ? BoolExpSelector :
    Table extends 'tree' ? BoolExpTree :
    Table extends 'handlers' ? BoolExpHandler :
    BoolExpLink
  ) | number | number[], options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
  }): Promise<DeepClientResult<LL[]>> {
    if (!exp) {
      return { error: { message: '!exp' }, data: undefined, loading: false, networkStatus: undefined };
    }
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : this.serializeWhere(exp, options?.table || 'links') : { id: { _eq: exp } };
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
            limit: where?.limit,
            ...variables,
            where,
          } }),
      ],
      name: name,
    }));

    // @ts-ignore
    return { ...q, data: (q)?.data?.q0 };
  };

  async insert<Table extends 'links'|'numbers'|'strings'|'objects', LL = L>(objects: (
    Table extends 'numbers' ? MutationInputValue<number> :
    Table extends 'strings' ? MutationInputValue<string> :
    Table extends 'objects' ? MutationInputValue<any> :
    MutationInputLink
  ), options?: {
    table?: Table;
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

  async update<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers'>(exp: (
    Table extends 'numbers' ? BoolExpValue<number> :
    Table extends 'strings' ? BoolExpValue<string> :
    Table extends 'objects' ? BoolExpValue<object> :
    Table extends 'can' ? BoolExpCan :
    Table extends 'selectors' ? BoolExpSelector :
    Table extends 'tree' ? BoolExpTree :
    Table extends 'handlers' ? BoolExpHandler :
    BoolExpLink
  ) | number | number[], value: (
    Table extends 'numbers' ? MutationInputValue<number> :
    Table extends 'strings' ? MutationInputValue<string> :
    Table extends 'objects' ? MutationInputValue<any> :
    MutationInputLinkPlain
  ), options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
    silent?: boolean;
  }):Promise<DeepClientResult<{ id }[]>> {
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : this.serializeWhere(exp, options?.table === this.table || !options?.table ? 'links' : 'value') : { id: { _eq: exp } };
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

  async delete<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers'>(exp: (
    Table extends 'numbers' ? BoolExpValue<number> :
    Table extends 'strings' ? BoolExpValue<string> :
    Table extends 'objects' ? BoolExpValue<object> :
    Table extends 'can' ? BoolExpCan :
    Table extends 'selectors' ? BoolExpSelector :
    Table extends 'tree' ? BoolExpTree :
    Table extends 'handlers' ? BoolExpHandler :
    BoolExpLink
  ) | number | number[], options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
    silent?: boolean;
  }):Promise<DeepClientResult<{ id }[]>> {
    if (!exp) throw new Error('!exp');
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : this.serializeWhere(exp, options?.table === this.table || !options?.table ? 'links' : 'value') : { id: { _eq: exp } };
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
    links: {
      value: 'value',
      relations: {
        from: 'links',
        to: 'links',
        type: 'links',
        in: 'links',
        out: 'links',
        typed: 'links',
        selected: 'selector',
        selectors: 'selector',
        string: 'value',
        number: 'value',
        object: 'value',
        can_rule: 'can',
        can_action: 'can',
        can_object: 'can',
        can_subject: 'can',
        down: 'tree',
        up: 'tree',
        tree: 'tree',
        root: 'tree',
      },
    },
    selector: {
      relations: {
        item: 'links',
        selector: 'links',
        query: 'links',
      }
    },
    can: {
      relations: {
        rule: 'links',
        action: 'links',
        object: 'links',
        subject: 'links',
      }
    },
    tree: {
      relations: {
        link: 'links',
        tree: 'links',
        root: 'links',
        parent: 'links',
        by_link: 'tree',
        by_tree: 'tree',
        by_root: 'tree',
        by_parent: 'tree',
        by_position: 'tree',
      }
    },
    value: {
      relations: {
        link: 'links',
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
  serializeWhere(exp: any, env: string = 'links'): any {
    // if exp is array - map
    if (Object.prototype.toString.call(exp) === '[object Array]') return exp.map((e) => this.serializeWhere(e, env));
    else if (typeof(exp) === 'object') {
      // if object
      const keys = Object.keys(exp);
      const result: any = {};
      // map keys
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const type = typeof(exp[key]);
        let setted: any = false;
        const is_id_field = !!~['type_id', 'from_id', 'to_id'].indexOf(key);
        // if this is link
        if (env === 'links') {
          // if field contain primitive type - string/number
          if (type === 'string' || type === 'number') {
            if (key === 'value' || key === type) {
              // if field id link.value
              setted = result[type] = { value: { _eq: exp[key] } };
            } else {
              // else just equal
              setted = result[key] = { _eq: exp[key] };
            }
          } else if (!this._boolExpFields[key] && Object.prototype.toString.call(exp[key]) === '[object Array]') {
            // if field is not boolExp (_and _or _not) but contain array
            // @ts-ignore
            setted = result[key] = this.serializeWhere(this.pathToWhere(...exp[key]));
          }
        } else if (env === 'value') {
          // if this is value
          if (type === 'string' || type === 'number') {
            setted = result[key] = { _eq: exp[key] };
          }
        }
        if (type === 'object' && exp[key].hasOwnProperty('_type_of') && (
          (env === 'links' && (is_id_field || key === 'id')) ||
          (env === 'selector' && key === 'item_id') ||
          (env === 'can' && !!~['rule_id', 'action_id', 'subject_id', 'object_id',].indexOf(key)) ||
          (env === 'tree' && !!~['link_id', 'tree_id', 'root_id', 'parent_id'].indexOf(key)) ||
          (env === 'value' && key === 'link_id')
        )) {
          // if field is object, and contain _type_od
          const _temp = setted = { _by_item: { path_item_id: { _eq: exp[key]._type_of }, group_id: { _eq: 0 } } };
          if (key === 'id') {
            result._and = result._and ? [...result._and, _temp] : [_temp];
          } else {
            result[key.slice(0, -3)] = _temp;
          }
        } else if (type === 'object' && exp[key].hasOwnProperty('_id') && (
          (env === 'links' && (is_id_field || key === 'id')) ||
          (env === 'selector' && key === 'item_id') ||
          (env === 'can' && !!~['rule_id', 'action_id', 'subject_id', 'object_id',].indexOf(key)) ||
          (env === 'tree' && !!~['link_id', 'tree_id', 'root_id', 'parent_id'].indexOf(key)) ||
          (env === 'value' && key === 'link_id')
        ) && Object.prototype.toString.call(exp[key]._id) === '[object Array]' && exp[key]._id.length >= 1) {
          // if field is object, and contain _type_od
          const _temp = setted = this.serializeWhere(this.pathToWhere(exp[key]._id[0], ...exp[key]._id.slice(1)), 'links');
          if (key === 'id') {
            result._and = result._and ? [...result._and, _temp] : [_temp];
          } else {
            result[key.slice(0, -3)] = _temp;
          }
        }
        // if not expected
        if (!setted) {
          const _temp = (
            // if _and _or _not
            this._boolExpFields[key]
          ) ? (
            // just parse each item in array
            this.serializeWhere(exp[key], env)
           ) : (
            // if we know context
            this._serialize?.[env]?.relations?.[key]
          ) ? (
            // go to this context then
            this.serializeWhere(exp[key], this._serialize?.[env]?.relations?.[key])
          ) : (
            // else just stop
            exp[key]
          );
          if (key === '_and') result._and ? result._and.push(..._temp) : result._and = _temp;
          else result[key] = _temp;
        }
      }
      return result;
    } else {
      if (typeof(exp) === 'undefined') throw new Error('undefined in query');
      return exp;
    }
  };

  serializeQuery(exp: any, env: string = 'links'): any {
    const { limit, order_by, offset, distinct_on, ...where } = exp;
    return { limit, order_by, offset, distinct_on, where: this.serializeWhere(where, env) };
  }

  pathToWhere(start: (DeepClientStartItem), ...path: DeepClientPathItem[]): any {
    const pckg = typeof(start) === 'string' ? { type_id: _ids?.['@deep-foundation/core']?.Package, value: start } : { id: start };
    let where: any = pckg;
    for (let p = 0; p < path.length; p++) {
      const item = path[p];
      if (typeof(item) !== 'boolean') {
        const nextWhere = { in: { type_id: _ids?.['@deep-foundation/core']?.Contain, value: item, from: where } };
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
  async id(start: DeepClientStartItem | BoolExpLink, ...path: DeepClientPathItem[]): Promise<number> {
    if (typeof(start) === 'object') {
      return ((await this.select(start)) as any)?.data?.[0]?.id;
    }
    if (_ids?.[start]?.[path[0]]) {
      return _ids[start][path[0]];
    }
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

  idSync(start: DeepClientStartItem, ...path: DeepClientPathItem[]): number {
    if (_ids?.[start]?.[path[0]]) {
      return _ids[start][path[0]];
    }
    throw new Error(`Id not found by [${JSON.stringify([start, ...path])}]`);
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
        const linkId = decoded?.userId;
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
      return { linkId, token, error: error ? error : (!linkId) ? 'unexepted' : undefined };
    } else return { error: `linkId or token must be provided` };
  };

  /**
   * Return is of current authorized user linkId.
   * Refill client.linkId and return.
   */
  async whoami(): Promise<number | undefined> {
    const result = await this.apolloClient.query({ query: WHOISME });
    this.linkId = result?.data?.jwt?.linkId;
    return result?.data?.jwt?.linkId;
  }

  async login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult> {
    return await this.jwt({ ...options, relogin: true });
  };

  async logout(): Promise<DeepClientAuthResult> {
    if (this?.handleAuth) setTimeout(() => this?.handleAuth(0, ''), 0);
    return { linkId: 0, token: '' };
  };

  async can(objectIds: null | number | number[], subjectIds: null | number | number[], actionIds: null | number | number[], userIds: number | number[] = this.linkId) {
    const where: any = {
    };
    if (objectIds) where.object_id = typeof(objectIds) === 'number' ? { _eq: +objectIds } : { _in: objectIds };
    if (subjectIds) where.subject_id = typeof(subjectIds) === 'number' ? { _eq: +subjectIds } : { _in: subjectIds };
    if (actionIds) where.action_id = typeof(actionIds) === 'number' ? { _eq: +actionIds } : { _in: actionIds };
    const result = await this.select(where, { table: 'can', returning: 'rule_id' });
    return !!result?.data?.length;
  }
}

export const JWT = gql`query JWT($linkId: Int) {
  jwt(input: {linkId: $linkId}) {
    linkId
    token
  }
}`;

export const WHOISME = gql`query WHOISME {
  jwt(input: {}) {
    linkId
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

export const DeepContext = createContext<DeepClient>(undefined);

export function useDeepGenerator(apolloClientProps?: IApolloClient<any>) {
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

export function DeepProvider({
  apolloClient: apolloClientProps,
  children,
}: {
  apolloClient?: IApolloClient<any>,
  children: any;
}) {
  const deep = useDeepGenerator(apolloClientProps);
  return <DeepContext.Provider value={deep}>
    {children}
  </DeepContext.Provider>;
}

export function useDeep() {
  return useContext(DeepContext);
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
        ...options,
        variables: { ...sq, ...options?.variables }
      })],
      name: options?.name || 'USE_DEEP_QUERY',
    });
  }, [query, options]);
  const result = useQuery(wq.query, { variables: wq?.variables });
  return {
    ...result,
    data: result?.data?.q0,
  };
}

export function useDeepSubscription(query: any, options?: any): any {
  const deep = useDeep();
  const wq = useMemo(() => {
    const sq = deep.serializeQuery(query);
    return generateQuery({
      operation: 'subscription',
      queries: [generateQueryData({
        tableName: 'links',
        returning: `
          id type_id from_id to_id value
          string { id value }
          number { id value }
          object { id value }
        `,
        ...options,
        variables: { ...sq, ...options?.variables }
      })],
      name: options?.name || 'USE_DEEP_SUBSCRIPTION',
    });
  }, [query, options]);
  const result = useSubscription(wq.query, { variables: wq?.variables });
  return {
    ...result,
    data: result?.data?.q0,
  };
}
