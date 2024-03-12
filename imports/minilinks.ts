import _remove from 'lodash/remove.js';
import _isEqual from 'lodash/isEqual.js';
import _isEqualWith from 'lodash/isEqualWith.js';
import _mean from 'lodash/mean.js';
import _sum from 'lodash/sum.js';
import _min from 'lodash/min.js';
import _max from 'lodash/max.js';
import EventEmitter from 'events';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Debug from 'debug';
import { inherits } from 'util';
import { minilinksQuery, minilinksQueryIs } from './minilinks-query.js';
import { QueryLink } from './client_types.js';
import { useDebounceCallback } from '@react-hook/debounce';
import { Observable } from '@apollo/client/index.js';

const debug = Debug('deeplinks:minilinks');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output

export type Id = number | string;

export interface LinkPlain<Ref extends Id> {
  id: Ref;
  type_id: Ref;
  from_id?: Ref;
  to_id?: Ref;
  value?: any;
}

export interface LinkRelations<Ref extends Id, L extends Link<Ref>> {
  typed: L[];
  type: L;
  in: L[];
  inByType: { [id: string]: L[] };
  out: L[];
  outByType: { [id: string]: L[] };
  from: L;
  to: L;
  value?: any;
  _applies: string[];
  ml?: MinilinkCollection<MinilinksGeneratorOptions, L>;
}

export interface LinkHashFields {
  [key: Id]: any;
}

export interface Link<Ref extends Id> extends LinkPlain<Ref>, LinkRelations<Id, Link<Ref>>, LinkHashFields {
  _id?: Id;
  _type_id?: Id;
  _from_id?: Id;
  _to_id?: Id;
  displayId: Id;
}

export type MinilinksQueryOptionAggregate = 'count' | 'sum' | 'avg' | 'min' | 'max';
export interface MinilinksQueryOptions<A = MinilinksQueryOptionAggregate> {
  aggregate?: A;
}

export interface MinilinksResult<L extends Link<Id>> {
  virtual: { [id: Id]: Id };
  virtualCounter: number;
  links: L[];
  types: { [id: Id]: L[] };
  byId: { [id: Id]: L };
  byFrom: { [id: Id]: L[] };
  byTo: { [id: Id]: L[] };
  byType: { [id: Id]: L[] };
  options: MinilinksGeneratorOptions;
  emitter: EventEmitter;
  query(query: QueryLink | Id): L[] | any;
  select(query: QueryLink | Id): L[] | any;
  subscribe(query: QueryLink | Id): Observable<L[] | any>;
  add(linksArray: any[]): {
    anomalies?: MinilinkError[];
    errors?: MinilinkError[];
  };
  remove(idsArray: any[]): {
    anomalies?: MinilinkError[];
    errors?: MinilinkError[];
  };
  _updating: boolean;
  apply(linksArray: any[], applyName?: string): {
    errors?: MinilinkError[];
    anomalies?: MinilinkError[];
  }
  update(linksArray: any[]): {
    errors?: MinilinkError[];
    anomalies?: MinilinkError[];
  }
}

export function toPlain<Ref extends Id>(link): LinkPlain<Ref> {
  return {
    id: link._id || link.id,
    type_id: link.type_id,
    from_id: link.from_id,
    to_id: link.to_id,
    value: link.value || undefined,
  };
}

export class MinilinksLink<Ref extends Id> {
  ml?: MinilinkCollection<any, any>;
  _id: Ref;
  id: Ref;
  _type_id: Ref;
  _from_id?: Ref;
  _to_id?: Ref;
  get type_id(): Ref {
    return (this.ml?.virtualInverted[this._type_id] || this._type_id) as Ref;
  }
  get from_id(): Ref {
    return (this.ml?.virtualInverted[this._from_id] || this._from_id) as Ref;
  }
  get to_id(): Ref {
    return (this.ml?.virtualInverted[this._to_id] || this._to_id) as Ref;
  }
  set type_id(id: Ref) {
    this._type_id = id;
  }
  set from_id(id: Ref) {
    this._from_id = id;
  }
  set to_id(id: Ref) {
    this._to_id = id;
  }
  get typed(): MinilinksLink<Ref>[] {
    return this.ml?.byType?.[this.id] || [];
  }
  get type(): MinilinksLink<Ref>[] {
    return this.ml?.byId?.[this.type_id];
  }
  get in(): MinilinksLink<Ref>[] {
    return this.ml?.byTo?.[this.id] || [];
  }
  get inByType(): MinilinksLink<Ref>[] {
    const hash: any = {};
    for (let i = 0; i < (this.ml?.byTo?.[this.id]?.length || 0); i++) {
      const element = this.ml?.byTo?.[this.id][i];
      hash[element.type_id] = hash[element.type_id] || [];
      hash[element.type_id].push(element);
    }
    return hash;
  }
  get out(): MinilinksLink<Ref>[] {
    return this.ml?.byFrom?.[this.id];
  }
  get outByType(): MinilinksLink<Ref>[] {
    const hash: any = {};
    for (let i = 0; i < (this.ml?.byFrom?.[this.id]?.length || 0); i++) {
      const element = this.ml?.byFrom?.[this.id]?.[i];
      hash[element.type_id] = hash[element.type_id] || [];
      hash[element.type_id].push(element);
    }
    return hash;
  }
  get from(): MinilinksLink<Ref>[] {
    return this.ml?.byId?.[this.from_id];
  }
  get to(): MinilinksLink<Ref>[] {
    return this.ml?.byId?.[this.to_id];
  }
  get displayId(): Id {
    return this._id || this.id;
  }
  get value(): any {
    return this?.string || this?.number || this?.object;
  }
  string?: any;
  number?: any;
  object?: any;
  _applies: string[] = [];
  constructor(link: any) {
    this.ml = link.ml;
    this.id = link.id;
    this._id = link._id;
    this._type_id = link.type_id;
    this._from_id = link.from_id;
    this._to_id = link.to_id;
    this._applies = link._applies;
    // Object.assign(this, link);
    if (link.value) {
      if (typeof(link?.value?.value) === 'string' && !this.string) this.string = link.value;
      if (typeof(link?.value?.value) === 'number' && !this.number) this.number = link.value;
      if (typeof(link?.value?.value) === 'object' && !this.object) this.object = link.value;
    }
  }
  toPlain(): LinkPlain<Ref> {
    return toPlain<Ref>(this) as LinkPlain<Ref>;
  }
  is(query: QueryLink): boolean {
    // @ts-ignore
    return minilinksQueryIs(query, this);
  }
}
export interface MinilinksGeneratorOptions {
  id: any;
  type_id: any;
  type: any;
  typed: any;
  from_id: any;
  from: any;
  out: any;
  to_id: any;
  to: any;
  in: any;
  inByType: any;
  outByType: any;
  handler?: (link, result: any) => any;
  equal: (oldLink: any, newLink: any) => boolean;
  Link: any; // TODO
}

export const MinilinksGeneratorOptionsDefault: MinilinksGeneratorOptions = {
  id: 'id',
  type_id: 'type_id',
  type: 'type',
  typed: 'typed',
  from_id: 'from_id',
  from: 'from',
  out: 'out',
  to_id: 'to_id',
  to: 'to',
  in: 'in',
  inByType: 'inByType',
  outByType: 'outByType',
  equal: (ol, nl) => {
    const _ol = toPlain(ol);
    const _nl = toPlain(nl);
    return _ol.type_id == _nl.type_id && _ol.from_id == _nl.from_id && _ol.to_id == _nl.to_id && _isEqual(_ol.value, _nl.value);
  },
  Link: MinilinksLink,
};

export interface MinilinksInstance<L extends Link<Id>>{
  (linksArray: L[], memory?: MinilinksResult<L>): MinilinksResult<L>
}

export function Minilinks<MGO extends MinilinksGeneratorOptions, L extends Link<Id>>(options: MGO): MinilinksInstance<L> {
  return function minilinks<L extends Link<Id>>(linksArray = [], memory: any = {}): MinilinksResult<L> {
    // @ts-ignore
    const mc = new MinilinkCollection<MGO, L>(options, memory);
    mc.add(linksArray);
    return mc;
  }
}

export interface MinilinkError extends Error {}

export class MinilinkCollection<MGO extends MinilinksGeneratorOptions = typeof MinilinksGeneratorOptionsDefault, L extends Link<Id> = Link<Id>> {
  useMinilinksQuery = useMinilinksQuery;
  useMinilinksFilter = useMinilinksFilter;
  useMinilinksApply = useMinilinksApply;
  useMinilinksSubscription = useMinilinksSubscription;
  useMinilinksHandle = useMinilinksHandle;

  virtual: { [id: Id]: Id } = {};
  virtualInverted: { [id: Id]: Id } = {};
  virtualCounter = -1;
  types: { [id: Id]: L[] } = {};
  byId: { [id: Id]: L } = {};
  byFrom: { [id: Id]: L[] } = {};
  byTo: { [id: Id]: L[] } = {};
  byType: { [id: Id]: L[] } = {};
  links: L[] = [];
  options: MGO;
  emitter: EventEmitter;

  query<A>(query: QueryLink | Id, options?: MinilinksQueryOptions<A>): A extends string ? any : L[] {
    const result = minilinksQuery<L>(query, this);
    if (options?.aggregate === 'count') return result?.length as any;
    if (options?.aggregate === 'avg') return _mean(result?.map(l => l?.value?.value)) as any;
    if (options?.aggregate === 'sum') return _sum(result?.map(l => l?.value?.value)) as any;
    if (options?.aggregate === 'min') return _min(result?.map(l => l?.value?.value)) as any;
    if (options?.aggregate === 'max') return _max(result?.map(l => l?.value?.value)) as any;
    return result;
  }
  select(query: QueryLink | Id, options?: MinilinksQueryOptions): L[] | any {
    return this.query(query, options);
  }

  /**
   * minilinks.subscribe
   * @example
   * minilinks.subscribe({ type_id: 2 }).subscribe({ next: (links) => {}, error: (err) => {} });
   */
  subscribe(query: QueryLink | Id): Observable<L[] | any> {
    const ml = this;
    return new Observable((observer) => {
      let prev = ml.query(query);
      observer.next(prev);
      let listener = (oldL, newL) => {
        const data = ml.query(query);
        if (!_isEqual(prev, data)) {
          prev = data;
          observer.next(data);
        }
      };
      ml.emitter.on('added', listener);
      ml.emitter.on('updated', listener);
      ml.emitter.on('removed', listener);
      return () => {
        ml.emitter.removeListener('added', listener);
        ml.emitter.removeListener('updated', listener);
        ml.emitter.removeListener('removed', listener);
      }
    });
  }
  add(linksArray: any[], applyName: string = ''): {
    anomalies?: MinilinkError[];
    errors?: MinilinkError[];
  } {
    log('add', linksArray, this);
    const { byId, byFrom, byTo, byType, links, options } = this;
    const anomalies = [];
    const errors = [];
    const newLinks: L[] = [];
    for (let l = 0; l < linksArray.length; l++) {
      if (!!byId[linksArray[l][options.id]]) errors.push(new Error(`${linksArray[l][options.id]} can't add because already exists in collection`));
      if (byId[linksArray[l][options.id]]) {
        if (options.handler) options.handler(byId[linksArray[l][options.id]], this);
      } else {
        const isVirtual = linksArray[l].id < 0;
        if (isVirtual && !this.virtual.hasOwnProperty(linksArray[l].id)) {
          this.virtual[linksArray[l].id] = undefined;
        }
        const link = new this.options.Link({
          ml: this,
          _id: isVirtual ? undefined : linksArray[l].id,
          _applies: [applyName],
          ...linksArray[l],
        });
        byId[link[options.id]] = link;

        // byFrom[link.from_id]: link[]; // XXX
        if (link[options.from_id]) {
          if (byFrom[link[options.from_id]]) byFrom[link[options.from_id]].push(link);
          else byFrom[link[options.from_id]] = [link]
        }

        // byTo[link.to_id]: link[]; // XXX
        if (link[options.to_id]) {
          if (byTo[link[options.to_id]]) byTo[link[options.to_id]].push(link);
          else byTo[link[options.to_id]] = [link]
        }

        // byType[link.type_id]: link[]; // XXX
        if (link[options.type_id]) {
          if (byType[link[options.type_id]]) byType[link[options.type_id]].push(link);
          else byType[link[options.type_id]] = [link]
        }

        // link.typed += byType[link.id]
        // if (byType[link[options.id]]?.length) {
        //   for (let i = 0; i < byType[link[options.id]]?.length; i++) {
        //     const dep = byType[link[options.id]][i];
        //     dep.type = link;
        //     link[options.typed].push(dep);
        //   }
        // }
        // link.out += byFrom[link.id] // XXX
        // if (byFrom[link[options.id]]?.length) {
        //   for (let i = 0; i < byFrom[link[options.id]]?.length; i++) {
        //     const dep = byFrom[link[options.id]][i];
        //     dep[options.from] = link;
        //     link[options.out].push(dep);
        //     // link.outByType[dep.type_id] += dep; // XXX
        //     link[options.outByType][dep[options.type_id]] = link[options.outByType][dep[options.type_id]] || [];
        //     link[options.outByType][dep[options.type_id]].push(dep);
        //   }
        // }
        // link.in += byTo[link.id] // XXX
        // if (byTo[link[options.id]]?.length) {
        //   for (let i = 0; i < byTo[link[options.id]]?.length; i++) {
        //     const dep = byTo[link[options.id]][i];
        //     dep[options.to] = link;
        //     link[options.in].push(dep);
        //     // link.inByType[dep.type_id] += dep; // XXX
        //     link[options.inByType][dep[options.type_id]] = link[options.inByType][dep[options.type_id]] || [];
        //     link[options.inByType][dep[options.type_id]].push(dep);
        //   }
        // }
        links.push(link);
        newLinks.push(link);
      }
    }
    for (let l = 0; l < newLinks.length; l++) {
      const link: L = newLinks[l];
      const type = byId[link[options.type_id]];
      const from = byId[link[options.from_id]];
      const to = byId[link[options.to_id]];
      if (type) {
        // // link.type = byId[link.type_id] // XXX
        // link[options.type] = type;
        // // type.typed += link;
        // if (!type[options.typed].find(l => l.id === link.id)) type[options.typed].push(link);
      } else if (link[options.type_id]) anomalies.push(new Error(`${link[options.id]} link.type_id ${link[options.type_id]} not found`));
      if (from) {
      //   // link.from = byId[link.from_id] // XXX
      //   link[options.from] = from;
      //   // from.out += link;
      //   if (!from[options.out].find(l => l.id === link.id)) from[options.out].push(link);
      //   // from.outByType[link.type_id] += link; // XXX
      //   from[options.outByType][link[options.type_id]] = from[options.outByType][link[options.type_id]] || [];
      //   if (!from?.[options.outByType]?.[link[options.type_id]].find(l => l.id === link.id)) from[options.outByType][link[options.type_id]].push(link);
      } else if (link[options.from_id]) anomalies.push(new Error(`${link[options.id]} link.from_id ${link[options.from_id]} not found`));
      if (to) {
      //   // link.to = byId[link.to_id] // XXX
      //   link[options.to] = to;
      //   // to.in += link;
      //   if (!to[options.in].find(l => l.id === link.id)) to[options.in].push(link);
      //   // to.inByType[link.type_id] += link;
      //   to[options.inByType][link[options.type_id]] = to[options.inByType][link[options.type_id]] || [];
      //   if (!to[options.inByType][link[options.type_id]].find(l => l.id === link.id)) to[options.inByType][link[options.type_id]].push(link);
      } else if (link[options.to_id]) anomalies.push(new Error(`${link[options.id]} link.to_id ${link[options.to_id]} not found`));
      if (options.handler) options.handler(link, this);
    }
    for (let l = 0; l < newLinks.length; l++) {
      const link: L = newLinks[l];
      if (!this._updating) this.emitter.emit('added', undefined, link);
    }
    return {
      anomalies,
      errors,
    };
  }
  remove(idsArray: any[]): {
    anomalies?: MinilinkError[];
    errors?: MinilinkError[];
  } {
    log('remove', idsArray, this);
    const { byId, byFrom, byTo, byType, types, links, options } = this;
    const anomalies = [];
    const errors = [];
    const oldLinksArray: L[] = [];
    const oldLinksObject: { [id:Id]: L } = {};
    for (let l = 0; l < idsArray.length; l++) {
      const id = idsArray[l];
      const link = byId[id];
      log('remove old l:', l, 'id:', id, 'link:', link);
      if (link) {
        oldLinksArray.push(link);
        oldLinksObject[id] = link;
      }
    }
    for (let l = 0; l < idsArray.length; l++) {
      const id = idsArray[l];
      const link = oldLinksArray[l];
      if (!link) errors.push(new Error(`${id} can't delete because not exists in collection`));

      // link.in += byTo[link.id] // XXX
      // _remove(link?.[options.to]?.[options.in], (r: { id?: Id }) => r.id === id);
      // link.out += byFrom[link.id] // XXX
      // _remove(link?.[options.from]?.[options.out], (r: { id?: Id }) => r.id === id);

      // byFrom[link.from_id]: link[]; // XXX
      _remove(byFrom?.[link?.[options.from_id]] || [], (r: { id?: Id }) => r.id === id);

      // byTo[link.to_id]: link[]; // XXX
      _remove(byTo?.[link?.[options.to_id]] || [], (r: { id?: Id }) => r.id === id);

      // byType[link.type_id]: link[]; // XXX
      _remove(byType?.[link?.[options.type_id]] || [], (r: { id?: Id }) => r.id === id);

      // from.outByType[link.type_id] += link; // XXX
      // _remove(link?.[options.from]?.outByType?.[link.type_id] || [], (r: { id?: Id }) => r.id === id)

      // to.inByType[link.type_id] += link; // XXX
      // _remove(link?.[options.to]?.inByType?.[link.type_id] || [], (r: { id?: Id }) => r.id === id)

      // for (let i = 0; i < byFrom?.[id]?.length; i++) {
      //   const dep = byFrom?.[id]?.[i];
      //   // link.from = byId[link.from_id] // XXX
      //   dep[options.from] = undefined;
      // }

      // for (let i = 0; i < byTo?.[id]?.length; i++) {
      //   const dep = byTo?.[id]?.[i];
      //   // link.to = byId[link.to_id] // XXX
      //   dep[options.to] = undefined;
      // }

      // for (let i = 0; i < byType?.[id]?.length; i++) {
      //   const dep = byType?.[id]?.[i];
      //   // link.type = byId[link.type_id] // XXX
      //   dep[options.type] = undefined;
      // }

      delete byId?.[id];
    }
    _remove(links, l => idsArray.includes(l[options.id]));
    for (let l = 0; l < oldLinksArray.length; l++) {
      const link = oldLinksArray[l];
      log('emit removed link', link, '_updating', this._updating);
      if (!this._updating) this.emitter.emit('removed', link);
    }
    return {
      anomalies,
      errors,
    };
  }
  _updating: boolean = false;
  apply(linksArray: any[], applyName: string = ''): {
    errors?: MinilinkError[];
    anomalies?: MinilinkError[];
  } {
    log('apply', linksArray, this);
    const { byId, byFrom, byTo, byType, types, links, options } = this;
    const toAdd = [];
    const toUpdate = [];
    const beforeUpdate = {};
    const toRemove = [];
    const _byId: any = {};
    for (let l = 0; l < linksArray.length; l++) {
      let link = linksArray[l];

      // find virtual
      let old = byId[link.id];
      const virtualIds = Object.keys(this.virtual);
      // console.log('abcdef', virtualIds.map(i => Number(i)).filter(id => !Object.values(this.virtualInverted).includes(id)))
      const [virtual] = this.query({
        id: { _in: virtualIds.map(i => Number(i)).filter(id => !Object.values(this.virtualInverted).includes(id)) },
        ...(link.type_id ? { type_id: link.type_id } : {}),
        // ...(link.from_id ? { from_id: link.from_id } : {}),
        // ...(link.to_id ? { to_id: link.to_id } : {}),
        // ...(link.value ? { value: link.value } : {}),
      });
      if (virtual) {
        if (!old) {
          old = virtual;
          this.virtual[virtual.id] = link.id;
          this.virtualInverted[link.id] = virtual.id;
          virtual._id = link.id;
          link = { ...link, _id: link.id, id: virtual.id };
        }
      }

      if (!old) {
        link._applies = [applyName];
        this.emitter.emit('apply', old, link);
        this.emitter.emit('+apply', old, link, applyName);
        toAdd.push(link);
      }
      else {
        const index = old._applies.indexOf(applyName);
        if (!~index) {
          link._applies = old._applies = [...old._applies, applyName];
          this.emitter.emit('apply', old, link);
          this.emitter.emit('+apply', old, link, applyName);
        } else {
          link._applies = old._applies;
        }
        if (!options.equal(old, link)) {
          toUpdate.push(link);
          beforeUpdate[link.id] = old;
        }
      }
      _byId[link.id] = link;
    }
    for (let l = 0; l < links.length; l++) {
      const link = links[l];
      if (!_byId[link.id]) {
        const index = link._applies.indexOf(applyName);
        if (!!~index) {
          if (link._applies.length === 1) {
            toRemove.push(link);
          } else {
            link._applies.splice(index, 1);
            this.emitter.emit('apply', link, link);
            this.emitter.emit('-apply', link, link, applyName);
          }
        }
      }
    }
    const r1 = this.remove(toRemove.map(l => l[options.id]));
    const a1 = this.add(toAdd);
    this._updating = true;
    const r2 = this.remove(toUpdate.map(l => l[options.id]));
    const a2 = this.add(toUpdate);
    for (let i = 0; i < toUpdate.length; i++) {
      const l = toUpdate[i];
      this.emitter.emit('updated', beforeUpdate[l.id], byId[l.id]);
    }
    this._updating = false;
    return { errors: [...r1.errors, ...a1.errors, ...r2.errors, ...a2.errors], anomalies: [...r1.anomalies, ...a1.anomalies, ...r2.anomalies, ...a2.anomalies] };
  }
  update(linksArray: any[]): {
    errors?: MinilinkError[];
    anomalies?: MinilinkError[];
  } {
    log('update', linksArray, this);
    const { byId, byFrom, byTo, byType, types, links, options } = this;
    const toUpdate = [];
    const beforeUpdate = {};
    const _byId: any = {};
    for (let l = 0; l < linksArray.length; l++) {
      let link = linksArray[l];

      // find virtual
      let old = byId[link.id];
      const virtualIds = Object.keys(this.virtual);
      const [virtual] = this.query({
        id: { _in: virtualIds.map(i => Number(i)) },
        ...(link.type_id ? { _type_id: link.type_id } : {}),
        ...(link.from_id ? { _from_id: link.from_id } : {}),
        ...(link.to_id ? { _to_id: link.to_id } : {}),
        ...(link.value ? { value: link.value } : {}),
      });
      if (virtual) {
        if (old) throw new Error(`somehow we have oldLink.id ${old.id} and virtualLink.id ${virtual.id} virtualLink._id = ${virtual._id}`);
        old = virtual;
        virtual._id = link.id;
        link = { ...link, _id: link.id, id: virtual.id };
      }

      if (old) {
        if (!options.equal(old, link)) {
          toUpdate.push(link);
          beforeUpdate[link.id] = old;
        }
      }
      _byId[link.id] = link;
    }
    this._updating = true;
    const r2 = this.remove(toUpdate.map(l => l[options.id]));
    const a2 = this.add(toUpdate);
    for (let i = 0; i < toUpdate.length; i++) {
      const l = toUpdate[i];
      this.emitter.emit('updated', beforeUpdate[l.id], byId[l.id]);
    }
    this._updating = false;
    return { errors: [...r2.errors, ...a2.errors], anomalies: [...r2.anomalies, ...a2.anomalies] };
  }
  constructor(options?: MGO, memory?: any) {
    const _options = options || MinilinksGeneratorOptionsDefault;
    this.types = this.byType = memory?.types || {};
    this.byId = memory?.byId || {};
    this.byFrom = memory?.byFrom || {};
    this.byTo = memory?.byTo || {};
    this.links = memory?.links || [];
    // @ts-ignore
    this.options = _options;
    this.emitter = new EventEmitter();
  }
}

export const minilinks = Minilinks(MinilinksGeneratorOptionsDefault);

export interface MinilinksHookInstance<L extends Link<Id>> {
  ml: MinilinksResult<L>;
  ref: { current: MinilinksResult<L>; };
}

export function useMinilinksConstruct<L extends Link<Id>>(options?: any): MinilinksHookInstance<L> {
  // @ts-ignore
  const mlRef = useRef<MinilinksResult<L>>(useMemo(() => {
    // @ts-ignore
    return new MinilinkCollection(options);
  }, []));
  const ml: MinilinksResult<L> = mlRef.current;
  return { ml, ref: mlRef };
}

export function useMinilinksFilter<L extends Link<Id>, R = any>(
  ml,
  filter: (currentLink: L, oldLink: L, newLink: L) => boolean,
  results: (l?: L, ml?: any, oldLink?: L, newLink?: L) => R,
  interval?: number,
): R {
  const [state, setState] = useState<R>();
  const action = useDebounceCallback(
    (l?, ml?, ol?, nl?) => {
      setState(results(l, ml, ol, nl));
    },
    500,
    true
  );
  const refs = useRef<any>({});
  useEffect(() => {
    if (refs.current.addedListener) ml.emitter.removeListener('added', refs.current.addedListener);
    if (refs.current.updatedListener) ml.emitter.removeListener('updated', refs.current.updatedListener);
    if (refs.current.removedListener) ml.emitter.removeListener('removed', refs.current.removedListener);
    if (refs.current.applyListener) ml.emitter.removeListener('apply', refs.current.applyListener);
    refs.current.addedListener = (ol, nl) => {
      if (filter(nl, ol, nl)) {
        action(nl, ml, ol, nl);
      }
    };
    ml.emitter.on('added', refs.current.addedListener);
    refs.current.updatedListener = (ol, nl) => {
      if (filter(nl, ol, nl)) {
        action(nl, ml, ol, nl);
      }
    };
    ml.emitter.on('updated', refs.current.updatedListener);
    refs.current.removedListener = (ol, nl) => {
      if (filter(ol, ol, nl)) {
        action(ol, ml, ol, nl);
      }
    };
    ml.emitter.on('removed', refs.current.removedListener);
    refs.current.applyListener = (ol, nl) => {
      if (filter(nl, ol, nl)) {
        action(nl, ml, ol, nl);
      }
    };
    let timeout;
    if (interval) timeout = setTimeout(() => {
      action(undefined, ml);
    }, interval);
    ml.emitter.on('apply', refs.current.applyListener);
    return () => {
      clearTimeout(timeout);
      ml.emitter.removeListener('added', refs.current.addedListener);
      ml.emitter.removeListener('updated', refs.current.updatedListener);
      ml.emitter.removeListener('removed', refs.current.removedListener);
      ml.emitter.removeListener('apply', refs.current.applyListener);
    };
  }, [ml]);
  useEffect(() => {
    setState(results(undefined, ml, undefined, undefined));
  }, [ml, filter, results]);
  return state;
};

export function useMinilinksHandle<L extends Link<Id>>(ml, handler: (event, oldLink, newLink) => any): void {
  useEffect(() => {
    const addedListener = (ol, nl) => {
      handler('added', ol, nl);
    };
    ml.emitter.on('added', addedListener);
    const updatedListener = (ol, nl) => {
      handler('updated', ol, nl);
    };
    ml.emitter.on('updated', updatedListener);
    const removedListener = (ol, nl) => {
      handler('removed', ol, nl);
    };
    ml.emitter.on('removed', removedListener);
    const applyListener = (ol, nl) => {
      handler('apply', ol, nl);
    };
    ml.emitter.on('apply', applyListener);
    return () => {
      ml.emitter.removeListener('added', addedListener);
      ml.emitter.removeListener('updated', updatedListener);
      ml.emitter.removeListener('removed', removedListener);
      ml.emitter.removeListener('apply', applyListener);
    };
  }, []);
};

export function useMinilinksApply<L extends Link<Id>>(ml, name: string, data?: L[]): any {
  const [strictName] = useState(name);
  useEffect(() => {
    return () => {
      ml.apply([], strictName);
    };
  }, []);
  ml.apply(data, strictName);
}

/**
 * React hook. Returns reactiviely links from minilinks, by query in deeplinks dialect.
 * Recalculates when query changes. (Take query into useMemo!).
 */
export function useMinilinksQuery<L extends Link<Id>>(ml, query: QueryLink | Id) {
  return useMemo(() => ml.query(query), [ml, query]);
};

/**
 * React hook. Returns reactiviely links from minilinks, by query in deeplinks dialect.
 * Recalculates when data in minilinks changes. (Take query into useMemo!).
 */
export function useMinilinksSubscription<L extends Link<Id>>(ml, query: QueryLink | Id) {
  const [d, setD] = useState();
  const sRef = useRef<any>();
  const qPrevRef = useRef<any>(query);
  const q = useMemo(() => _isEqual(query, qPrevRef.current) ? qPrevRef.current : query, [query]);
  qPrevRef.current = q;
  useEffect(() => {
    setD(ml.query(q));
    if (sRef.current) sRef.current.unsubscribe();
    const obs = ml.subscribe(q);
    const sub = sRef.current = obs.subscribe({
      next: (links) => {
        setD(links);
      },
      error: (error) => {
        throw new Error(error);
      },
    });
    return () => {
      sub.unsubscribe();
    }
  }, [q]);
  return d || ml.query(q);
};