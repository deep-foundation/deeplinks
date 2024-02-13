import atob from 'atob';
import { gql, useQuery, useSubscription, useApolloClient, Observable } from '@apollo/client/index.js';
import type { ApolloQueryResult } from '@apollo/client/index.js';
import { generateApolloClient, IApolloClient } from '@deep-foundation/hasura/client.js';
import { useLocalStore } from '@deep-foundation/store/local.js';
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deprecate, inherits, inspect } from "util";
import { deleteMutation, generateMutation, generateQuery, generateQueryData, generateSerial, IGenerateMutationBuilder, IGenerateMutationOptions, insertMutation, ISerialResult, updateMutation } from './gql/index.js';
import { Id, Link, MinilinkCollection, minilinks, MinilinksInstance, MinilinksResult, useMinilinksApply, useMinilinksQuery, useMinilinksSubscription } from './minilinks.js';
import { awaitPromise } from './promise.js';
import { useTokenController } from './react-token.js';
import { reserve } from './reserve.js';
import { corePckg } from './core.js';
import { BoolExpCan, BoolExpHandler, QueryLink, BoolExpSelector, BoolExpTree, BoolExpValue, MutationInputLink, MutationInputLinkPlain, MutationInputValue } from './client_types.js';
import get from 'get-value';
import {debug} from './debug.js'
import { Traveler as NativeTraveler } from './traveler.js';
const moduleLog = debug.extend('cyberclient');
import { 
  Subscription,
  Observer,
  AsyncSerialParams, SerialOperation, SerialOperationType, Table,
  DeepClientOptions, DeepClientResult, DeepClientPackageSelector, DeepClientPackageContain, DeepClientLinkId, DeepClientStartItem, DeepClientPathItem,
  _serialize, _ids, _boolExpFields, pathToWhere, serializeWhere, serializeQuery, parseJwt,
  DeepClient, DeepClientAuthResult, DeepClientGuestOptions, DeepClientInstance,
  DeepClientJWTOptions, Exp, GUEST, InsertObjects, JWT, ReadOptions, UpdateValue, WHOISME, WriteOptions,
} from './client.js';
import { CyberClient } from '@cybercongress/cyber-js';
import _m0 from "protobufjs/minimal";

const log = debug.extend('log');
const error = debug.extend('error');

const corePckgIds: { [key: string]: Id; } = {};
corePckg.data.filter(l => !!l.type).forEach((l, i) => {
  corePckgIds[l.id] = i+1;
});

export interface Models {
  [model: string]: {
    out: { [field: string]: string };
    in: { [model: string]: { [field: string]: true } };
  };
};
export const model = (
  name: string,
  fields: { [field: string]: string },
  models: Models = {},
) => {
  const th = models[name] = {
    out: fields,
    in: {},
  };
  for (const f in fields) {
    if (models[fields[f]]) {
      models[fields[f]].in[name] = models[fields[f]].in[name] || {};
      models[fields[f]].in[name][f] = true;
    }
  }
  for (const m in models) {
    for (const f in models[m].out) {
      if (models[m].out[f] === name) {
        th.in[m] = th.in[m] || {};
        th.in[m][f] = true;
      }
    }
  }
};

export interface Schemas {
  byType?: { [type: string]: {
    from: string;
    to: string;
    get?: (deep, id) => Promise<any>;
  } };
  byFrom?: { [type: string]: string[] };
  byTo?: { [type: string]: string[] };
}

export const schema = (type, from = '', to = '', schemas: Schemas = {}) => {
  if (!schemas.byType) schemas.byType = {};
  if (!schemas.byFrom) schemas.byFrom = {};
  if (!schemas.byTo) schemas.byTo = {};
  schemas.byType[type] = { from, to };
  if (from) {
    schemas.byFrom[from] = schemas.byFrom[from] || [];
    schemas.byFrom[from].push(type);
  }
  if (to) {
    schemas.byTo[to] = schemas.byTo[to] || [];
    schemas.byTo[to].push(type);
  }
};

// model('account', {});
// model('tx', {
//   'coin_received.receiver': 'account',
//   'coin_spent.spender': 'account',
//   'message.sender': 'account',
//   'transfer.recipient': 'account',
//   'transfer.sender': 'account',
// });
// schema('tx', '', '');
// schema('txReceiver', 'tx', 'account');
// schema('txSender', 'tx', 'account');

export interface CONFIG {
  "CYBER_CONGRESS_ADDRESS": string;
  "DIVISOR_CYBER_G": number;
  "HYDROGEN": string;
  "CHAIN_ID": string;
  "DENOM_CYBER": string;
  "DENOM_LIQUID_TOKEN": string;
  "DENOM_CYBER_G": string;
  "CYBER_NODE_URL_API": string;
  "CYBER_WEBSOCKET_URL": string;
  "CYBER_NODE_URL_LCD": string;
  "CYBER_INDEX_HTTPS": string;
  "CYBER_INDEX_WEBSOCKET": string;
  "BECH32_PREFIX_ACC_ADDR_CYBER": string;
  "BECH32_PREFIX_ACC_ADDR_CYBERVALOPER": string;
  "MEMO_KEPLR": string;
  "CYBER_GATEWAY": string;
};

export async function generateCyberDeepClient(options: {
  config: CONFIG;
}): Promise<CyberDeepClient<Link<string>>> {
  const cyberClient = await CyberClient.connect(options.config.CYBER_NODE_URL_API);
  const schemas = {};
  const models = {};
  model('account', {}, models);
  model('tx', {
    'coin_received.receiver': 'account',
    'coin_spent.spender': 'account',
    'message.sender': 'account',
    'transfer.recipient': 'account',
    'transfer.sender': 'account',
  }, models);
  schema('tx', '', '', schemas);
  schema('txReceiver', 'tx', 'account', schemas);
  schema('txSender', 'tx', 'account', schemas);
  return new CyberDeepClient({
    cyberClient,
    config: options.config,
    schemas, models,
  });
}

export interface CyberDeepClientInstance<L extends Link<Id> = Link<Id>> extends DeepClientInstance<L> {
}

export interface CyberDeepClientOptions<L extends Link<Id>> extends DeepClientOptions<L> {
  cyberClient: CyberClient;
  config: CONFIG;

  schemas?: Schemas;
  models?: Models;
}

export class CyberDeepClient<L extends Link<string> = Link<string>> extends DeepClient<L> implements CyberDeepClientInstance<L> {
  static resolveDependency?: (path: string) => Promise<any>

  cyberClient: CyberClient;
  config: CONFIG;

  accountPrefix: string;

  _byId: { [id: string]: any } = {};

  schemas: Schemas;
  models: Models;

  // @ts-ignore
  constructor(options: CyberDeepClientOptions<L>) {
    super({
      apolloClient: generateApolloClient({
        path: options.config.CYBER_INDEX_HTTPS.slice(8),
        ssl: true,
        token: ''
      }),
    });
    this.cyberClient = options.cyberClient;
    this.config = options.config;

    this.accountPrefix = this.config.BECH32_PREFIX_ACC_ADDR_CYBER;
    this.schemas = options.schemas;
    this.models = options.models;
  }

  // async select<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Promise<DeepClientResult<LL[]>> {
  //   let q = {};
  //   if (typeof(exp) === 'string') {
  //     if (exp.slice(0, this.accountPrefix.length) === this.accountPrefix) {
  //       return {
  //         data: [{ id: exp, type_id: 'account' } as LL],
  //         loading: false,
  //         networkStatus: 7,
  //       };
  //     }
  //   } else if (typeof(exp) === 'number') {
  //     throw new Error('not implemented');
  //   } else q = exp;
  //   const level = async (prev, exp) => {
  //     if (!exp.type_id) {
  //       throw new Error('!type_id');
  //     }
  //     if (exp.to_id && exp.type_id === 'tx') {
  //       await this.cyberClient.getTx(exp.to_id);
  //     }
  //   };
  //   await level(undefined, exp);
  //   throw new Error('not implemented');
  // };

  /**
   * deep.subscribe
   * @example
   * deep.subscribe({ up: { link_id: 380 } }).subscribe({ next: (links) => {}, error: (err) => {} });
   */
  subscribe<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Observable<LL[]> {
    throw new Error('not implemented');
  };

  async insert<TTable extends 'links'|'numbers'|'strings'|'objects', LL = L>(objects: InsertObjects<TTable>, options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>> {
    throw new Error('not implemented');
  }; 

  async update<TTable extends 'links'|'numbers'|'strings'|'objects'>(exp: Exp<TTable>, value: UpdateValue<TTable>, options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>> {
    throw new Error('not implemented');
  };

  async delete<TTable extends 'links'|'numbers'|'strings'|'objects'>(exp: Exp<TTable>, options?: WriteOptions<TTable>):Promise<DeepClientResult<{ id }[]>> {
    throw new Error('not implemented');
  };

  async serial({
    name, operations, returning, silent
  }: AsyncSerialParams): Promise<DeepClientResult<{ id: Id }[]>> {
    throw new Error('not implemented');
  };

  reserve<LL = L>(count: number): Promise<Id[]> {
    throw new Error('not implemented');
  };

  async await(id: Id, options: { results: boolean } = { results: false } ): Promise<any> {
    throw new Error('not implemented');
  };

  async guest(options: DeepClientGuestOptions = {}): Promise<DeepClientAuthResult> {
    throw new Error('not implemented');
  };

  async jwt(options: DeepClientJWTOptions): Promise<DeepClientAuthResult> {
    throw new Error('not implemented');
  };

  /**
   * Return is of current authorized user linkId.
   * Refill client.linkId and return.
   */
  async whoami(): Promise<number | undefined> {
    throw new Error('not implemented');
  }

  async login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult> {
    throw new Error('not implemented');
  };

  async logout(): Promise<DeepClientAuthResult> {
    throw new Error('not implemented');
  };

  async can(objectIds: null | Id | Id[], subjectIds: null | Id | Id[], actionIds: null | Id | Id[], userIds: Id | Id[] = this.linkId): Promise<boolean> {
    throw new Error('not implemented');
  }

  Traveler(links: Link<Id>[]) {
    return new NativeTraveler(this, links);
  };
}
