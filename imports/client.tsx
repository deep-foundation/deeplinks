import type { ApolloQueryResult } from '@apollo/client/index.js';
import { Observable, gql, useApolloClient, useQuery, useSubscription } from '@apollo/client/index.js';
import { IApolloClient, generateApolloClient } from '@deep-foundation/hasura/client.js';
import { useLocalStore } from '@deep-foundation/store/local.js';
import atob from 'atob';
import get from 'get-value';
import React, { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BoolExpCan, BoolExpHandler, BoolExpSelector, BoolExpTree, BoolExpValue, MutationInputLink, MutationInputLinkPlain, MutationInputValue, QueryLink } from './client_types.js';
import { corePckg } from './core.js';
import { debug } from './debug.js';
import { IGenerateMutationBuilder, deleteMutation, generateQuery, generateQueryData, generateSerial, insertMutation, updateMutation } from './gql/index.js';
import { Id, Link, MinilinkCollection, MinilinkError, MinilinksLink, MinilinksQueryOptions, MinilinksResult, useMinilinks, useMinilinksApply, useMinilinksId, useMinilinksQuery, useMinilinksSubscription } from './minilinks.js';
import { awaitPromise } from './promise.js';
import { useTokenController } from './react-token.js';
import { reserve } from './reserve.js';
import { Traveler as NativeTraveler, Traveler } from './traveler.js';
import { evalClientHandler } from './client-handler.js';
import { Packager } from './packager.js';
import isEqual from 'lodash/isEqual.js';
import isNaN from 'lodash/isNaN.js';
import axios from 'axios';
import EventEmitter from 'events';
import { matchSorter } from 'match-sorter';
import { useDebounce } from '@react-hook/debounce';
const moduleLog = debug.extend('client');

const log = debug.extend('log');
const error = debug.extend('error');

const corePckgIds: { [key: Id]: Id; } = {};
corePckg.data.filter(l => !!l.type).forEach((l, i) => {
  corePckgIds[l.id] = i+1;
});

export const random = () => Math.random().toString(36).slice(2, 7);

export async function upload(linkId, file: Blob | string, deep) {
  var formData = new FormData();
  formData.append("file", file);
  console.log('drop-zone formData', formData);
  await axios.post(`http${deep.client.ssl ? 's' : ''}://${deep.client.path.slice(0, -4)}/file`, formData, {
    headers: {
      'linkId': linkId,
      "Authorization": `Bearer ${deep.token}`,
    },
  })
}

export const _ids = {
  '@deep-foundation/core': corePckgIds,
};

interface SerializeTable {
  returning: string;
  virtualize?: { [key:string]: string[] };
  fields?: { [key:string]: string; };
  relations?: { [key:string]: string; };
}
interface Serialize {
  [key:string]: SerializeTable;
}

export const _serialize: Serialize = {
  links: {
    returning: 'id type_id from_id to_id value',
    virtualize: {
      id: ['id', '_id'],
      type_id: ['type_id', '_type_id'],
      from_id: ['from_id', '_from_id'],
      to_id: ['to_id', '_to_id'],
    },
    fields: {
      id: 'number',
      from_id: 'number',
      to_id: 'number',
      type_id: 'number',
      _id: 'number',
      _from_id: 'number',
      _to_id: 'number',
      _type_id: 'number',
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
      string: 'strings',
      number: 'numbers',
      object: 'objects',
      file: 'files',
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
    returning: 'item_id selector_id',
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
    returning: 'rule_id action_id object_id subject_id',
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
    returning: 'id link_id tree_id root_id parent_id depth position_id',
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
    returning: 'id link_id value',
    fields: {
      id: 'number',
      link_id: 'number',
      value: 'value',
    },
    relations: {
      link: 'links',
    },
  },
  strings: {
    returning: 'id link_id value',
    fields: {
      id: 'number',
      link_id: 'number',
      value: 'string',
    },
    relations: {
      link: 'links',
    },
  },
  numbers: {
    returning: 'id link_id value',
    fields: {
      id: 'number',
      link_id: 'number',
      value: 'number',
    },
    relations: {
      link: 'links',
    },
  },
  objects: {
    returning: 'id link_id value',
    fields: {
      id: 'number',
      link_id: 'number',
      value: 'object',
    },
    relations: {
      link: 'links',
    },
  },
  files: {
    returning: 'id link_id mimeType name size',
    fields: {
      bucketId: 'string',
      etag: 'string',
      id: 'number',
      isUploaded: 'boolean',
      link_id: 'number',
      mimeType: 'string',
      name: 'string',
      size: 'number',
    },
    relations: {
      link: 'links',
    },
  },
  handlers: {
    returning: 'dist_id src_id handler_id execution_provider_id isolation_provider_id',
    fields: {
      dist_id: 'number',
      execution_provider_id: 'number',
      handler_id: 'number',
      isolation_provider_id: 'number',
      src_id: 'number',
    },
    relations: {
      link: 'links',
      dist: 'links',
      execution_provider: 'links',
      handler: 'links',
      isolation_provider: 'links',
      src: 'links',
    },
  },
};
_serialize.strings = _serialize.value;
_serialize.numbers = _serialize.value;
_serialize.objects = _serialize.value;

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

export const serializeWhere = (exp: any, env: string = 'links', unvertualizeId: (id: Id) => Id = defaultUnvertualizeId, globalExp?: any): any => {
  // if exp is array - map
  if (Object.prototype.toString.call(exp) === '[object Array]') return exp.map((e) => serializeWhere(e, env, unvertualizeId, globalExp));
  else if (typeof(exp) === 'object') {
    // if object
    const keys = Object.keys(exp);
    const result: any = {};
    // map keys
    for (let k = 0; k < keys.length; k++) {
      let key = keys[k];
      let value = exp[key];
      let type = typeof(value);
      if (typeof(value) === 'undefined') throw new Error(`${key} === undefined${globalExp ? `in exp ${JSON.stringify(globalExp)}` : ''}`);
      let setted: any = false;
      key = addIdsToRelationsIfSimple(exp, key, env);
      if (env === 'links' && key === 'value' && (type === 'string' || type === 'number')) {
        key = type;
      }
      if (env === 'links' && (key === 'string' || key === 'number') && (type === key)) {
        value = { value: { _eq: value } };
      }
      if (_serialize?.[env]?.fields?.[key] && (type === 'string' || type === 'number')) {
        value = { _eq: key.slice(-3) === '_id' ? unvertualizeId(value) : value };
      }
      const is_id_field = !!~['type_id', 'from_id', 'to_id'].indexOf(key);
      // if this is link
      if (env === 'links') {
        // if field contain primitive type - string/number
        if (key === 'relation') {
          setted = result[key] = value;
        } else if (!_boolExpFields[key] && Object.prototype.toString.call(value) === '[object Array]') {
          if (_serialize?.[env]?.relations?.[key]) {
            setted = result[key] = serializeWhere(value, _serialize?.[env]?.relations?.[key], unvertualizeId, globalExp);
          } else {
            // if field is not boolExp (_and _or _not) but contain array
            // @ts-ignore
            setted = result[key] = serializeWhere(pathToWhere(...value), 'links', unvertualizeId, globalExp);
          }
        }
      } else if (env === 'tree') {
        // if field contain primitive type - string/number
        if (!_boolExpFields[key] && Object.prototype.toString.call(value) === '[object Array]') {
          // if field is not boolExp (_and _or _not) but contain array
          // @ts-ignore
          setted = result[key] = serializeWhere(pathToWhere(...value), 'links', unvertualizeId, globalExp);
        }
      }

      if (key === 'return') {
        setted = result[key] = {};
        for (let r in value) {
          const relation = value[r]?.relation;
          if (_serialize?.[env]?.relations?.[relation]) result[key][r] = serializeWhere(value[r], _serialize?.[env]?.relations?.[relation] || env, unvertualizeId, globalExp);
        }
      }
      if (type === 'object' && value?.hasOwnProperty('_type_of') && (
        (env === 'links' && (is_id_field || key === 'id')) ||
        (env === 'selector' && key === 'item_id') ||
        (env === 'can' && !!~['rule_id', 'action_id', 'subject_id', 'object_id',].indexOf(key)) ||
        (env === 'tree' && !!~['link_id', 'tree_id', 'root_id', 'parent_id'].indexOf(key)) ||
        (env === 'value' && key === 'link_id')
      )) {
        // if field is object, and contain _type_od
        const _temp = setted = { _by_item: { path_item_id: { _eq: unvertualizeId(value._type_of) }, group_id: { _eq: _ids['@deep-foundation/core'].typesTree } } };
        if (key === 'id') {
          result._and = result._and ? [...result._and, _temp] : [_temp];
        } else {
          result[key.slice(0, -3)] = _temp;
        }
      } else if (type === 'object' && value?.hasOwnProperty('_id') && (
        (env === 'links' && (is_id_field || key === 'id')) ||
        (env === 'selector' && key === 'item_id') ||
        (env === 'can' && !!~['rule_id', 'action_id', 'subject_id', 'object_id',].indexOf(key)) ||
        (env === 'tree' && !!~['link_id', 'tree_id', 'root_id', 'parent_id'].indexOf(key)) ||
        (env === 'value' && key === 'link_id')
      ) && Object.prototype.toString.call(value._id) === '[object Array]' && value._id.length >= 1) {
        const root = value._id[0];
        // if field is object, and contain _type_of
        const _temp = setted = serializeWhere(pathToWhere(typeof(root) === 'number' ? unvertualizeId(root) : root, ...value._id.slice(1)), 'links', unvertualizeId, globalExp);
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
          serializeWhere(value, env, unvertualizeId, globalExp)
        ) : (
          // if we know context
          _serialize?.[env]?.relations?.[key]
        ) ? (
          // go to this context then
          serializeWhere(value, _serialize?.[env]?.relations?.[key], unvertualizeId, globalExp)
        ) : (
          // else just stop
          value
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

const defaultUnvertualizeId = (id: Id): Id => id;

export const serializeQuery = (exp: any, env: string = 'links', unvertualizeId = defaultUnvertualizeId): any => {
  const { limit, order_by, offset, distinct_on, ...where } = exp;
  const result: any = { where: typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp.map(id => unvertualizeId(id)) } } : serializeWhere(where, env, unvertualizeId, exp) : { id: { _eq: unvertualizeId(exp) } } };
  // const result: any = { where: serializeWhere(where, env, unvertualizeId) };
  if (limit) result.limit = limit;
  if (order_by) result.order_by = order_by;
  if (offset) result.offset = offset;
  if (distinct_on) result.distinct_on = distinct_on;
  return result;
}

// https://stackoverflow.com/a/38552302/4448999
export function parseJwt (token): { userId: Id; role: string; roles: string[], [key: string]: any; } {
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

export interface Handler {
  handler_id: number;
  dist_id: number;
  src_id: number;
}

export interface Subscription {
  closed: boolean;
  unsubscribe(): void;
}

export interface Observer<T> {
  start?(subscription: Subscription): any;
  next?(value: T): void;
  error?(errorValue: any): void;
  complete?(): void;
};

export interface DeepClientOptions<L extends Link<Id> = Link<Id>> {
  namespace?: string;

  needConnection?: boolean;

  path?: string;
  ssl?: boolean;

  linkId?: Id;
  token?: string;
  handleAuth?: (linkId?: Id, token?: string) => any;
  handleOperation?: (operation: string, query?: any, value?: any, options?: any) => any;

  deep?: DeepClientInstance<L>;
  self?: DeepClientInstance<L>;

  apolloClient?: IApolloClient<any>;
  minilinks?: MinilinkCollection<any, Link<Id>>;
  ml?: MinilinkCollection<any, Link<Id>>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  linksSelectReturning?: string;
  selectorsSelectReturning?: string;
  canSelectReturning?: string;
  treeSelectReturning?: string;
  valuesSelectReturning?: string;
  filesSelectReturning?: string;
  handlersSelectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;

  silent?: boolean;

  unsafe?: any;

  remote?: boolean;
  local?: boolean;
}

export interface DeepClientResult<R> extends ApolloQueryResult<R> {
  query?: any;
  error?: any;
  data: any;
  originalData?: any;
  plainLinks?: any;
  subscribe?: (observer: Observer<any>) => Subscription;
  travel?: (query?: Exp) => Traveler;
}

export type DeepClientPackageSelector = string;
export type DeepClientPackageContain = string;
export type DeepClientLinkId = Id;
export type DeepClientStartItem = DeepClientPackageSelector | DeepClientLinkId;
export type DeepClientPathItem = DeepClientPackageContain | boolean;

export interface DeepSearchOptions {
  remote?: boolean;
  regexp?: boolean;
  query?: Exp;
  values?: boolean;
  contains?: boolean;
  sort?: boolean;
  skip?: boolean;
  count?: boolean;
  apply?: string;
  subscription?: boolean;
  debounce?: number | boolean;
};

export interface DeepClientInstance<L extends Link<Id> = Link<Id>> {
  namespace?: string;

  linkId?: Id;
  token?: string;
  handleAuth?: (linkId?: Id, token?: string) => any;
  handleOperation?: (operation: string, query?: any, value?: any, options?: any) => any;

  deep: DeepClientInstance<L>;
  DeepClient: typeof DeepClient;
  gql: typeof gql;

  apolloClient: IApolloClient<any>;
  minilinks: MinilinksResult<L>;
  ml: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  linksSelectReturning?: string;
  selectorsSelectReturning?: string;
  canSelectReturning?: string;
  treeSelectReturning?: string;
  valuesSelectReturning?: string;
  filesSelectReturning?: string;
  handlersSelectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;

  unsafe?: any;

  stringify(any?: any): string;

  one(exp: Exp<'links'> | Id): Promise<L>;
  select<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Promise<DeepClientResult<LL[] | number>>;
  subscribe<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Observable<LL[] | number>;

  insert<TTable extends 'links'|'numbers'|'strings'|'objects', LL = L>(objects: InsertObjects<TTable> , options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>>;

  update<TTable extends 'links'|'numbers'|'strings'|'objects'>(exp: Exp<TTable>, value: UpdateValue<TTable>, options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>>;

  delete<TTable extends 'links'|'numbers'|'strings'|'objects'>(exp: Exp<TTable>, options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>>;

  serial(options: AsyncSerialParams): Promise<DeepClientResult<{ id }[]>>;

  reserve<LL = L>(count: number): Promise<Id[]>;

  await(id: Id): Promise<boolean>;

  value(id: Id, value?: string | number | Object): Promise<{
    id: Id;
    link?: Link<Id>;
    Value?: Link<Id>;
    data: string | number | Object;
    [key:string]: any;
  }>;

  serializeWhere(exp: any, env?: string): any;
  serializeQuery(exp: any, env?: string): any;
  unvertualizeId(id: Id): Id;

  id(start: DeepClientStartItem | Exp, ...path: DeepClientPathItem[]): Promise<Id>;
  idLocal(start: DeepClientStartItem, ...path: DeepClientPathItem[]): Id;
  
  name(input: Link<Id> | Id): Promise<string | null>;
  nameLocal(input: Link<Id> | Id): string | null;
  symbol(input: Link<Id> | Id): Promise<string | null>;
  symbolLocal(input: Link<Id> | Id): string | null;

  guest(options: DeepClientGuestOptions): Promise<DeepClientAuthResult>;

  jwt(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;

  login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;

  logout(): Promise<DeepClientAuthResult>;

  can(objectIds: Id[], subjectIds: Id[], actionIds: Id[]): Promise<boolean>;

  useId: typeof useDeepId;
  useDeepId: typeof useDeepId;
  useLink: typeof useLink;
  useLinks: typeof useLinks;
  useSubscription: typeof useDeepSubscription;
  useDeepSubscription: typeof useDeepSubscription;
  useQuery: typeof useDeepQuery;
  useDeepQuery: typeof useDeepQuery;
  useMinilinksQuery: (query: Exp, options?: MinilinksQueryOptions) => L[];
  useMinilinksSubscription: (query: Exp, options?: MinilinksQueryOptions) => L[];
  useMinilinksId: (start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]) => Id | void;
  useMinilinksApply(data, name: string);
  useLocalQuery: (query: Exp, options?: MinilinksQueryOptions) => L[];
  useLocalSubscription: (query: Exp, options?: MinilinksQueryOptions) => L[];
  useLocalId: (start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]) => Id | void;
  useLocalApply(data, name: string);
  useSearch: typeof useSearch;
  useCan: typeof useCan;
  useDeep: typeof useDeep;
  DeepProvider: typeof DeepProvider;
  DeepContext: typeof DeepContext;

  Traveler(links: Link<Id>[]): NativeTraveler;
  Packager(): Packager<L>;

  eval: (options: {
    linkId?: Id; // if only setted, auto find handlerId by context
    handlerId?: Id; // if setted - ignore value
    value?: string; // string to execute, using only if handlerId not setted
    context?: Id[];

    input?: any;
  }) => Promise<{
    error?: any;
    data?: any;
  }>;

  isId(id: any): boolean;
  isLink(link: any): boolean;
  get(...id: Id[]): MinilinksLink<Id> | undefined;
  getRemote(...id: Id[]): Promise<MinilinksLink<Id> | undefined>;

  search(value: string, options: DeepSearchOptions): Promise<DeepClientResult<L[] | number>>;

  searchQuery(value: string, options: {
    db: boolean;
    regexp: boolean;
    query: boolean;
    values: boolean;
    contains: boolean;
    sort: boolean;
  }): Exp;

  emitter: EventEmitter;

  url: (target: 'deeplinks' | 'gql') => string;
}

export interface DeepClientAuthResult {
  linkId?: Id;
  token?: string;
  error?: any;
}

export interface DeepClientGuestOptions {
  relogin?: boolean;
}

export interface DeepClientJWTOptions {
  linkId?: Id;
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
  : QueryLink;

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

export function addIdsToRelationsIfSimple(exp, key, env) {
  const type = typeof(exp[key]);
  if (_serialize?.[env]?.relations?.[key] === 'links' && (type === 'string' || type === 'number')) {
    if (exp[`${key}_id`]) throw new Error(`Cant work with ${key} and ${key}_id in one link`);
    return key+'_id';
  }
  return key;
}

export function checkAndFillShorts(obj, table, containerId, Contain, field?: string) {
  if (obj.hasOwnProperty('containerId') && !obj.containerId) {
    throw new Error(`containerId is undefined`);
  }
  const cId = obj.containerId || containerId;
  for (var _key in obj) {
    let key = _key;
    const type = obj[key];
    key = addIdsToRelationsIfSimple(obj, key, table)
    if (!obj.hasOwnProperty(key)) continue;
    if ((typeof obj[key]) == 'object' && obj[key] !== null) {
      if (typeof obj[key] === 'object' && key === 'object' && obj[key]?.data?.value === undefined) { obj[key] = { data: { value: obj[key] } }; continue; }
      if (typeof obj[key] === 'object' && (key === 'to' || key === 'from' || key === 'in' || key === 'out' || key === 'typed' || key === 'type') && obj[key]?.data === undefined) obj[key] = { data: obj[key] };
      checkAndFillShorts(obj[key], _serialize[table]?.relations?.[key] || table, cId, Contain, key);
    }
    else if (key === 'string' && typeof obj[key] === 'string' || key === 'number' && typeof obj[key] === 'number') obj[key] = { data: { value: obj[key] } }; 
  }
  if (cId && !Array.isArray(obj) && !obj.data && table === 'links' && ((!field || [
    'to', 'from', 'in', 'out', 'type', 'typed'
  ].includes(field)) || obj.type_id || obj.type)) {
    obj.in = obj.in || {};
    obj.in.data = obj?.in?.data ? Array.isArray(obj?.in?.data) ? obj?.in?.data : [obj?.in?.data] : [];
    obj.in.data.push({
      type_id: Contain, from_id: cId,
      ...(typeof(obj.name) === 'string' ? { string: { data: { value: obj.name } } } : {})
    });
  }
  delete obj.name;
  delete obj.containerId;
}

export function convertDeepInsertToMinilinksApplyAndPatchVirtualIds(deep, objects, table, result: { id?: number; from_id?: number; to_id?: number; type_id?: number; value?: any }[] = [], errors: string[], patch: any = {}): { objects: any; levelIds: any[]; } {
  const levelIds = [];
  if (table === 'links') {
    for (let i = 0; i < objects.length; i++) {
      const o = objects[i];
      let id = o.id;
      if (!id) {
        id = deep.minilinks.virtualCounter--;
        // @ts-ignore
        deep.minilinks?.byId[id]?._id = apply;
      }
      levelIds.push(id);
      const patchRelationIds: any = {};
      if (o?.from) {
        const { objects: objs, levelIds } = convertDeepInsertToMinilinksApplyAndPatchVirtualIds(deep, [o?.from?.data], table, result, errors);
        o.from.data = objs;
        patchRelationIds.from_id = levelIds[0];
      }
      if (o?.to) {
        const { objects: objs, levelIds } = convertDeepInsertToMinilinksApplyAndPatchVirtualIds(deep, [o?.to?.data], table, result, errors);
        o.to.data = objs;
        patchRelationIds.to_id = levelIds[0];
      }
      if (o?.type) {
        const { objects: objs, levelIds } = convertDeepInsertToMinilinksApplyAndPatchVirtualIds(deep, [o?.type?.data], table, result, errors);
        o.type.data = objs;
        patchRelationIds.type_id = levelIds[0];
      }
      if (o?.out) {
        const { objects: objs, levelIds } = convertDeepInsertToMinilinksApplyAndPatchVirtualIds(deep, (o?.out?.data?.length ? o?.out?.data : [o?.out?.data]), table, result, errors, { from_id: id });
        o.out.data = objs;
      }
      if (o?.in) {
        const { objects: objs, levelIds } = convertDeepInsertToMinilinksApplyAndPatchVirtualIds(deep, (o?.in?.data?.length ? o?.in?.data : [o?.in?.data]), table, result, errors, { to_id: id });
        o.in.data = objs;
      }
      if (o?.types) {
        const { objects: objs, levelIds } = convertDeepInsertToMinilinksApplyAndPatchVirtualIds(deep, (o?.types?.data?.length ? o?.types?.data : [o?.types?.data]), table, result, errors, { type_id: id });
        o.types.data = objs;
      }
      if (typeof(o.from_id) === 'number' || typeof(o.from_id) === 'string') {
        if (o.from_id < 0) {
          if (deep.minilinks.virtual[o.from_id]) o.from_id = deep.minilinks.virtual[o.from_id];
          else errors.push(`.from_id=${o.from_id} can't be devertualized, not exists in minilinks.virtual[${o.from_id}]`);
        }
      }
      if (typeof(o.to_id) === 'number' || typeof(o.to_id) === 'string') {
        if (o.to_id < 0) {
          if (deep.minilinks.virtual[o.to_id]) o.to_id = deep.minilinks.virtual[o.to_id];
          else errors.push(`.to_id=${o.to_id} can't be devertualized, not exists in minilinks.virtual[${o.to_id}]`);
        }
      }
      if (typeof(o.type_id) === 'number' || typeof(o.type_id) === 'string') {
        if (o.type_id < 0) {
          if (deep.minilinks.virtual[o.type_id]) o.type_id = deep.minilinks.virtual[o.type_id];
          else errors.push(`.type_id=${o.type_id} can't be devertualized, not exists in minilinks.virtual[${o.type_id}]`);
        }
      }
      result.push({
        id: id, from_id: o.from_id, to_id: o.to_id, type_id: o.type_id,
        value: o.string?.data || o.number?.data || o.object?.data,
        ...patch, ...patchRelationIds
      });
    }
  }
  return { objects: objects.length == 1 ? objects[0] : objects, levelIds };
}

export function convertDeepUpdateToMinilinksApply(ml, _exp, _set, table, toUpdate: { id?: number; from_id?: number; to_id?: number; type_id?: number; value?: any }[] = []): void {
  if (table === 'links') {
    try {
      const founded = ml.query(_exp);
      for (let f of founded) {
        toUpdate.push({
          id: f.id, from_id: f.from_id, to_id: f.to_id, type_id: f.type_id,
          value: f.value,
          ..._set
        });
      }
    } catch(e) {}
  } else if (table === 'strings' || table === 'numbers' || table === 'objects') {
    const key = table.slice(0, -1);
    const founded = ml.query({ [key]: _exp });
    for (let f of founded) {
      toUpdate.push({
        id: f.id, from_id: f.from_id, to_id: f.to_id, type_id: f.type_id,
        value: { ...f?.value, value: _set.value },
      });
    }
  }
}

export function convertDeepDeleteToMinilinksApply(ml, _exp, table, toDelete: number[] = [], toUpdate: { id?: number; from_id?: number; to_id?: number; type_id?: number; value?: any }[] = []): void {
  if (table === 'links') {
    try {
      const founded = ml.query(_exp);
      toDelete.push(...founded.map(l => l.id));
    } catch(e) {}
  } else if (table === 'strings' || table === 'numbers' || table === 'objects') {
    const key = table.slice(0, -1);
    const founded = ml.query({ [key]: _exp });
    toUpdate.push(...founded.map(o => ({
      id: o.id, from_id: o.from_id, to_id: o.to_id, type_id: o.type_id,
    })));
  }
}

export class DeepClient<L extends Link<Id> = Link<Id>> implements DeepClientInstance<L> {
  static resolveDependency?: (path: string) => Promise<any>

  useDeep = useDeep;
  DeepProvider = DeepProvider;
  DeepContext = DeepContext;

  namespace?: string;

  linkId?: Id;
  token?: string;
  handleAuth?: (linkId?: Id, token?: string) => any;
  handleOperation?: (operation: string, query?: any, value?: any, options?: any) => any;

  deep: DeepClientInstance<L>;
  DeepClient = DeepClient;
  gql: typeof gql = gql;

  client: IApolloClient<any>;
  apolloClient: IApolloClient<any>;
  minilinks: MinilinksResult<L>;
  ml: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  linksSelectReturning?: string;
  selectorsSelectReturning?: string;
  canSelectReturning?: string;
  treeSelectReturning?: string;
  valuesSelectReturning?: string;
  filesSelectReturning?: string;
  handlersSelectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;

  silent: boolean;

  unsafe?: any;

  useId: typeof useDeepId;
  useDeepId: typeof useDeepId;
  useLink: typeof useLink;
  useLinks: typeof useLinks;
  useSubscription: typeof useDeepSubscription;
  useDeepSubscription: typeof useDeepSubscription;
  useQuery: typeof useDeepQuery;
  useDeepQuery: typeof useDeepQuery;
  useMinilinksQuery: (query: Exp, options?: MinilinksQueryOptions) => L[];
  useMinilinksSubscription: (query: Exp, options?: MinilinksQueryOptions) => L[];
  useMinilinksId: (start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]) => Id | void;
  useMinilinksApply: (data, name: string) => {
    errors?: MinilinkError[];
    anomalies?: MinilinkError[];
    data: L[];
  };
  useLocalQuery: (query: Exp, options?: MinilinksQueryOptions) => L[];
  useLocalSubscription: (query: Exp, options?: MinilinksQueryOptions) => L[];
  useLocalId: (start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]) => Id | void;
  useLocalApply: (data, name: string) => {
    errors?: MinilinkError[];
    anomalies?: MinilinkError[];
    data: L[];
  };
  useSearch: typeof useSearch;
  useCan: typeof useCan;
  local?: boolean;
  remote?: boolean;

  unvertualizeId: (id: Id) => Id;

  _silent(options: Partial<{ silent?: boolean }> = {}): boolean {
    return typeof(options.silent) === 'boolean' ? options.silent : this.silent;
  }

  emitter: EventEmitter;

  constructor(options: DeepClientOptions<L>) {
    this.namespace = options?.namespace || random();
    this.emitter = new EventEmitter();

    this.local = typeof(options?.local) === 'boolean' ? options?.local : true;
    this.remote = typeof(options?.remote) === 'boolean' ? options?.remote : true;

    if (options?.needConnection != false) {
      this.deep = options?.deep;
      this.apolloClient = options?.apolloClient;
      this.token = options?.token;
      this.client = this.apolloClient;
      this.table = options?.table || 'links';

      if ((this.deep && !this.apolloClient) || (!!options.path && typeof(options.ssl) === 'boolean')) {
        const token = this?.deep?.token || options.token;
        if (!token) {
          throw new Error('token for apolloClient is invalid or not provided');
        }
        this.apolloClient = generateApolloClient({
          // @ts-ignore
          path: this.deep?.apolloClient?.path || options.path,
          // @ts-ignore
          ssl: this.deep?.apolloClient?.ssl || options.ssl,
          token: token,
        });
      }

      if (!this.apolloClient) throw new Error('apolloClient is invalid or not provided');

      if (this.token) {
        const decoded = parseJwt(this.token);
        const linkId = decoded?.userId;
        if (!linkId){
          throw new Error(`Unable to parse linkId from jwt token.`);
        }
        if (options.linkId && options.linkId !== linkId){
          throw new Error(`linkId (${linkId}) parsed from jwt token is not the same as linkId passed via options (${options.linkId}).`);
        }
        this.linkId = linkId;
      } else {
        this.linkId = options.linkId;
      }
    }

    this.unvertualizeId = (id: Id): Id => {
      // @ts-ignore
      return this.minilinks.virtual.hasOwnProperty(id) ? this.minilinks.virtual[id] : id;
    };

    this.linksSelectReturning = options.selectReturning || _serialize.links.returning;
    this.selectReturning = options.selectReturning || this.linksSelectReturning;
    this.selectorsSelectReturning = options.selectorsSelectReturning || _serialize.selector.returning;
    this.canSelectReturning = options.canSelectReturning || _serialize.can.returning;
    this.treeSelectReturning = options.treeSelectReturning || _serialize.tree.returning;
    this.valuesSelectReturning = options.valuesSelectReturning || _serialize.value.returning;
    this.filesSelectReturning = options.filesSelectReturning || _serialize.files.returning;
    this.handlersSelectReturning = options.handlersSelectReturning || _serialize.handlers.returning;
    this.insertReturning = options.insertReturning || 'id';
    this.updateReturning = options.updateReturning || 'id';
    this.deleteReturning = options.deleteReturning || 'id';

    this.defaultSelectName = options.defaultSelectName || 'SELECT';
    this.defaultInsertName = options.defaultInsertName || 'INSERT';
    this.defaultUpdateName = options.defaultUpdateName || 'UPDATE';
    this.defaultDeleteName = options.defaultDeleteName || 'DELETE';
    
    this.silent = options.silent || false;

    this.unsafe = options.unsafe || {};

    this.handleAuth = options?.handleAuth || options?.deep?.handleAuth;
    this.handleOperation = options?.handleOperation || options?.deep?.handleOperation;
    // @ts-ignore
    this.minilinks = options.minilinks || new MinilinkCollection();
    this.ml = this.minilinks;

    if (!this.ml.deep) this.ml.deep = this;

    this._generateHooks(this);
  }

  _generateHooks(deep) {
    // @ts-ignore
    this.useDeepId = (start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]): { data: Id; loading: boolean; error?: any } => _useDeepId(deep, start, ...path);
    this.useId = this.useDeepId;
    // @ts-ignore
    this.useDeepSubscription = (query: Exp, options?: Options) => useDeepSubscription(query, { ...(options || {}), deep: deep });
    this.useSubscription = useDeepSubscription;
    // @ts-ignore
    this.useDeepQuery = (query: Exp, options?: Options) => useDeepQuery(query, { ...(options || {}), deep: deep });
    this.useQuery = useDeepQuery;
    this.useLink = useLink;
    this.useLinks = useLinks;
    // @ts-ignore
    this.useMinilinksQuery = (query: Exp, options?: MinilinksQueryOptions) => useMinilinksQuery(deep.minilinks, query, options);
    // @ts-ignore
    this.useMinilinksSubscription = (query: Exp, options?: MinilinksQueryOptions) => useMinilinksSubscription(deep.minilinks, query, options);
    this.useMinilinksId = (start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]) => useMinilinksId(deep.minilinks, start, ...path);
    // @ts-ignore
    this.useMinilinksApply = (data, name: string) => useMinilinksApply(deep.minilinks, name, data)
    this.useLocalQuery = this.useMinilinksQuery;
    this.useLocalSubscription = this.useMinilinksSubscription;
    this.useLocalId = this.useMinilinksId;
    this.useLocalApply = this.useMinilinksApply;
    this.useSearch = useSearch;
    this.useCan = useCan;
  }

  stringify(any?: any): string {
    if (typeof(any) === 'object' && typeof(any?.message) === 'string') {
      return any?.message;
    } else if (typeof(any) === 'string') {
      let json;
      try { json = JSON.parse(any); } catch(e) {}
      return json ? JSON.stringify(json, null, 2) : any.toString();
    } else if (typeof(any) === 'object') {
      return JSON.stringify(any, null, 2);
    }
    return any;
  }

  serializeQuery(exp, env?: string) { return serializeQuery(exp, env, this.unvertualizeId); }
  serializeWhere(exp, env?: string) { return serializeWhere(exp, env, this.unvertualizeId, exp); } 

  _generateQuery<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers'>(exp: Exp<TTable>, options: Options<TTable>) {
    const query = serializeQuery(exp, options?.table || 'links', this.unvertualizeId);
    const table = options?.table || this.table;
    const returning = options?.returning || _serialize?.[table]?.returning || 'id';
    const tableNamePostfix = options?.tableNamePostfix;
    const aggregate = options?.aggregate;

    const variables = options?.variables;
    const name = options?.name || this.defaultSelectName;

    const queryData = generateQueryData({
      tableName: table,
      tableNamePostfix: tableNamePostfix || aggregate ? '_aggregate' : '',
      returning: aggregate ? `aggregate { ${aggregate} }` : returning,
      variables: {
        ...variables,
        ...query,
      },
    });

    return {
      query: generateQuery({
        operation: options?.subscription ? 'subscription' : 'query',
        queries: [
          queryData,
        ],
        name: name,
      }),
      queryData,
    };
  }

  _generateResult<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers'>(exp: Exp<TTable>, options: Options<TTable>, data): any[] | Promise<any[]> {
    return data;
  }

  async one(exp) {
    return (await this.select(exp))?.data?.[0];
  }

  /**
   * Gets a value from the database. By default gets a link from the links table
   * @param exp A filter expression to filter the objects to get
   * @param options An object with options for the select operation
   * @returns A promise that resolves to the selected object or an array of selected objects with the fields configured by {@link options.returning} which is by default 'id'
   * 
   * @example
   * #### Select by id
   * ``` 
   * await deep.select({
   *   id: deep.linkId
   * })
   * ```
   * 
   * #### Select by type_id
   * ``` 
   * await deep.select({
   *   type_id: {
   *     _id: ["@deep-foundation/core", "User"]
   *   }
   * })
   * ```
   * 
   * #### Select by from_id
   * ``` 
   * await deep.select({
   *   from_id: deep.linkId
   * })
   * ```
   * 
   * #### Select by to_id
   * ``` 
   * await deep.select({
   *   to_id: deep.linkId
   * })
   * ```
   * 
   * #### Select by string value
   * ``` 
   * await deep.select({
   *   string: {
   *     value: {
   *       _eq: "MyString"
   *     }
   *   }
   * })
   * ```
   * 
   * #### Select by number value
   * ``` 
   * await deep.select({
   *   number: {
   *     value: {
   *       _eq: 888
   *     }
   *   }
   * })
   * ```
   * 
   * #### Select by object value
   * ``` 
   * await deep.select({
   *   object: {
   *     value: {
   *       _eq: {
   *         myFieldKey: "myFieldValue"
   *       }
   *     }
   *   }
   * })
   * ```
   */
  async select<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Promise<DeepClientResult<LL[]>> {
    if (!exp) return { error: { message: '!exp' }, data: undefined, loading: false, networkStatus: undefined };
    const aggregate = options?.aggregate;

    const name = random();

    this.emitter.emit('select.before', { deep: this, name, query: exp, options, remote: true, local: false });
    const queryData = this._generateQuery(exp, options);
    try {
      const q = await this.apolloClient.query({ query: queryData.query.query, variables: queryData?.query?.variables });
      const results: DeepClientResult<LL[]> = {
        ...q, data: aggregate ? (q)?.data?.q0?.aggregate?.[aggregate] : await this._generateResult(exp, options, q?.data?.q0),
        // @ts-ignore
        return: exp?.return,
        query: exp,
      };
      if (options?.apply) {
        results.originalData = results.data;
        const { data: localData, plainLinks } = this.minilinks.apply(results.data, options.apply)
        results.data = localData;
        results.plainLinks = plainLinks;
        this.emitter.emit('select', { deep: this, name, query: exp, options, remoteQuery: queryData, remoteData: results.data, localData: results.data, plainLinks, remote: true, local: false, error: results.error });
      } else {
        this.emitter.emit('select', { deep: this, name, query: exp, options, remoteQuery: queryData, remoteData: results.data, remote: true, local: false, error: results.error });
      }
      return results;
    } catch (e) {
      this.emitter.emit('select', { deep: this, name, query: exp, options, remoteQuery: queryData, error: e, remote: true, local: false });
      // console.log({ typeName: this.nameLocal(163) });
      // console.dir({ queryData }, { depth: null });
      throw new Error(`DeepClient Select Error: ${e.message}`, { cause: e });
    }
  };

  /**
   * Subscribes to data in the database
   * @example
   * ```
   * deep.subscribe({ up: { link_id: deep.linkId } }).subscribe({ next: (links) => {}, error: (err) => {} });
   * ```
   */
  subscribe<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Observable<LL[]> {
    if (!exp) return new Observable((observer) => observer.error('!exp'));
    const aggregate = options?.aggregate;
    const queryData = this._generateQuery(exp, { ...options, subscription: true });

    const name = random();

    this.emitter.emit('subscribe.before', { deep: this, name, query: exp, options, remote: true, local: false });

    try {
      const apolloObservable = this.apolloClient.subscribe({ query: queryData.query.query, variables: queryData?.query?.variables });
      const observable = new Observable((observer) => {
        // @ts-ignore
        observer.name = name;
        const subscription = apolloObservable.subscribe({
          next: async (data: any) => {
            const results = aggregate ? data?.data?.q0?.aggregate?.[aggregate] : 
            {
              ...(await this._generateResult(exp, options, data?.data?.q0)),
              // @ts-ignore
              return: exp?.return,
              query: exp,
            };
            if (options?.apply) {
              results.originalData = results.data;
              const { data: localData, plainLinks } = this.minilinks.apply(results.data, options.apply);
              results.data = localData;
              results.plainLinks = plainLinks;
              this.emitter.emit('subscribe', { deep: this, name, query: exp, options, remoteQuery: queryData, remoteData: results.data, localData: results.data, plainLinks, remote: true, local: false, error: results.error });
            } else {
              this.emitter.emit('subscribe', { deep: this, name, query: exp, options, remoteQuery: queryData, remoteData: results.data, remote: true, local: false, error: results.error });
            }
            observer.next(results);
          },
          error: (error) => {
            this.emitter.emit('subscribe', { deep: this, name, query: exp, options, remoteQuery: queryData, error, remote: true, local: false });
            observer.error(error);
          },
        });
        return () => subscription.unsubscribe();
      });

    // @ts-ignore
      return observable;
    } catch (e) {
      throw new Error(`DeepClient Subscription Error: ${e.message}`, { cause: e });
    }
  };

  /**
   * Inserts a value into the database. By default inserts a link to the links table
   * @param objects An object or array of objects to insert to the database
   * @param options An object with options for the insert operation
   * @returns A promise that resolves to the inserted object or an array of inserted objects with the fields configured by {@link options.returning} which is by default 'id'
   * 
   * @remarks
   * If a link already has value you should update its value, not insert 
   * 
   * @example
   * #### Insert Type
   * ``` 
   * await deep.insert({
   *   type_id: await deep.id("@deep-foundation/core", "Type")
   * })
   * ```
   * In this case instances of your type will not have from and to
   * 
   * #### Insert Type from Package to User
   * ``` 
   * await deep.insert({
   *   type_id: await deep.id("@deep-foundation/core", "Type"),
   *   from_id: await deep.id("@deep-foundation/core", "Package"),
   *   to_id: await deep.id("@deep-foundation/core", "User")
   * })
   * ```
   * In this case instances of your type will must go from instances of Package to instances of User
   * 
   * #### Insert Type with from Any to Any
   * ``` 
   * await deep.insert({
   *   type_id: await deep.id("@deep-foundation/core", "Type"),
   *   from_id: await deep.id("@deep-foundation/core", "Any"),
   *   to_id: await deep.id("@deep-foundation/core", "Any")
   * })
   * ```
   * In this case instances of your type may go from instances of any link to instances of any link without restrictions
   * 
   * #### Insert Type with from Package to Any
   * ``` 
   * await deep.insert({
   *   type_id: await deep.id("@deep-foundation/core", "Type"),
   *   from_id: await deep.id("@deep-foundation/core", "Package"),
   *   to_id: await deep.id("@deep-foundation/core", "Any")
   * })
   * ```
   * In this case instances of your type may go from instances of Package to instances of any link without restrictions
   * 
   * #### Insert Type with from Any to Package
   * ``` 
   * await deep.insert({
   *   type_id: await deep.id("@deep-foundation/core", "Type"),
   *   from_id: await deep.id("@deep-foundation/core", "Any"),
   *   to_id: await deep.id("@deep-foundation/core", "Package")
   * })
   * ```
   * In this case instances of your type may go from instances of any link without restrictions to instances of Package 
   * 
   * #### Insert string
   * ``` 
   * await deep.insert({
   *   link_id: 888,
   *   value: 'MyString'
   * }, {
   *   table: 'strings'
   * })
   * ```
   * Note: If a link already has value you should update its value, not insert 
   * 
   * #### Insert number
   * ``` 
   * await deep.insert({
   *   link_id: 888,
   *   value: 888
   * }, {
   *   table: 'numbers'
   * })
   * ```
   * Note: If a link already has value you should update its value, not insert 
   * 
   * #### Insert object
   * ``` 
   * await deep.insert({
   *   link_id: 888,
   *   value: {
   *     myFieldName: 'myFieldValue'
   *   }
   * }, {
   *   table: 'objects'
   * })
   * ```
   * Note: If a link already has value you should update its value, not insert 
   */
  async insert<TTable extends 'links'|'numbers'|'strings'|'objects', LL = L>(objects: InsertObjects<TTable>, options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>> {
    const o: any = { local: this.local, remote: this.remote, ...options };
    const { local, remote } = o;

    const _name = random();

    this.emitter.emit('insert.before', { deep: this, name: _name, value: objects, options, remote, local });

    const table = options?.table || this.table;
    const returning = options?.returning || this.insertReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultInsertName;
    let q: any = {};

    const containerId = options?.containerId;

    let _objects: any = Object.prototype.toString.call(objects) === '[object Array]' ? objects : [objects];
    checkAndFillShorts(_objects, table, containerId, this.idLocal('@deep-foundation/core', 'Contain'));
    
    this.handleOperation && this.handleOperation('insert', null, _objects, o);

    let file;
    if (_objects?.[0]?.file) {
      if (_objects?.length != 1) throw new Error('Cannot insert multiple files at once');
      if (table != 'links') throw new Error('Cannot insert file if table is not links');
      file = _objects?.[0]?.file;
      delete _objects?.[0]?.file;
      if (typeof(file) !== 'string' && !(file instanceof Blob)) throw new Error('File must be a string or Blob');
    }

    const toApply: any = [];
    if (this.minilinks && local !== false) {
      const errors = [];
      const { objects: __objects } = convertDeepInsertToMinilinksApplyAndPatchVirtualIds(this, _objects, table, toApply, errors) as any;
      _objects = __objects;
      if (errors.length) console.log('convertDeepInsertToMinilinksApplyAndPatchVirtualIds', 'errors', errors);
      this.minilinks.add(toApply);
    }

    let mutate;

    if (remote !== false) {
      try {
        mutate = generateSerial({
          actions: [insertMutation(table, { ...variables, objects: _objects }, { tableName: table, operation: 'insert', returning })],
          name: name,
        });
        q = await this.apolloClient.mutate(mutate);
      } catch(e) {
        const sqlError = e?.graphQLErrors?.[0]?.extensions?.internal?.error;
        if (sqlError?.message) e.message = sqlError.message;
        if (!this._silent(options)) throw new Error(`DeepClient Insert Error: ${e.message}`, { cause: e })
        this.emitter.emit('insert', { deep: this, name: _name, value: objects, options, remoteQuery: mutate, file, error: e, remote, local });
        return { ...q, data: (q)?.data?.m0?.returning, error: e };
      }
      if (file) {
        if (!toApply?.[0]?.id) throw new Error('Cannot insert file without link');
        await upload(toApply[0].id, file, this);
      };
    } else {
      this.emitter.emit('insert', { deep: this, name: _name, value: objects, options, remoteQuery: mutate, file, remote, local });
      return { ...q, data: toApply.map(l => l.id), loading: false };
    }

    this.emitter.emit('insert', { deep: this, name: _name, value: objects, options, remoteQuery: mutate, remote, local, error: q.error });

    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  }; 

  /**
   * Updates a value in the database. By default updates a link in the links table
   * @param _exp An expression to filter the objects to update
   * @param value A value to update the objects with
   * @param options An object with options for the update operation
   * @returns A promise that resolves to the updated object or an array of updated objects with the fields configured by {@link options.returning} which is by default 'id'
   * 
   * @example
   * #### Update from by id
   * ``` 
   * await deep.update({
   *   id: 888
   * }, {
   *   from_id: 1
   * })
   * ```
   * In this case from_id will be updated to 1 for link with id 888
   * 
   * #### Update to by id
   * ``` 
   * await deep.update({
   *   id: 888
   * }, {
   *   to_id: 1
   * })
   * ```
   * In this case to_id will be updated to 1 for link with id 888
   * 
   * #### Update string value by link id
   * ``` 
   * await deep.update(
   *   {
   *     link_id: 888
   *   },
   *   {
   *     value: "MyStringValue"
   *   },
   *   {
   *     table: 'strings'
   *   }
   * )
   * ```
   * In this case string value will be updated to "MyStringValue" for link with id 888
   * 
   * #### Update number value by link id
   * ``` 
   * await deep.update(
   *   {
   *     link_id: 888
   *   },
   *   {
   *     value: 888
   *   },
   *   {
   *     table: 'numbers'
   *   }
   * )
   * ```
   * In this case number value will be updated to 888 for link with id 888
   * 
   * #### Update object value by link id
   * ``` 
   * await deep.update(
   *   {
   *     link_id: 888
   *   },
   *   {
   *     value: {
   *       myFieldName: "myFieldValue"
   *     }
   *   },
   *   {
   *     table: 'numbers'
   *   }
   * )
   * ```
   * In this case number value will be updated to { myFieldName: "myFieldValue" } for link with id 888
   */
  async update<TTable extends 'links'|'numbers'|'strings'|'objects'>(exp: Exp<TTable> | Id, value: UpdateValue<TTable>, options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>> {
    const _exp: Exp<TTable> = typeof(exp) === 'number' ? { id: exp } as any : exp;
    if (_exp === null) return this.insert( [value], options);
    if (value === null) return this.delete( _exp, options );
    const table = options?.table || this.table;

    const _name = random();

    if (isEqual(_exp, {})) throw new Error('exp {} is wrong');

    const keys = Object.keys(_exp);
    for (let k in keys) {
      const key = keys[k];
      _exp[addIdsToRelationsIfSimple(_exp, key, table)] = _exp[key];
    }
    
    const o: any = { local: this.local, remote: this.remote, ...options };
    this.handleOperation && this.handleOperation('update', _exp, value, o);
    const { local, remote } = o;
    this.emitter.emit('update.before', { deep: this, name: _name, query: _exp, value, options, remote, local });

  
    const query = serializeQuery(_exp, options?.table === this.table || !options?.table ? 'links' : 'value', this.unvertualizeId);

    const toUpdate: any = [];
    if (this.minilinks && local !== false) {
      convertDeepUpdateToMinilinksApply(this.minilinks, _exp, value, table, toUpdate);
      this.minilinks.update(toUpdate);
    }

    const returning = options?.returning || this.updateReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultUpdateName;
    let q;

    let mutate;
    if (remote !== false) {
      try {
        mutate = generateSerial({
          actions: [updateMutation(table, { ...variables, ...query, _set: value }, { tableName: table, operation: 'update', returning })],
          name: name,
        });
        q = await this.apolloClient.mutate(mutate);
      } catch(e) {
        const sqlError = e?.graphQLErrors?.[0]?.extensions?.internal?.error;
        if (sqlError?.message) e.message = sqlError.message;
        if (!this._silent(options)) throw new Error(`DeepClient Update Error: ${e.message}`, { cause: e });
        this.emitter.emit('update', { deep: this, name: _name, query: _exp, value, options, remoteQuery: mutate, remote, error, local, toUpdate });
        return { ...q, data: (q)?.data?.m0?.returning, error: e };
      }
    } else {
      this.emitter.emit('update', { deep: this, name: _name, query: _exp, value, options, remoteQuery: mutate, remote, local, toUpdate });
      return { ...q, data: toUpdate.map(l => l.id), loading: false };
    }

    this.emitter.emit('update', { deep: this, name: _name, query: _exp, value, options, remoteQuery: mutate, remote, local, toUpdate, error: q.error });

    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  /**
   * Deletes a value in the database. By default deletes a link in the links table
   * @param _exp An expression to filter the objects to delete
   * @param options An object with options for the delete operation
   * @returns A promise that resolves to the deleted object or an array of deleted objects with the fields configured by {@link options.returning} which is by default 'id'
   * 
   * @example
   * #### Delete by id
   * ``` 
   * await deep.delete({
   *   id: 888
   * })
   * ```
   * In this case the link with id 888 will be deleted
   * 
   * #### Delete by type_id
   * ``` 
   * await deep.delete({
   *   type_id: 888
   * })
   * ```
   * In this case all the links with type_id 888 will be deleted
   * 
   * #### Delete by from_id
   * ``` 
   * await deep.delete({
   *   from_id: 888
   * })
   * ```
   * In this case all the links with from_id 888 will be deleted
   * 
   * #### Delete by to_id
   * ``` 
   * await deep.delete({
   *   to_id: 888
   * })
   * ```
   * In this case all the links with to_id 888 will be deleted
   * 
   * #### Delete by string value
   * ``` 
   * await deep.delete({
   *   string: {
   *     value: {
   *       _eq: 'MyString'
   *     }
   *   }
   * })
   * ```
   * In this case all the links with string value 'MyString' will be deleted
   * 
   * #### Delete by number value
   * ``` 
   * await deep.delete({
   *   number: {
   *     value: {
   *       _eq: 888
   *     }
   *   }
   * })
   * ```
   * In this case all the links with number value 888 will be deleted
   * 
   * #### Delete by object value
   * ``` 
   * await deep.delete({
   *   object: {
   *     value: {
   *       _eq: {
   *         myFieldKey: "myFieldValue"
   *       }
   *     }
   *   }
   * })
   * ```
   * In this case all the links with object value { myFieldName: "myFieldValue" } will be deleted
   * 
   * #### Delete string value by link id
   * ``` 
   * await deep.delete({
   *   link_id: 888
   * }, {
   *   table: 'strings'
   * })
   * ```
   * In this case string value of a link with id 888 will be deleted
   * 
   * #### Delete number value by link id
   * ``` 
   * await deep.delete({
   *   link_id: 888
   * }, {
   *   table: 'numbers'
   * })
   * ```
   * In this case number value of a link with id 888 will be deleted
   * 
   * #### Delete object value by link id
   * ``` 
   * await deep.delete({
   *   link_id: 888
   * }, {
   *   table: 'objects'
   * })
   * ```
   * In this case object value of a link with id 888 will be deleted
   */
  async delete<TTable extends 'links'|'numbers'|'strings'|'objects'>(exp: Exp<TTable> | Id, options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>> {
    const _exp: Exp<TTable> = typeof(exp) === 'number' ? { id: exp } as any : exp;
    if (!_exp) throw new Error('!exp');
    const o: any = { local: this.local, remote: this.remote, ...options };
    
    const _name = random();
    
    this.handleOperation && this.handleOperation('delete', _exp, null, o);
    const { local, remote } = o;
    this.emitter.emit('delete.before', { deep: this, name: _name, query: _exp, options, remote, local });

    if (isEqual(_exp, {})) throw new Error('exp {} is wrong');

    const query = serializeQuery(_exp, options?.table === this.table || !options?.table ? 'links' : 'value', this.unvertualizeId);
    const table = options?.table || this.table;
    const returning = options?.returning || this.deleteReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultDeleteName;
    let q;


    const toDelete: any = [];
    const toUpdate: any = [];
    if (this.minilinks && local !== false) {
      convertDeepDeleteToMinilinksApply(this.minilinks, _exp, table, toDelete, toUpdate);
      this.minilinks.update(toUpdate);
      this.minilinks.remove(toDelete);
    }

    let mutate;
    if (remote !== false) {
      try {
        mutate = generateSerial({
          actions: [deleteMutation(table, { ...variables, ...query, returning }, { tableName: table, operation: 'delete', returning })],
          name: name,
        });
        q = await this.apolloClient.mutate(mutate);
        // @ts-ignore
      } catch(e) {
        const sqlError = e?.graphQLErrors?.[0]?.extensions?.internal?.error;
        if (sqlError?.message) e.message = sqlError.message;
        if (!this._silent(options)) throw new Error(`DeepClient Delete Error: ${e.message}`, { cause: e });
        this.emitter.emit('delete', { deep: this, name: _name, query: _exp, options, remoteQuery: mutate, error: e, remote, local, toUpdate });
        return { ...q, data: (q)?.data?.m0?.returning, error: e };
      }
    } else {
      this.emitter.emit('delete', { deep: this, name: _name, query: _exp, options, remoteQuery: mutate, remote, local, toDelete });
      return { ...q, data: toDelete.map(l => l.id), loading: false };
    }
    
    this.emitter.emit('delete', { deep: this, name: _name, query: _exp, options, remoteQuery: mutate, remote, local, toDelete, error: q.error });
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  /**
   * Performs write operations to the database in a serial manner
   * @param options An object with data for the serial operation
   * @returns A promise that resolves to the deleted object or an array of deleted objects with the fields configured by {@link options.returning} which is by default 'id'
   */
  async serial(options: AsyncSerialParams): Promise<DeepClientResult<{ id: Id }[]>> {
    const {
      name, operations, returning, silent
    } = options;
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
            const query = serializeQuery(exp, table === this.table || !table ? 'links' : 'value', this.unvertualizeId);
            return updateMutation(table, {...query, _set: value }, { tableName: table, operation: operationType ,returning})
          })
          serialActions = [...serialActions, ...newSerialActions];
        } else if (operationType === 'delete') {
          const deleteOperations = operations as Array<SerialOperation<'delete', Table<'delete'>>>;;
          const newSerialActions: IGenerateMutationBuilder[] = deleteOperations.map(operation => {
            const exp = operation.exp;
            const query = serializeQuery(exp, table === this.table || !table ? 'links' : 'value', this.unvertualizeId);
            return deleteMutation(table, { ...query }, { tableName: table, operation: operationType, returning })
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
      if (!silent) throw new Error(`DeepClient Serial Error: ${e.message}`, { cause: e });
      return { ...result, data: (result)?.data?.m0?.returning, error: e };
    }
    // @ts-ignore
    return { ...result, data: (result)?.data && Object.values((result)?.data).flatMap(m => m.returning)};
  };

  reserve<LL = L>(count: number): Promise<Id[]> {
    return reserve({ count, client: this.apolloClient });
  };

  /**
   * Await for a promise
   * @param id Id of a link which is processed by a handler
   * @param options An object with options for the await operation
   * @returns A promise that resolves to the result of the awaited promise
   * 
   * @example
   * #### Await a promise of npm-packager
   * Let us imagine you have published a package and want to programatically wait until it is published or failed to publish
   * ```
   * await deep.await(
   *   await deep.id('my-package-name')
   * )
   * ```
   * In this case you will await all the promises for 'my-package-name' link
   */
  async await(id: Id, options: { results: boolean } = { results: false } ): Promise<any> {
    return awaitPromise({
      id, client: this.apolloClient,
      Then: await this.id('@deep-foundation/core', 'Then'),
      Promise: await this.id('@deep-foundation/core', 'Promise'),
      Resolved: await this.id('@deep-foundation/core', 'Resolved'),
      Rejected: await this.id('@deep-foundation/core', 'Rejected'),
      Results: options.results
    });
  };

  async value(id: Id, value?: string | number | Object | Blob) {
    if (value === undefined) {
      if (arguments.length === 2) throw new Error(`Trying to set undefined as value for ${id} .`);
      return {
        id: id,
        data: (await this.select(id))?.data?.[0]?.value?.value,
      };
    } else {
      const { data: [link] } = await this.select(id);
      if (!link) throw new Error(`The link ##${id} not founded`);
      const { data: [Value] } = await this.select({
        type_id: this.idLocal('@deep-foundation/core', 'Value'),
        from_id: link.type_id,
      });
      if (!Value) throw new Error(`The link ##${id} cannot have a value, its type is not bound |-Value-> String|Number|Object|File`);
      const type = Value.to_id ===  this.idLocal('@deep-foundation/core', 'String') ? 'string' : Value.to_id ===  this.idLocal('@deep-foundation/core', 'Number') ? 'number' : Value.to_id ===  this.idLocal('@deep-foundation/core', 'Object') ? 'object' : undefined;
      if (!type) throw new Error(`Type of ##${id}- - > ##${Value.from_id} |-Value-> ##${Value.id} is not compatable with .value()`);
      const table: any = type+'s';
      let result;
      if (Value?.to_id === this.idLocal('@deep-foundation/core', 'File')) {
        if (typeof(value) !== 'string' && !(value instanceof Blob)) throw new Error('File must be a string or Blob');
        await upload(id, value, this);
      } else {
        if (link?.value) {
          result = await this.update({ link_id: id } as any, { value }, { table });
        } else {
          result = await this.insert({ link_id: id, value }, { table });
        }
      }
      return {
        ...result,
        link,
        Value,
        data: value,
      };
    }
  }

  /**
   * Find id of a link by link name or id and contain values (names) as path items
   * @param start A name or id of a link
   * @param path Contain values (names) as path items
   * @returns A promise that resolves to the id of the link
   * 
   * @example
   * #### Get Core Package Link Id
   * ```
   * const corePackageLinkId = await deep.id("@deep-foundation/core")
   * ```
   * 
   * #### Get User Type Link Id From Core Package
   * ```
   * const userTypeLinkId = await deep.id("@deep-foundation/core", "User")
   * ```
   * 
   * #### Get the link called "My Nested Link Name" contained in the link called "My Link Name" contained the current user
   * ```
   * const myLinkId = await deep.id(deep.linkId, 'My Link Name', 'My Nested Link Name')
   * ```
   * 
   * #### Get Admin Link Id
   * ```
   * const adminLinkId = await deep.id("deep", "admin")
   * ```
   */
  async id(start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]): Promise<number> {
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

  /**
   * This function fetches the corresponding IDs from the Deep for each specified path.
   *
   * @async
   * @function ids
   * @param {Array<[DeepClientStartItem, ...DeepClientPathItem[]]>} paths - An array of [start, ...path] tuples.
   *     Each tuple specifies a path to a link, where 'start' is the package name or id 
   *     and ...path further specifies the path to the id using Contain link values (names).
   *
   * @returns {Promise<any>} - Returns a Promise that resolves to an object.
   *    The object has keys corresponding to the package name or id of each path.
   *    The value for each package key is an object where keys are the items in the corresponding path,
   *    and the values are the IDs retrieved from the Deep.
   * 
   * @throws Will throw an error if the id retrieval fails in `this.id()` function.
   * 
   * @example
   * ```ts
   *   const ids = await deep.ids([
   *     ['@deep-foundation/core', 'Package'], 
   *     ['@deep-foundation/core', 'PackageVersion']
   *   ]);
   * 
   *   // Outputs
   *   // {
   *   //   "@deep-foundation/core": {
   *   //     "Package": 2,
   *   //     "PackageVersion": 46
   *   //   }
   *   // }
   * ```
   */
  async ids(...paths: Array<[DeepClientStartItem, ...DeepClientPathItem[]]>): Promise<any> {
    // TODO: it can be faster using a combiniation of simple select of packages and contains with specified names and recombination of these links in minilinks
    
    // At the moment it may be slow, but it demonstrates desired API.

    const appendPath = (accumulator, keys, value) => {
      const lastKey = keys.pop();
      const lastObject = keys.reduce((obj, key) => obj[key] = obj[key] || {}, accumulator);
      lastObject[lastKey] = value;
    };
    const result = {};
    await Promise.all(paths.map(async ([start, ...path]) => {
      const id = await this.id(start, ...path);
      appendPath(result, [start, ...path], id);
    }));
    return result;
  }

  /**
   * Find id of a link from minilinks by link name or id and contain values (names) as path items
   * @param start A name or id of a link
   * @param path Contain values (names) as path items
   * @returns A promise that resolves to the id of the link
   * 
   * @example
   * #### Get Core Package Link Id
   * ```
   * const corePackageLinkId = deep.idLocal("@deep-foundation/core")
   * ```
   * 
   * #### Get User Type Link Id From Core Package
   * ```
   * const userTypeLinkId = deep.idLocal("@deep-foundation/core", "User")
   * ```
   * 
   * #### Get the link called "My Nested Link Name" contained in the link called "My Link Name" contained the current user
   * ```
   * const myLinkId = deep.idLocal(deep.linkId, 'My Link Name', 'My Nested Link Name')
   * ```
   * 
   * #### Get Admin Link Id
   * ```
   * const adminLinkId = deep.idLocal("deep", "admin")
   * ```
   */
  idLocal(start: DeepClientStartItem, ...path: DeepClientPathItem[]): Id {
    return this.minilinks.id(start, ...path);
  };

  /**
   * Logs in as a guest
   * @param options An object with options for the guest login operation
   * @returns A promise that resolves to the result of the guest login operation
   * 
   * @example
   * ```
   * const apolloClient = generateApolloClient({
   *   path: NEXT_PUBLIC_GQL_PATH,
   *   ssl: true,
   * });
   * const unloginedDeep = new DeepClient({ apolloClient });
   * const guestLoginResult = await unloginedDeep.guest();
   * const guestDeep = new DeepClient({ deep: unloginedDeep, ...guestLoginResult });
   * ```
   */
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
   * Returns id of the current user
   * 
   * @example
   * ```
   * const myLinkId = await deep.whoami()
   * ```
   */
  async whoami(): Promise<number | undefined> {
    const result = await this.apolloClient.query({ query: WHOISME });
    this.linkId = result?.data?.jwt?.linkId;
    return result?.data?.jwt?.linkId;
  }

  /**
   * Performs a login operation
   * @param options An object with options for the login operation
   * @returns A promsie that resolves to the result of the login operation
   * 
   * @example
   * ```
   * const apolloClient = generateApolloClient({
   *   path: NEXT_PUBLIC_GQL_PATH,
   *   ssl: true,
   * });
   * const unloginedDeep = new DeepClient({ apolloClient });
   * const guestLoginResult = await unloginedDeep.guest();
   * const guestDeep = new DeepClient({ deep: unloginedDeep, ...guestLoginResult });
   * const adminLoginResult = await guestDeep.login({
   *   linkId: await guestDeep.id('deep', 'admin'),
   * });
   * const deep = new DeepClient({ deep: guestDeep, ...adminLoginResult });
   * ```
   */
  async login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult> {
    return await this.jwt({ ...options, relogin: true })
  };

  /**
   * Performs a logout operation
   * @param options An object with options for the logout operation
   * @returns A promsie that resolves to the result of the logout operation
   */
  async logout(): Promise<DeepClientAuthResult> {
    if (this?.handleAuth) setTimeout(() => this?.handleAuth(0, ''), 0);
    return { linkId: 0, token: '' };
  };

  /**
   * Checks whether {@link subjectUds} can perform {@link actionIds} on {@link objectIds}
   * @param objectIds A link id or an array of link ids to check whether the {@link subjectUds} can perform the {@link actionIds} on
   * @param subjectIds A link id or an array of link ids to check whether they can perform the {@link actionIds} on the {@link objectIds}
   * @param actionIds A link id or an array of link ids to check whether the {@link subjectUds} can perform on the {@link objectIds}
   * @param userIds A link id or an array of link ids from which perspective the check is performed
   * @returns A promise that resolves to a boolean value indicating whether the {@link subjectUds} can perform the {@link actionIds} on the {@link objectIds}
   */
  async can(objectIds: null | Id | Id[], subjectIds: null | Id | Id[], actionIds: null | Id | Id[], userIds: Id | Id[] = this.linkId): Promise<boolean> {
    const where: any = {
    };
    if (objectIds) where.object_id = typeof(objectIds) === 'number' ? { _eq: +objectIds } : { _in: objectIds };
    if (subjectIds) where.subject_id = typeof(subjectIds) === 'number' ? { _eq: +subjectIds } : { _in: subjectIds };
    if (actionIds) where.action_id = typeof(actionIds) === 'number' ? { _eq: +actionIds } : { _in: actionIds };
    const result = await this.select(where, { table: 'can', returning: 'rule_id' });
    return !!result?.data?.length;
  }

  /**
   * Returns a symbol icon of a link {@link input} that is located in a value of a Symbol link to type of the link {@link input}
   * 
   * @example
   * ```
   * const userTypeLinkId = await deep.id("@deep-foundation/core", "User");
   * const userTypeLinkSymbol = await deep.symbol(userTypeLinkId);
   * ```
   */
  async symbol(input: Link<Id> | Id): Promise<string | undefined> {
    const id = typeof(input) === 'number' || typeof(input) === 'string' ? input : input.id;

    // if ((this.minilinks.byId[id] as Link<Id>)?.type_id === this.idLocal('@deep-foundation/core', 'Package')) return (this.minilinks.byId[id] as Link<Id>)?.value?.value;
    return this.minilinks.byId[id]?.inByType?.[_ids['@deep-foundation/core']['Symbol']]?.[0]?.value?.value || this.minilinks.byId[id]?.type?.inByType?.[_ids['@deep-foundation/core']['Symbol']]?.[0]?.value?.value || '📍';
  };

  /**
   * Returns a symbol icon of a link {@link input} that is located in a value of a Symbol link to type of the link {@link input} according to links stored in minilinks
   * 
   * @example
   * ```
   * const userTypeLinkId = await deep.id("@deep-foundation/core", "User");
   * const userTypeLinkSymbol = deep.symbolLocal(userTypeLinkId);
   * ```
   */
  symbolLocal(input: Link<Id> | Id): string | undefined {
    return this.minilinks.symbol(input);
  }

  /**
   * Returns a name of a link {@link input} that is located in a value of a contain link pointing to the link {@link input}
   * 
   * @example
   * ```
   * const userTypeLinkId = await deep.id("@deep-foundation/core", "User");
   * const userTypeLinkName = await deep.name(userTypeLinkId);
   * ```
   */
  async name(input: Link<Id> | Id): Promise<string | undefined> {
    const id = typeof(input) === 'number' || typeof(input) === 'string' ? input : input.id;

    // if ((this.minilinks.byId[id] as Link<Id>)?.type_id === this.idLocal('@deep-foundation/core', 'Package')) return (this.minilinks.byId[id] as Link<Id>)?.value?.value;
    const {data: [containLink]} = await this.select({
      type_id: { _id: ['@deep-foundation/core', 'Contain'] },
      to_id: id,
    });
    if (!containLink?.value?.value) {
      const {data: [packageLink]} = await this.select(id);
      if (packageLink?.type_id === this.idLocal('@deep-foundation/core', 'Package')) return packageLink?.value?.value;
    }
    // @ts-ignore
    return containLink?.value?.value;
  };

  /**
   * Returns a name of a link {@link input} that is located in a value of a contain link pointing to the link {@link input} according to links stored in minilinks
   * 
   * @example
   * ```
   * const userTypeLinkId = await deep.id("@deep-foundation/core", "User");
   * const userTypeLinkName = deep.nameLocal(userTypeLinkId);
   * ```
   * Note: "@deep-foundation/core" package, "User" link, Contain link pointing from "@deep-foundation/core" to "User" must be in minilinks
   */
  nameLocal(input: Link<Id> | Id): string | undefined {
    return this.minilinks.name(input);
  }

  /**
   * Imports from a library
   * @param path A path to import from
   * @returns A promise that resolves to the imported value
   * 
   * @remarks
   * Is able to import CommoJS and ESModule libraries.
   * This is the recommended way to import from libraries in deep handlers
   * 
   * @example
   * #### Async handler using import
   * ```
   * async ({deep}) => {
   *   const importResult = await deep.import("my-lib-name");
   * }
   * ```
   */
  async import(path: string) : Promise<any> {
    if (typeof DeepClient.resolveDependency !== 'undefined') {
      try {
        return await DeepClient.resolveDependency(path);
      } catch (e) {
        console.log(`IGNORED ERROR (ignore if you don't see other errors): Call to DeepClient.resolveDependency is failed with`, e);
      }
    }
    if (typeof require !== 'undefined') {
      try {
        return await require(path);
      } catch (e) {
        console.log(`IGNORED ERROR (ignore if you don't see other errors): Call to require is failed with`, e);
      }
    }
    return await import(path);
  }

  Traveler(links: Link<Id>[]) {
    return new NativeTraveler(this, links);
  };
  Packager() {
    return new Packager(this);
  }

  async _findHandler({
    handlerId, context = [],
    execution_provider_id,
    isolation_provider_id,
  }: {
    handlerId?: Id; context?: Id[];
    execution_provider_id?: number;
    isolation_provider_id?: number;
  }): Promise<void | Handler> {
    if (handlerId) {
      const { data: handlers }: { data: Handler[] } = await this.select(({
        execution_provider_id: { _eq: execution_provider_id || this.idLocal('@deep-foundation/core', 'JSExecutionProvider'), },
        ...(isolation_provider_id ? { isolation_provider_id: { _eq: isolation_provider_id, } } : {}),
        _or: [
          { handler_id: { _eq: handlerId } },
          { dist_id: { _eq: handlerId } },
          ({ src_id: { _eq: handlerId } } as BoolExpHandler),
        ],
      } as BoolExpHandler), { table: 'handlers', returning: 'handler_id dist_id src_id' },);
      if (handlers?.[0]) return handlers?.[0];
    } else {
      const { data: handlers }: { data: Handler[] } = await this.select({
        execution_provider_id: { _eq: this.idLocal('@deep-foundation/core', 'JSExecutionProvider'), },
        ...(isolation_provider_id ? { isolation_provider_id: { _eq: isolation_provider_id, } } : {}),
        handler: {
          in: {
            type_id: { _eq: await this.id('@deep-foundation/deepcase', 'Context') },
            from_id: { _in: context }
          },
        },
      }, { table: 'handlers', returning: 'handler_id dist_id src_id' },);
      if (handlers?.[0]) return handlers?.[0];
    }
  }

  _queryTypesNamesSymbols() {
    const Contain = _ids?.['@deep-foundation/core']?.Contain;
    const Symbol = _ids?.['@deep-foundation/core']?.Symbol;
    return {
      return: {
        _contain: { relation: 'in', type_id: Contain },
        _symbol: { relation: 'in', type_id: Symbol },
        _type: {
          relation: 'type',
          return: {
            _contain: { relation: 'in', type_id: Contain },
            _symbol: { relation: 'in', type_id: Symbol },
          },
        },
      },
    };
  }

  async eval({
    linkId, handlerId, value, context = [],
    input,
  }: {
    linkId?: Id; // if only setted, auto find handlerId by context
    value?: string; // string to execute, using only if handlerId not setted
    handlerId?: Id; // if setted - ignore value
    context?: Id[];

    input?: any;
  }): Promise<{
    error?: any;
    data?: any;
  }> {
    let code = value;
    let handler;
    if (handlerId || (!value && linkId)) {
      handler = await this._findHandler({ handlerId, context });
      const { data: [file] } = await this.select(handler?.dist_id);
      code = file?.value?.value;
    }
    return evalClientHandler({
      value: code, input, deep: this,
    });
  }

  isId(id: any): boolean {
    return typeof(id) === 'string' || (typeof(id) === 'number' && !isNaN(id));
  }
  isLink(link: any): boolean {
    return typeof(link) === 'object' && link instanceof MinilinksLink;
  }

  get(...id: Id[]): MinilinksLink<Id> | undefined {
    const [founded] = this.minilinks.select({ id: { _id: id as any } });
    return founded;
  }

  async getRemote(...id: Id[]): Promise<MinilinksLink<Id> | undefined> {
    return (await this.select({ id: { _id: id as any } }))?.data?.[0] as any;
  }

  async search(value: string, options: DeepSearchOptions = {}) {
    const o = { remote: true, count: false, sort: true, ...options };
    const query = this.searchQuery(value, o);
    let results;
    if (o.remote) {
      results = await this.select(query, { apply: o.apply, ...(o.count ? { aggregate: 'count' } : {}) });
    } else {
      results = { data: this.minilinks.select(query,  { ...(o.count ? { aggregate: 'count' } : {}) }), query };
    }
    if (o.sort) {
      const sorted = sort(results.data, value);
      results.data = sorted.data;
      results.ids = sorted.ids;
    } else {
      const ids = results.ids = {};
      if (results?.data?.length) for (let i in results.data) ids[results?.data?.[i]?.id];
    }
    return results;
  }

  searchQuery(value, options) {
    const o = { values: false, contains: false, regexp: false, ...options };
    const num = parseFloat(value);
    const _q = o.query || {};
    const q: any = { ..._q, _or: [...(_q?._or || [])] };
    const _or = q._or;
    if (!Number.isNaN(num)) {
      _or.push({ id: num });
      if (o.values) _or.push({ number: { value: num } });
    }
    if (o.values || o.contains) {
      if (o.regexp) _or.push({ string: { value: { _iregex: value } } });
      else _or.push({ string: { value: { _ilike: `%${value}%` } } });
    };
    _or.push({ in: { type_id: this.idLocal('@deep-foundation/core', 'Contain'), string: { value: o.regexp ? { _iregex: value } : { _ilike: `%${value}%` } } } });
    _or.push({ type_id: this.idLocal('@deep-foundation/core', 'Package'), string: { value: o.regexp ? { _iregex: value } : { _ilike: `%${value}%` } } });
    if (!o.contains) q._not = { type_id: this.idLocal('@deep-foundation/core', 'Contain') };
    else if (!o.values) q.type_id = this.idLocal('@deep-foundation/core', 'Contain');
    return q;
  }

  url(target: 'deeplinks' | 'gql') {
    return target === 'gql' ? this.client.path : `http${this.client.ssl ? 's' : ''}://${this.client.path.slice(0, this.client.path.indexOf('/gql'))}`
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
  return useLocalStore<Id>('use_auth_link_id', 0);
}

export type INamespaces = {
  [name: string]: any;
};
export const DeepNamespaceContext = createContext<{
  all: () => INamespaces;
  select: (namespace: string) => any;
  insert: (namespace: string, deep: any) => void;
  delete: (namespace: string) => void;
}>({
  all: () => ({}),
  select: (namespace: string) => {},
  insert: (namespace: string, deep: any) => {},
  delete: (namespace: string) => {},
});
export const DeepNamespacesContext = createContext<INamespaces>({});

export function useDeepNamespaces() {
  return useContext(DeepNamespacesContext);
};

export function useDeepNamespace(namespace, deep) {
  const namespaces = useContext(DeepNamespaceContext);
  const nameRef = useRef();
  useMemo(() => {
    if (
      (!!nameRef.current && nameRef.current != namespace)
    ) {
      namespaces.delete(nameRef.current);
    }
    if (namespace) {
      if (namespaces.select(namespace) !== deep) {
        namespaces.delete(namespace);
      }
      namespaces.insert(namespace, deep);
    }
  }, [namespace, deep]);
  useEffect(() => {
    return () => nameRef.current && namespaces.delete(namespace);
  }, []);
}
export function DeepNamespaceProvider({ children }: { children: any }) {
  const [namespaces, setNamespaces] = useState<INamespaces>({});
  const ref = useRef(namespaces);
  ref.current = namespaces;
  const api = useMemo(() => {
    return {
      all: () => ref.current,
      select: (namespace: string) => ref.current[namespace],
      insert: (namespace: string, deep: any) => {
        console.log('DeepNamespaceProvider', 'insert', namespace, deep);
        setNamespaces(namespaces => ({ ...namespaces, [namespace]: deep }));
      },
      delete: (namespace: string) => {
        console.log('DeepNamespaceProvider', 'delete', namespace);
        setNamespaces(namespaces => ({ ...namespaces, [namespace]: undefined }));
      },
    };
  }, []);
  useEffect(() => {
    console.log('DeepNamespaceProvider', 'mounted', api);
    // @ts-ignore
    if (typeof(window) == 'object') window.dn = api;
  }, []);
  return <DeepNamespaceContext.Provider value={api}>
    <DeepNamespacesContext.Provider value={namespaces}>
      {children}
    </DeepNamespacesContext.Provider>
  </DeepNamespaceContext.Provider>
}

export const DeepContext = createContext<DeepClient<Link<Id>>>(undefined);

export function useDeepGenerator(generatorOptions?: DeepClientOptions<Link<Id>>) {
  const { apolloClient: apolloClientProps, minilinks, ...otherGeneratorOptions } = generatorOptions;
  const log = debug.extend(useDeepGenerator.name)
  const apolloClientHook = useApolloClient();
  log({apolloClientHook})
  const apolloClient: IApolloClient<any> = apolloClientProps || apolloClientHook;
  log({apolloClient})

  const [token, setToken] = useTokenController();
  log({token, setToken})

  const deep = useMemo(() => {
    if (!apolloClient?.jwt_token) {
      log({ token, apolloClient });
    }
    try {
      return new DeepClient({
        ...otherGeneratorOptions,
        apolloClient, token,
        minilinks,
        handleAuth: (linkId, token) => {
          setToken(token);
        },
      });
    } catch(error) {
      console.error(error);
      return undefined;
    }
  }, [apolloClient]);
  log({deep})
  return deep;
}

// export const DeepQueriesContext = createContext<any>(undefined);
// export const DeepQueriesActionsContext = createContext<any>(undefined);
// export function usDeepeQueries() {

// }
// export function usDeepeActions() {

// }
// export const DeepQueriesProvider = React.memo(function DeepQueriesProvider({
//   linkId,
//   children = null,
// }: {
//   linkId: Id;
//   children?: any;
// }) {
//   const prevA = useContext(DeepQueriesActionsContext);
//   const nextQ = useState({
//     linkId,
//     useQuery: {}, useSubscription: {},
//     select: {}, subscription: {}, insert: {}, update: {}, delete: {}, children: {}
//   });
//   if (prevA) 
//   return <DeepQueriesActionsContext.Provider value={nextQ}>children</DeepQueriesActionsContext.Provider>;
// }, () => true)

export function DeepProvider({
  apolloClient: apolloClientProps,
  minilinks: inputMinilinks,
  namespace,
  children,
}: {
  apolloClient?: IApolloClient<any>,
  minilinks?: MinilinkCollection,
  namespace?: string;
  children?: any;
}) {
  const providedMinilinks = useMinilinks();
  const deep = useDeepGenerator({
    apolloClient: apolloClientProps,
    minilinks: inputMinilinks || providedMinilinks,
    namespace,
  });
  useDeepNamespace(namespace, deep);
  return <DeepContext.Provider value={deep}>
    {children}
  </DeepContext.Provider>;
}

export function useDeep() {
  return useContext(DeepContext);
}

export function useTransparentState(value) {
  return [value, (value: any) => {}];
}

export function useDebouncedInput(query: any, options: any, debounce: number | boolean) {
  const _debounce = debounce === true ? 1000 : debounce;
  const [{ _q, _o }, setTemp] = debounce ? useDebounce({ _q: query, _o: options }, _debounce || 1000) : useTransparentState({ _q: query, _o: options });
  useEffect(() => {
    if (debounce) setTemp({ _q: query, _o: options });
  }, [debounce, query, options]);
  return { _q, _o };
}

export function useDeepQuery<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = Link<Id>>(
  query: Exp<Table>,
  options?: Options<Table>,
): {
  data?: LL[];
  error?: any;
  loading: boolean;
  refetch?: () => Promise<any>;
} {
  const miniName = useMemo(() => options?.mini || random(), []);
  debug('useDeepQuery', miniName, query, options);
  const _deep = useDeep();
  const deep = options?.deep || _deep;
  useMemo(() => {
    deep.emitter.emit('useQuery.mount', { name: miniName, deep, query, options });
  }, []);
  const prevRef = useRef({ query, options });
  const { _q, _o } = useDebouncedInput(query, options, options?.debounce);
  const { query: q, options: o } = useMemo(() => {
    const obj = { query: _q, options: { table: 'links' as Table, ..._o } };
    if (isEqual(obj, prevRef.current)) return prevRef.current = obj;
    else return obj;
  }, [_q, _o])
  const wq = useMemo(() => {
    return deep._generateQuery<Table>(q, { ...o });
  }, [q, o]);
  const result = useQuery(wq?.query?.query, { variables: wq?.query?.variables, client: deep.apolloClient, ...o });
  const [generatedResult, setGeneratedResult] = useState([]);
  useEffect(() => {
    if (o?.aggregate) setGeneratedResult((result)?.data?.q0?.aggregate?.[o.aggregate]);
    else {
      (async () => {
        setGeneratedResult(await deep._generateResult(q, o, result?.data?.q0));
      })();
    }
  }, [result]);
  const toReturn = {
    ...result,
    originalData: o?.aggregate ? result?.data?.q0?.aggregate : result?.data?.q0,
    data: generatedResult,
    options: o,
    deep,
    links: [],
    plainLinks: [],
    // @ts-ignore
    return: q?.return,
    name: miniName,
  };
  const { data: minilinksResults, plainLinks } = useMinilinksApply(deep.minilinks, miniName, toReturn);
  toReturn.data = o?.aggregate || o?.table !== 'links' ? toReturn.data || [] : minilinksResults;
  toReturn.links = minilinksResults;
  toReturn.plainLinks = plainLinks;
  useMemo(() => {
    deep.emitter.emit('useQuery', {
      name: miniName, deep, query, options: o,
      remoteQuery: wq,
      loading: result.loading,
      remoteData: result?.data?.q0,
      localData: minilinksResults,
      error: result.error,
      plainLinks,
    });
    return () => {
      deep.emitter.emit('useQuery.unmount', {
        name: miniName, deep, query, options: o,
        remoteQuery: wq,
        loading: result.loading,
        remoteData: result?.data?.q0,
        localData: minilinksResults,
        error: result.error,
        plainLinks,
      });
    };
  }, [toReturn]);
  return toReturn;
}

export function useDeepSubscription<Table extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = Link<Id>>(
  query: Exp<Table>,
  options?: Options<Table>,
): UseDeepSubscriptionResult<LL> {
  const miniName = useMemo(() => options?.mini || random(), []);
  debug('useDeepSubscription', miniName, query, options);
  const _deep = useDeep();
  const deep = options?.deep || _deep;
  useMemo(() => {
    deep.emitter.emit('useSubscription.mount', { name: miniName, deep, query, options });
  }, []);
  const prevRef = useRef({ query, options });
  const { _q, _o } = useDebouncedInput(query, options, options?.debounce);
  const { query: q, options: o } = useMemo(() => {
    const obj = { query: _q, options: { table: 'links' as Table, ..._o } };
    if (isEqual(obj, prevRef.current)) return prevRef.current = obj;
    else return obj;
  }, [_q, _o])
  const wq = useMemo(() => {
    return deep._generateQuery(q, { ...o, subscription: true });
  }, [q, o]);
  const result = useSubscription(wq?.query?.query, { variables: wq?.query?.variables, client: deep.apolloClient, ...o });
  const [generatedResult, setGeneratedResult] = useState([]);
  useEffect(() => {
    if (o?.aggregate) setGeneratedResult((result)?.data?.q0?.aggregate?.[o.aggregate]);
    else {
      if (!result.loading) {
        (async () => {
          setGeneratedResult(await deep._generateResult(q, o, result?.data?.q0));
        })();
      }
    }
  }, [result]);
  const toReturn = {
    ...result,
    originalData: o?.aggregate ? result?.data?.q0?.aggregate : result?.data?.q0,
    data: generatedResult,
    options: o,
    deep,
    links: [],
    plainLinks: [],
    // @ts-ignore
    return: q?.return,
    name: miniName,
    query: query as any,
  };
  const { data: minilinksResults, plainLinks } = useMinilinksApply(deep.minilinks, miniName, toReturn);
  toReturn.data = o?.aggregate || o?.table !== 'links' ? toReturn.data || [] : minilinksResults;
  toReturn.links = minilinksResults;
  toReturn.plainLinks = plainLinks;
  useMemo(() => {
    deep.emitter.emit('useSubscription', {
      name: miniName, deep, query, options: o,
      remoteQuery: wq,
      loading: result.loading,
      remoteData: result?.data?.q0,
      localData: minilinksResults,
      error: result.error,
      plainLinks,
    });
    return () => {
      deep.emitter.emit('useSubscription.unmount', {
        name: miniName, deep, query, options: o,
        remoteQuery: wq,
        loading: result.loading,
        remoteData: result?.data?.q0,
        localData: minilinksResults,
        error: result.error,
        plainLinks,
      });
    };
  }, [toReturn]);
  return toReturn;
}

export function sort(links, value) {
  const ids: any = {};
  return {
    data: matchSorter((links || []).map(l => {
      ids[l.id] = l;
      return { id: l.id, name: l.name, value: l?.value?.value };
    }), value, {keys: ['id','name','value']}).map((l: any) => ids[l.id]),
    ids,
  };
}

export function useSearch(value: string, options: DeepSearchOptions = {}) {
  const deep = useDeep();
  const o = useMemo(() => ({ skip: false, remote: true, count: false, sort: true, ...options }), [options]);
  const query = useMemo(() => this.searchQuery(value, o), [value, o]);
  const qo = useMemo(() => ({ ...(o.count ? { aggregate: 'count' } : {}), skip: o.skip }), [o.count, o.skip]);
  const useHook = useMemo(() => o.remote ? o.subscription ? deep.useSubscription : deep.useQuery : deep.useLocalQuery, [o.remote, o.subscription]);
  const { _q, _o } = useDebouncedInput(query, qo, options?.debounce);
  const _results: any = useHook(_q, _o as any);
  const results = o.remote ? _results : { data: _results };
  if (o.sort) {
    const sorted = useMemo(() => sort(results.data, value), [results.data]);
    results.data = sorted.data;
    results.ids = sorted.ids;
  } else {
    results.ids = useMemo(() => {
      const ids = {};
      if (results?.data?.length) for (let i = 0; i < results.data.length; i++) ids[results?.data?.[i]?.id] = results?.data?.[i];
      return ids;
    }, [results.data]);
  }
  results.query = _q;
  results.options = _q;
  return results;
}

export function useCan(objectId: null | Id | Id[], subjectId: null | Id | Id[], actionId: null | Id | Id[]): {
  data: boolean | void;
  loading: boolean;
  refetch: () => Promise<boolean>;
} {
  const deep = useDeep();
  const [can, setCan] = useState(undefined);
  const refetch = useCallback(async () => {
    const can = await deep.can(objectId, subjectId, actionId);
    setCan(can);
    return can;
  }, []);
  useEffect(() => {
    refetch()
  }, []);
  return { data: can, loading: typeof(can) === 'undefined', refetch: refetch };
}

export function useLink(link: Id | Link<Id>) {
  const deep = useDeep();
  const id = typeof(link) === 'object' ? link?.id : link;
  const [actual, setActual] = useState(deep.get(id));
  useEffect(() => {
    if (!id) return;
    const onLink = (o,n) => setActual(n || o);
    deep.minilinks.emitter.on(`link.${id}`, onLink);
    return () => {
      deep.minilinks.emitter.removeListener('removed', onLink);
    };
  }, []);
  return actual;
}

export function useLinks(...links: (Id | Link<Id>)[]): MinilinksLink<Id>[] {
  const deep = useDeep();
  const ids = useMemo(() => {
    return links.map(l => typeof(l) === 'object' ? l?.id : l);
  }, [links]);
  const [updated, setUpdated] = useState(0);
  useEffect(() => {
    const onLink = (o,n) => setUpdated(u => u+1);
    for (let i in ids) deep.minilinks.emitter.on(`link.${ids[i]}`, onLink);
    return () => {
      for (let i in ids) deep.minilinks.emitter.removeListener(`link.${ids[i]}`, onLink);
    };
  }, []);
  return useMemo(() => {
    return ids.map(id => id ? deep.get(id) : undefined);
  }, [updated]);
}

export interface UseDeepSubscriptionResult<LL = Link<Id>> {
  data?: LL[];
  error?: any;
  loading: boolean;
  query?: Exp;
}

export function useDeepId(start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]): { data: Id; loading: boolean; error?: any } {
  return useDeep().useDeepId(start, ...path);
}

export function _useDeepId(deep: DeepClient<Link<Id>>, start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]): { data: Id; loading: boolean; error?: any } {
  const result = deep.useDeepQuery({ id: { _id: [start, ...path] } });
  return { data: result?.data?.[0]?.id, loading: result?.loading, error: result?.error };
}

// export const Subscription = memo(function Subscription() {
  
// }, isEqual);

export type Exp<TTable extends Table = 'links'> = (
  TTable extends 'numbers' ? BoolExpValue<number> :
  TTable extends 'strings' ? BoolExpValue<string> :
  TTable extends 'objects' ? BoolExpValue<object> :
  TTable extends 'can' ? BoolExpCan :
  TTable extends 'selectors' ? BoolExpSelector :
  TTable extends 'tree' ? BoolExpTree :
  TTable extends 'handlers' ? BoolExpHandler :
  QueryLink
) | Id | Id[];

export type UpdateValue<TTable extends Table = 'links'> = (
  TTable extends 'numbers' ? MutationInputValue<number> :
  TTable extends 'strings' ? MutationInputValue<string> :
  TTable extends 'objects' ? MutationInputValue<any> :
  MutationInputLinkPlain
);

export type InsertObjects<TTable extends Table = 'links'> = (
  TTable extends 'numbers' ? MutationInputValue<number> :
  TTable extends 'strings' ? MutationInputValue<string> :
  TTable extends 'objects' ? MutationInputValue<any> :
  MutationInputLink
) | (
  TTable extends 'numbers' ? MutationInputValue<number> :
  TTable extends 'strings' ? MutationInputValue<string> :
  TTable extends 'objects' ? MutationInputValue<any> :
  MutationInputLink
)[]

export type Options<TTable extends Table = 'links'> = {
  table?: TTable;
  tableNamePostfix?: string;
  returning?: string;
  variables?: any;
  name?: string;
  aggregate?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  mini?: string;
  deep?: DeepClient<Link<Id>>;
  subscription?: boolean;
  apply?: string;
  skip?: boolean;
  debounce?: number | boolean;
};

export type ReadOptions<TTable extends Table = 'links'> = Options<TTable>;

export type WriteOptions<TTable extends Table = 'links'> = Options<TTable> & {
  silent?: boolean;
  remote?: boolean;
  local?: boolean;
  containerId?: Id;
}

