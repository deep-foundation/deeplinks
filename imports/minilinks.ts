import _remove from 'lodash/remove.js';
import _isEqual from 'lodash/isEqual.js';
import _isEqualWith from 'lodash/isEqualWith.js';
import EventEmitter from 'events';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Debug from 'debug';
import { inherits } from 'util';
import { minilinksQuery, minilinksQueryIs } from './minilinks-query.js';
import { QueryLink } from './client_types.js';
import { useDebounceCallback } from '@react-hook/debounce';

const debug = Debug('deeplinks:minilinks');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

export interface LinkPlain<Ref extends number> {
  id: Ref;
  type_id: Ref;
  from_id?: Ref;
  to_id?: Ref;
  value?: any;
}

export interface LinkRelations<L extends Link<number>> {
  typed: L[];
  type: L;
  in: L[];
  inByType: { [id: number]: L[] };
  out: L[];
  outByType: { [id: number]: L[] };
  from: L;
  to: L;
  value?: any;
  _applies: string[];
  ml?: MinilinkCollection<MinilinksGeneratorOptions, L>;
}

export interface LinkHashFields {
  [key: string|number]: any;
}

export interface Link<Ref extends number> extends LinkPlain<Ref>, LinkRelations<Link<Ref>>, LinkHashFields {}

export interface MinilinksResult<Link> {
  links: Link[];
  types: { [id: number]: Link[] };
  byId: { [id: number]: Link };
  byFrom: { [id: number]: Link[] };
  byTo: { [id: number]: Link[] };
  byType: { [id: number]: Link[] };
  options: MinilinksGeneratorOptions;
  emitter: EventEmitter;
  query(query: QueryLink | number): Link[];
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
}

export class MinilinksLink<Ref extends number> {
  ml?: MinilinkCollection<any, any>;
  id: Ref;
  type_id: Ref;
  from_id?: Ref;
  to_id?: Ref;
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
  value?: any;
  string?: any;
  number?: any;
  object?: any;
  _applies: string[] = [];
  constructor(link: any) {
    Object.assign(this, link);
    if (link.value) {
      if (typeof(link.value.value) === 'string' && !this.string) this.string = link.value;
      if (typeof(link.value.value) === 'number' && !this.number) this.number = link.value;
      if (typeof(link.value.value) === 'object' && !this.object) this.object = link.value;
    }
  }
  toPlain(): LinkPlain<Ref> {
    return {
      id: this.id,
      type_id: this.type_id,
      from_id: this.from_id,
      to_id: this.to_id,
      value: this.value,
    };
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
    return ol.type_id == nl.type_id && ol.from_id == nl.from_id && ol.to_id == nl.to_id && _isEqual(ol.value, nl.value);
  },
  Link: MinilinksLink,
};

export interface MinilinksInstance<L extends Link<number>>{
  (linksArray: L[], memory?: MinilinksResult<L>): MinilinksResult<L>
}

export function Minilinks<MGO extends MinilinksGeneratorOptions, L extends Link<number>>(options: MGO): MinilinksInstance<L> {
  return function minilinks<L>(linksArray = [], memory: any = {}): MinilinksResult<L> {
    // @ts-ignore
    const mc = new MinilinkCollection<MGO, L>(options, memory);
    mc.add(linksArray);
    return mc;
  }
}

export interface MinilinkError extends Error {}

export class MinilinkCollection<MGO extends MinilinksGeneratorOptions = typeof MinilinksGeneratorOptionsDefault, L extends Link<number> = Link<number>> {
  useMinilinksQuery = useMinilinksQuery;
  useMinilinksFilter = useMinilinksFilter;
  useMinilinksApply = useMinilinksApply;
  useMinilinksSubscription = useMinilinksSubscription;
  useMinilinksHandle = useMinilinksHandle;

  types: { [id: number]: L[] } = {};
  byId: { [id: number]: L } = {};
  byFrom: { [id: number]: L[] } = {};
  byTo: { [id: number]: L[] } = {};
  byType: { [id: number]: L[] } = {};
  links: L[] = [];
  options: MGO;
  emitter: EventEmitter;
  query(query: QueryLink | number): L[] {
    return minilinksQuery<L>(query, this);
  }
  add(linksArray: any[]): {
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
        const link = new this.options.Link({
          ml: this,
          _applies: [],
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
      } else if (link[options.type_id]) anomalies.push(new Error(`${link[options.id]} link.type_id ${link[options.type_id]} not founded`));
      if (from) {
      //   // link.from = byId[link.from_id] // XXX
      //   link[options.from] = from;
      //   // from.out += link;
      //   if (!from[options.out].find(l => l.id === link.id)) from[options.out].push(link);
      //   // from.outByType[link.type_id] += link; // XXX
      //   from[options.outByType][link[options.type_id]] = from[options.outByType][link[options.type_id]] || [];
      //   if (!from?.[options.outByType]?.[link[options.type_id]].find(l => l.id === link.id)) from[options.outByType][link[options.type_id]].push(link);
      } else if (link[options.from_id]) anomalies.push(new Error(`${link[options.id]} link.from_id ${link[options.from_id]} not founded`));
      if (to) {
      //   // link.to = byId[link.to_id] // XXX
      //   link[options.to] = to;
      //   // to.in += link;
      //   if (!to[options.in].find(l => l.id === link.id)) to[options.in].push(link);
      //   // to.inByType[link.type_id] += link;
      //   to[options.inByType][link[options.type_id]] = to[options.inByType][link[options.type_id]] || [];
      //   if (!to[options.inByType][link[options.type_id]].find(l => l.id === link.id)) to[options.inByType][link[options.type_id]].push(link);
      } else if (link[options.to_id]) anomalies.push(new Error(`${link[options.id]} link.to_id ${link[options.to_id]} not founded`));
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
    const oldLinksObject: { [id:number]: L } = {};
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
      // _remove(link?.[options.to]?.[options.in], (r: { id?: number }) => r.id === id);
      // link.out += byFrom[link.id] // XXX
      // _remove(link?.[options.from]?.[options.out], (r: { id?: number }) => r.id === id);

      // byFrom[link.from_id]: link[]; // XXX
      _remove(byFrom?.[link?.[options.from_id]] || [], (r: { id?: number }) => r.id === id);

      // byTo[link.to_id]: link[]; // XXX
      _remove(byTo?.[link?.[options.to_id]] || [], (r: { id?: number }) => r.id === id);

      // byType[link.type_id]: link[]; // XXX
      _remove(byType?.[link?.[options.type_id]] || [], (r: { id?: number }) => r.id === id);

      // from.outByType[link.type_id] += link; // XXX
      // _remove(link?.[options.from]?.outByType?.[link.type_id] || [], (r: { id?: number }) => r.id === id)

      // to.inByType[link.type_id] += link; // XXX
      // _remove(link?.[options.to]?.inByType?.[link.type_id] || [], (r: { id?: number }) => r.id === id)

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
      const link = linksArray[l];
      const old = byId[link.id];
      if (!old) {
        link._applies = [applyName];
        this.emitter.emit('apply', old, link);
        toAdd.push(link);
      }
      else {
        const index = old._applies.indexOf(applyName);
        if (!~index) {
          link._applies = old._applies = [...old._applies, applyName];
          this.emitter.emit('apply', old, link);
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

export interface MinilinksHookInstance<L extends Link<number>> {
  ml: MinilinksResult<L>;
  ref: { current: MinilinksResult<L>; };
}

export function useMinilinksConstruct<L extends Link<number>>(options?: any): MinilinksHookInstance<L> {
  // @ts-ignore
  const mlRef = useRef<MinilinksResult<L>>(useMemo(() => {
    // @ts-ignore
    return new MinilinkCollection(options);
  }, []));
  const ml: MinilinksResult<L> = mlRef.current;
  return { ml, ref: mlRef };
}

export function useMinilinksFilter<L extends Link<number>, R = any>(
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
  useEffect(() => {
    const addedListener = (ol, nl) => {
      if (filter(nl, ol, nl)) {
        action(nl, ml, ol, nl);
      }
    };
    ml.emitter.on('added', addedListener);
    const updatedListener = (ol, nl) => {
      if (filter(nl, ol, nl)) {
        action(nl, ml, ol, nl);
      }
    };
    ml.emitter.on('updated', updatedListener);
    const removedListener = (ol, nl) => {
      if (filter(ol, ol, nl)) {
        action(ol, ml, ol, nl);
      }
    };
    ml.emitter.on('removed', removedListener);
    const applyListener = (ol, nl) => {
      if (filter(nl, ol, nl)) {
        action(nl, ml, ol, nl);
      }
    };
    let timeout;
    if (interval) timeout = setTimeout(() => {
      action(undefined, ml);
    }, interval);
    ml.emitter.on('apply', applyListener);
    return () => {
      clearTimeout(timeout);
      ml.emitter.removeListener('added', addedListener);
      ml.emitter.removeListener('updated', updatedListener);
      ml.emitter.removeListener('removed', removedListener);
      ml.emitter.removeListener('apply', applyListener);
    };
  }, []);
  useEffect(() => {
    setState(results(undefined, ml, undefined, undefined));
  }, [filter, results]);
  return state;
};

export function useMinilinksHandle<L extends Link<number>>(ml, handler: (event, oldLink, newLink) => any): void {
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

export function useMinilinksApply<L extends Link<number>>(ml, name: string, data?: L[]): any {
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
export function useMinilinksQuery<L extends Link<number>>(ml, query: QueryLink | number) {
  return useMemo(() => ml.query(query), [ml, query]);
};

/**
 * React hook. Returns reactiviely links from minilinks, by query in deeplinks dialect.
 * Recalculates when data in minilinks changes. (Take query into useMemo!).
 */
export function useMinilinksSubscription<L extends Link<number>>(ml, query: QueryLink | number) {
  // console.log('54353246234562346435')
  const listenerRef = useRef<any>();
  const dRef = useRef<any>();
  const [d, setD] = useState();
  useEffect(() => {
    if (listenerRef.current) ml.emitter.removeListener('added removed updated', listenerRef.current);
    listenerRef.current = (oldL, newL) => {
      const prev = d || dRef.current;
      const data = ml.query(query);
      if (!_isEqual(prev, data)) {
        setD(data);
      }
    };
    ml.emitter.on('added removed updated', listenerRef.current);
    return () => ml.emitter.removeListener('added removed updated', listenerRef.current);
  }, []);
    // const iterationsInterval = setInterval(() => {
      //   setIteration((i: number) => i === Number.MAX_SAFE_INTEGER ? 0 : i+1)
      // }, 1000);
      // return () => clearInterval(iterationsInterval);
  const data = dRef.current = d ? d : ml.query(query);
  return data;
};