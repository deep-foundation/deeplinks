import atob from 'atob';
import { gql, useQuery, useSubscription, useApolloClient, Observable } from '@apollo/client/index.js';
import type { ApolloQueryResult } from '@apollo/client/index.js';
import { IApolloClient, generateApolloClient } from '@deep-foundation/hasura/client.js';
import { useLocalStore } from '@deep-foundation/store/local.js';
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deprecate, inherits, inspect } from "util";
import { deleteMutation, generateMutation, generateQuery, generateQueryData, generateSerial, IGenerateMutationBuilder, IGenerateMutationOptions, insertMutation, ISerialResult, updateMutation } from './gql/index.js';
import { Id, Link, MinilinkCollection, minilinks, MinilinksInstance, MinilinksResult, useMinilinks, useMinilinksApply, useMinilinksQuery, useMinilinksSubscription } from './minilinks.js';
import { awaitPromise } from './promise.js';
import { useTokenController } from './react-token.js';
import { reserve } from './reserve.js';
import { corePckg } from './core.js';
import { BoolExpCan, BoolExpHandler, QueryLink, BoolExpSelector, BoolExpTree, BoolExpValue, MutationInputLink, MutationInputLinkPlain, MutationInputValue } from './client_types.js';
import get from 'get-value';
import {debug} from './debug.js'
import { Traveler as NativeTraveler } from './traveler.js';
import _ from 'lodash';
const moduleLog = debug.extend('cyberclient');
import { 
  Subscription,
  Observer,
  AsyncSerialParams, SerialOperation, SerialOperationType, Table,
  DeepClientOptions, DeepClientResult, DeepClientPackageSelector, DeepClientPackageContain, DeepClientLinkId, DeepClientStartItem, DeepClientPathItem,
  _serialize, _ids, _boolExpFields, pathToWhere, serializeWhere, serializeQuery, parseJwt,
  DeepClient, DeepClientAuthResult, DeepClientGuestOptions, DeepClientInstance,
  DeepClientJWTOptions, Exp, GUEST, InsertObjects, JWT, ReadOptions, UpdateValue, WHOISME, WriteOptions, useAuthNode, useDeepNamespace, useDeepSubscription, useDeepQuery, QueryOptions, Options,
} from './client.js';
import { CyberClient } from '@cybercongress/cyber-js';
import _m0 from "protobufjs/minimal";
import * as cyberConfig from '@deep-foundation/deeplinks/imports/cyber/config';

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
  minilinks?: MinilinkCollection<any, Link<Id>>;
  namespace?: string;
}): Promise<CyberDeepClient<Link<string>>> {
  const cyberClient = await CyberClient.connect(options.config.CYBER_NODE_URL_API);
  return new CyberDeepClient({
    cyberClient,
    config: options.config,
    minilinks: options?.minilinks,
    namespace: options?.namespace,
  });
}

export interface CyberDeepClientInstance<L extends Link<Id> = Link<Id>> extends DeepClientInstance<L> {
}

export interface CyberDeepClientOptions<L extends Link<Id>> extends DeepClientOptions<L> {
  cyberClient: CyberClient;
  config: CONFIG;
}

const deepToCyberHash = {
  from_id: 'particle_from',
  to_id: 'particle_to',
  from: 'from',
  to: 'to',
  out: 'out',
  in: 'in',
};

const convertExp = (exp, table, hash) => {
  if (typeof(exp) === 'object') {
    if (Array.isArray(exp)) {
      const result = [];
      for (const key in exp) {
        result.push(convertExp(exp[key], table, hash));
      }
      return result;
    } else {
      const result = {};
      for (const key in exp) {
        const id = typeof(exp[key]) === 'string' ? exp[key] : exp[key]?._eq ? exp[key]?._eq : undefined;
        if (hash[key]) result[hash[key]] = convertExp(exp[key], table === 'cyberlinks' ? 'particles' : table, hash);
        else if (key === 'id' && typeof(id) === 'string') {
          const splitted = id.split(':');
          if (splitted.length === 2) {
            result[hash.from_id] = { _eq: splitted[0] };
            result[hash.to_id] = { _eq: splitted[1] };
          }
        }
        else result[key] = convertExp(exp[key], table === 'cyberlinks' ? 'particles' : table, hash);
      }
      return result;
    }
  } else return exp;
};

const rewriteGettedPseudoLinksToLinks = (links, exp) => {
  for (let l in links) {
    const link = links[l];
    if (link.__typename === 'cyberlinks') {
      link.id = `${link.from_id}:${link.to_id}`
      link.type_id = 'cyberlink';
    }
    else link.type_id = 'particle';
    for (let r in (exp?.return || [])) {
      rewriteGettedPseudoLinksToLinks(link[r], exp?.return[r]);
    }
  }
};
export class CyberDeepClient<L extends Link<string> = Link<string>> extends DeepClient<L> implements CyberDeepClientInstance<L> {
  static resolveDependency?: (path: string) => Promise<any>

  cyberClient: CyberClient;
  config: CONFIG;

  accountPrefix: string;

  _byId: { [id: string]: any } = {};

  schemas: Schemas;
  models: Models;

  useDeep = useCyberDeep;
  DeepProvider = CyberDeepProvider;
  DeepContext = CyberDeepContext;

  // @ts-ignore
  constructor(options: CyberDeepClientOptions<L>) {
    super({
      ...options,
      apolloClient: generateApolloClient({
        path: options.config.CYBER_INDEX_HTTPS.slice(8),
        ssl: true,
        token: '',
        ws: true,
      }),
    });
    this.cyberClient = options.cyberClient;
    this.config = options.config;

    this.accountPrefix = this.config.BECH32_PREFIX_ACC_ADDR_CYBER;

    this._generateHooks(this);
  }

  _generateQuery<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers'>(exp: Exp<TTable>, options: Options<TTable>) {
    const tableNamePostfix = options?.tableNamePostfix;
    const aggregate = options?.aggregate;
    const variables = options?.variables;
    const name = options?.name || this.defaultSelectName;

    const query = serializeQuery(exp, options?.table || 'links');
    let cyberTable = 'cyberlinks';
    if (query?.where?.in || query?.where?.out) cyberTable = 'particles';

    const cyberExp = convertExp(query, cyberTable, deepToCyberHash);

    const queryData = generateQueryData({
      tableName: cyberTable,
      tableNamePostfix: tableNamePostfix || aggregate ? '_aggregate' : '',
      returning: aggregate ? `aggregate { ${aggregate} }` : (tableName: string) => (
        tableName === 'cyberlinks' ? `from_id: ${deepToCyberHash['from_id']} to_id: ${deepToCyberHash['to_id']}` :
        tableName === 'particles' ? `id: particle` :
        'id'
      ),
      variables: {
        ...variables,
        ...cyberExp,
      },
    });
    const generatedQuery = generateQuery({
      operation: options?.subscription ? 'subscription' : 'query',
      queries: [
        queryData,
      ],
      name: name,
    });
    return {
      query: generatedQuery,
      queryData,
    };
  }

  _generateResult<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers'>(exp: Exp<TTable>, options: Options<TTable>, data) {
    return rewriteGettedPseudoLinksToLinks(data, exp);
  }

  async select<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Promise<DeepClientResult<LL[]>> {
    return super.select.call(this, exp, options);
  }
  // async select<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Promise<DeepClientResult<LL[]>> {
  //   const aggregate = options?.aggregate;
  //   const queryData = this._generateQuery(exp, options);
  //   try {
  //     const q = await this.apolloClient.query(queryData.query.query);
  //     this._generateResult(exp, options, q?.data?.q0);
  //     return { ...q, data: aggregate ? (q)?.data?.q0?.aggregate?.[aggregate] : (q)?.data?.q0 };
  //   } catch (e) {
  //     throw new Error(`CyberDeepClient Select Error: ${e.message}`, { cause: e });
  //   }
  // };

  /**
   * deep.subscribe
   * @example
   * deep.subscribe({ up: { link_id: 380 } }).subscribe({ next: (links) => {}, error: (err) => {} });
   */
  // subscribe<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Observable<LL[]> {
  //   if (!exp) return new Observable((observer) => observer.error('!exp'));
  //   const aggregate = options?.aggregate;
  //   const queryData = this._generateQuery(exp, { ...options, subscription: true });

  //   try {
  //     const apolloObservable = this.apolloClient.subscribe(queryData.query);

  //     const observable = new Observable((observer) => {
  //       const subscription = apolloObservable.subscribe({
  //         next: (data: any) => {
  //           observer.next(aggregate ? data?.q0?.aggregate?.[aggregate] : rewriteGettedPseudoLinksToLinks(data?.q0, exp));
  //         },
  //         error: (error) => observer.error(error),
  //       });
  //       return () => subscription.unsubscribe();
  //     });

  //   // @ts-ignore
  //     return observable;
  //   } catch (e) {
  //     throw new Error(`CyberDeepClient Subscription Error: ${e.message}`, { cause: e });
  //   }
  // };

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

export function useCyberDeepGenerator({
  minilinks,
  namespace,
}: {
  minilinks: MinilinkCollection<any, Link<Id>>;
  namespace?: string;
}) {
  const log = debug.extend(useCyberDeepGenerator.name)
  const [deep, setDeep] = useState<any>();

  const [linkId, setLinkId] = useAuthNode();
  log({linkId, setLinkId})

  useEffect(() => {
    const cyber = cyberConfig.CYBER;
    console.log(cyber);
    generateCyberDeepClient({
      config: cyberConfig.CYBER,
      minilinks,
      namespace,
    }).then(d => setDeep(d));
  }, []);
  log({deep})
  return deep;
}

const CyberDeepContext = createContext<CyberDeepClient>(undefined);

function useCyberDeep() {
  return useContext(CyberDeepContext);
}

export function CyberDeepProvider({
  minilinks: inputMinilinks,
  namespace,
  children,
}: {
  minilinks?: MinilinkCollection<any, Link<Id>>;
  namespace?: string;
  children?: any;
}) {
  const providedMinilinks = useMinilinks();
  const deep = useCyberDeepGenerator({
    minilinks: inputMinilinks || providedMinilinks,
    namespace,
  });
  useDeepNamespace(namespace, deep);
  return <CyberDeepContext.Provider value={deep}>
    {children}
  </CyberDeepContext.Provider>;
}