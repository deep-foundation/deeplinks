import atob from 'atob';
import { ApolloClient, ApolloError, ApolloQueryResult, useApolloClient, gql, useQuery, useSubscription } from "@apollo/client";
import { generateApolloClient, IApolloClient } from "@deep-foundation/hasura/client";
import { useLocalStore } from "@deep-foundation/store/local";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deprecate, inherits, inspect } from "util";
import { deleteMutation, generateMutation, generateQuery, generateQueryData, generateSerial, IGenerateMutationBuilder, IGenerateMutationOptions, insertMutation, updateMutation } from "./gql";
import { Link, MinilinkCollection, minilinks, MinilinksInstance, MinilinksResult, useMinilinksApply, useMinilinksQuery, useMinilinksSubscription } from "./minilinks";
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

export const _serialize = {
  links: {
    fields: {
      id: 'number',
      from_id: 'number',
      to_id: 'number',
      type_id: 'number',
    },
    relations: {
      from: 'links',
      to: 'links',
      type: 'links',
      in: 'links',
      out: 'links',
      typed: 'links',
      selected: 'selector',
      selectors: 'selector',
      value: 'value',
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
    fields: {
      item_id: 'number',
      selector_id: 'number',
      query_id: 'number',
      selector_include_id: 'number',
    },
    relations: {
      item: 'links',
      selector: 'links',
      query: 'links',
    }
  },
  can: {
    fields: {
      rule_id: 'number',
      action_id: 'number',
      object_id: 'number',
      subject_id: 'number',
    },
    relations: {
      rule: 'links',
      action: 'links',
      object: 'links',
      subject: 'links',
    }
  },
  tree: {
    fields: {
      id: 'number',
      link_id: 'number',
      tree_id: 'number',
      root_id: 'number',
      parent_id: 'number',
      depth: 'number',
      position_id: 'string',
    },
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
    fields: {
      id: 'number',
      link_id: 'number',
      value: 'value',
    },
    relations: {
      link: 'links',
    },
  },
};

export const _boolExpFields = {
  _and: true,
  _not: true,
  _or: true,
};

export const pathToWhere = (start: (DeepClientStartItem), ...path: DeepClientPathItem[]): any => {
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

export const serializeWhere = (exp: any, env: string = 'links'): any => {
  // if exp is array - map
  if (Object.prototype.toString.call(exp) === '[object Array]') return exp.map((e) => serializeWhere(e, env));
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
        } else if (!_boolExpFields[key] && Object.prototype.toString.call(exp[key]) === '[object Array]') {
          // if field is not boolExp (_and _or _not) but contain array
          // @ts-ignore
          setted = result[key] = serializeWhere(pathToWhere(...exp[key]));
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
        const _temp = setted = serializeWhere(pathToWhere(exp[key]._id[0], ...exp[key]._id.slice(1)), 'links');
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
          _boolExpFields[key]
        ) ? (
          // just parse each item in array
          serializeWhere(exp[key], env)
         ) : (
          // if we know context
          _serialize?.[env]?.relations?.[key]
        ) ? (
          // go to this context then
          serializeWhere(exp[key], _serialize?.[env]?.relations?.[key])
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

export const serializeQuery = (exp: any, env: string = 'links'): any => {
  const { limit, order_by, offset, distinct_on, ...where } = exp;
  const result: any = { where: serializeWhere(where, env) };
  if (limit) result.limit = limit;
  if (order_by) result.order_by = order_by;
  if (offset) result.offset = offset;
  if (distinct_on) result.distinct_on = distinct_on;
  return result;
}

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
  minilinks?: MinilinkCollection<any, Link<number>>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  linksSelectReturning?: string;
  valueSelectReturning?: string;
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

  apolloClient: IApolloClient<any>;
  minilinks: MinilinksResult<L>;
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
  ) | (
    Table extends 'numbers' ? MutationInputValue<number> :
    Table extends 'strings' ? MutationInputValue<string> :
    Table extends 'objects' ? MutationInputValue<any> :
    MutationInputLink
  )[] , options?: {
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
  idLocal(start: DeepClientStartItem, ...path: DeepClientPathItem[]): number;

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


export type SelectTable = 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers';
export type InsertTable = 'links' | 'numbers' | 'strings' | 'objects';
export type UpdateTable = 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers';
export type DeleteTable = 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers';

export type OperationType = 'select' | 'insert' | 'update' | 'delete';
export type SerialOperationType = 'insert' | 'update' | 'delete';
export type Table<TOperationType extends OperationType = OperationType> = TOperationType extends 'select'
  ? SelectTable
  : TOperationType extends 'insert'
  ? InsertTable
  : TOperationType extends 'update'
  ? UpdateTable
  : TOperationType extends 'delete'
  ? DeleteTable
  : never;

export type ValueForTable<TTable extends Table> = TTable extends 'numbers'
  ? MutationInputValue<number>
  : TTable extends 'strings'
  ? MutationInputValue<string>
  : TTable extends 'objects'
  ? MutationInputValue<any>
  : MutationInputLink;

export type ExpForTable<TTable extends Table> = TTable extends 'numbers'
  ? BoolExpValue<number>
  : TTable extends 'strings'
  ? BoolExpValue<string>
  : TTable extends 'objects'
  ? BoolExpValue<object>
  : TTable extends 'can'
  ? BoolExpCan
  : TTable extends 'selectors'
  ? BoolExpSelector
  : TTable extends 'tree'
  ? BoolExpTree
  : TTable extends 'handlers'
  ? BoolExpHandler
  : BoolExpLink;

export type SerialOperationDetails<
  TSerialOperationType extends SerialOperationType,
  TTable extends Table<TSerialOperationType>
> = TSerialOperationType extends 'insert'
  ? {
      objects: ValueForTable<TTable> | ValueForTable<TTable>[];
    }
  : TSerialOperationType extends 'update'
  ? {
      exp: ExpForTable<TTable> | number | number[];
      value: ValueForTable<TTable>;
    }
  : TSerialOperationType extends 'delete'
  ? {
      exp: ExpForTable<TTable> | number | number[];
    }
  : never;

export type SerialOperation<
  TSerialOperationType extends SerialOperationType = SerialOperationType,
  TTable extends Table<TSerialOperationType> = Table<TSerialOperationType>,
> = {
  type: TSerialOperationType;
  table: TTable;
} & SerialOperationDetails<TSerialOperationType, TTable>;

export type DeepSerialOperation = SerialOperation<SerialOperationType, Table<SerialOperationType>>

export type AsyncSerialParams = {
  operations: Array<DeepSerialOperation>;
  name?: string;
  returning?: string;
  silent?: boolean;
};

export class DeepClient<L = Link<number>> implements DeepClientInstance<L> {
  useDeepSubscription = useDeepSubscription;
  useDeepQuery = useDeepQuery;
  useMinilinksQuery = (query: BoolExpLink) => useMinilinksQuery(this.minilinks, query);
  useMinilinksSubscription = (query: BoolExpLink) => useMinilinksSubscription(this.minilinks, query)
  useDeep = useDeep;
  DeepProvider = DeepProvider;
  DeepContext = DeepContext;

  linkId?: number;
  token?: string;
  handleAuth?: (linkId?: number, token?: string) => any;

  deep: DeepClientInstance<L>;

  apolloClient: IApolloClient<any>;
  minilinks: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  linksSelectReturning?: string;
  valueSelectReturning?: string;
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
    this.minilinks = options.minilinks || new MinilinkCollection();
    this.table = options.table || 'links';

    this.linkId = options.linkId;
    this.token = options.token;
    this.handleAuth = options?.handleAuth || options?.deep?.handleAuth;

    this.selectReturning = options.selectReturning || 'id type_id from_id to_id value';
    this.linksSelectReturning = this.selectReturning;
    this.valueSelectReturning = options.valueSelectReturning || 'id link_id value';
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

  serializeQuery = serializeQuery;
  serializeWhere = serializeWhere;

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
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : serializeWhere(exp, options?.table || 'links') : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || table === 'links' ? this.linksSelectReturning :
    ['string', 'numbers', 'objects'].includes(table) ? this.valueSelectReturning : 
    `id`;
    const variables = options?.variables;
    const name = options?.name || this.defaultSelectName;
    console.log({query: generateQuery({
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
    })})
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
  ) | (
    Table extends 'numbers' ? MutationInputValue<number> :
    Table extends 'strings' ? MutationInputValue<string> :
    Table extends 'objects' ? MutationInputValue<any> :
    MutationInputLink
  )[], options?: {
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
        actions: [insertMutation(table, { ...variables, objects: _objects }, { tableName: table, operation: 'insert', returning })],
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
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : serializeWhere(exp, options?.table === this.table || !options?.table ? 'links' : 'value') : { id: { _eq: exp } };
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
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : serializeWhere(exp, options?.table === this.table || !options?.table ? 'links' : 'value') : { id: { _eq: exp } };
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

  async serial<
    LL = L
  >({
    name, operations, returning, silent
  }: AsyncSerialParams): Promise<DeepClientResult<{ id: number }[]>> {
    // @ts-ignore
    let operationsGroupedByTypeAndTable: Record<SerialOperationType, Record<Table, Array<SerialOperation>>> = {};
    operationsGroupedByTypeAndTable = operations.reduce((acc, operation) => {
      if (!acc[operation.type]) {
        // @ts-ignore
        acc[operation.type] = {}
      }
      if (!acc[operation.type][operation.table]) {
        acc[operation.type][operation.table] = []
      }
      acc[operation.type][operation.table].push(operation);
      return acc
    }, operationsGroupedByTypeAndTable);
    let serialActions: Array<IGenerateMutationBuilder> = [];
    Object.keys(operationsGroupedByTypeAndTable).map((operationType: SerialOperationType) => {
      const operationsGroupedByTable = operationsGroupedByTypeAndTable[operationType];
      Object.keys(operationsGroupedByTable).map((table: Table<typeof operationType>) => {
        const operations = operationsGroupedByTable[table];
        if (operationType === 'insert') {
          const insertOperations = operations as Array<SerialOperation<'insert', Table<'insert'>>>;
          const serialAction: IGenerateMutationBuilder = insertMutation(table, { objects: insertOperations.map(operation => Array.isArray(operation.objects) ? operation.objects : [operation.objects]).flat() }, { tableName: table, operation: operationType, returning })
          serialActions.push(serialAction);
        } else if (operationType === 'update') {
          const updateOperations = operations as Array<SerialOperation<'update', Table<'update'>>>;
          const newSerialActions: IGenerateMutationBuilder[] = updateOperations.map(operation => {
            const exp = operation.exp;
            const value = operation.value;
            const where = typeof (exp) === 'object' ? Array.isArray(exp) ? { id: { _in: exp } } : serializeWhere(exp, table === this.table || !table ? 'links' : 'value') : { id: { _eq: exp } };
            return updateMutation(table, { where: where, _set: value }, { tableName: table, operation: operationType ,returning})
          })
          serialActions = [...serialActions, ...newSerialActions];
        } else if (operationType === 'delete') {
          const deleteOperations = operations as Array<SerialOperation<'delete', Table<'delete'>>>;;
          const newSerialActions: IGenerateMutationBuilder[] = deleteOperations.map(operation => {
            const exp = operation.exp;
            const where = typeof (exp) === 'object' ? Array.isArray(exp) ? { id: { _in: exp } } : serializeWhere(exp, table === this.table || !table ? 'links' : 'value') : { id: { _eq: exp } };
            return deleteMutation(table, { where, returning }, { tableName: table, operation: 'delete', returning })
          })
          serialActions = [...serialActions, ...newSerialActions];
        }
      })
    })

    let result;
    try {
      result = await this.apolloClient.mutate(generateSerial({
        actions: serialActions,
        name: name ?? 'Name',
      }))
      // @ts-ignore
    } catch (e) {
      const sqlError = e?.graphQLErrors?.[0]?.extensions?.internal?.error;
      if (sqlError?.message) e.message = sqlError.message;
      if (!silent) throw e;
      return { ...result, data: (result)?.data?.m0?.returning, error: e };
    }
    return { ...result, data: (result)?.data?.m0?.returning };
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
    const q = await this.select(pathToWhere(start, ...path));
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

  idLocal(start: DeepClientStartItem, ...path: DeepClientPathItem[]): number {
    if (_ids?.[start]?.[path[0]]) {
      return _ids[start][path[0]];
    }
    const containTypeLinkId = _ids['@deep-foundation/core'].Contain;
    const result = this.minilinks.query({
      in: {
        type_id: containTypeLinkId,
        from: {
          ...(typeof start === 'number' && {id: start}),
          ...(typeof start === 'string' && {
            string: {
              value: {
                _eq: start
              }
            }
          }),
        },
        ...(typeof path[0] === 'string' && {
          string: {
            value: {
              _eq: path[0]
            }
          }
        }),
        ...(typeof path[0] === 'boolean' && {}), // TODO What should we do?
      }
    })
    if(result.length > 0) {
      return ((result[0] as unknown) as Link<number>).id;
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

  nameLocal(input: Link<number> | number): string | undefined {
    const link: any = typeof(input) === 'number' ? this.minilinks.byId[input] : input;
    return link?.inByType?.[this.idLocal('@deep-foundation/core', 'Contain')]?.[0]?.value?.value;
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

export function useDeepQuery<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = Link<number>>(
  query: BoolExpLink,
  options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
    mini?: string;
  },
): {
  data?: LL[];
  error?: any;
  loading: boolean;
} {
  const [miniName] = useState(options?.mini || Math.random().toString(36).slice(2, 7));
  const deep = useDeep();
  const wq = useMemo(() => {
    const sq = serializeQuery(query);
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
  useMinilinksApply(deep.minilinks, miniName, result?.data?.q0 || []);
  const mlResult = deep.useMinilinksSubscription({ id: { _in: result?.data?.q0?.map(l => l.id) } });
  return {
    ...result,
    data: mlResult,
  };
}

export function useDeepSubscription<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = Link<number>>(
  query: BoolExpLink,
  options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
    mini?: string;
  },
): {
  data?: LL[];
  error?: any;
  loading: boolean;
} {
  const [miniName] = useState(options?.mini || Math.random().toString(36).slice(2, 7));
  const deep = useDeep();
  const wq = useMemo(() => {
    const sq = serializeQuery(query);
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
  useMinilinksApply(deep.minilinks, miniName, result?.data?.q0 || []);
  const mlResult = deep.useMinilinksSubscription({ id: { _in: result?.data?.q0?.map(l => l.id) } });
  return {
    ...result,
    data: mlResult,
  };
}
