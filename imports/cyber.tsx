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

const log = debug.extend('log');
const error = debug.extend('error');

const corePckgIds: { [key: string]: Id; } = {};
corePckg.data.filter(l => !!l.type).forEach((l, i) => {
  corePckgIds[l.id] = i+1;
});

export async function generateCyberInDeepClient(options: any): Promise<CyberDeepClient<Link<Id>>> {
  return new CyberDeepClient(options);
}

export interface CyberDeepClientInstance<L extends Link<Id> = Link<Id>> extends DeepClientInstance<L> {
}

export class CyberDeepClient<L extends Link<Id> = Link<Id>> extends DeepClient<L> implements CyberDeepClientInstance<L> {
  static resolveDependency?: (path: string) => Promise<any>

  // @ts-ignore
  constructor(options: any) {
  }

  async select<TTable extends 'links'|'numbers'|'strings'|'objects'|'can'|'selectors'|'tree'|'handlers', LL = L>(exp: Exp<TTable>, options?: ReadOptions<TTable>): Promise<DeepClientResult<LL[]>> {
    throw new Error('not implemented');
  };

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