import _remove from 'lodash/remove';
import _isEqual from 'lodash/isEqual';
import EventEmitter from 'events';
import { useEffect, useMemo, useRef, useState } from 'react';
import Debug from 'debug';
import { inherits } from 'util';

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
}

export interface LinkRelations<L> {
  typed: L[];
  type: L;
  in: L[];
  inByType: { [id: number]: L[] };
  out: L[];
  outByType: { [id: number]: L[] };
  from: L;
  to: L;
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
}

export class MinilinksLink<Ref extends number> {
  id: Ref;
  type_id: Ref;
  from_id?: Ref;
  to_id?: Ref;
  typed: MinilinksLink<Ref>[];
  type: MinilinksLink<Ref>;
  in: MinilinksLink<Ref>[];
  inByType: { [id: number]: MinilinksLink<Ref>[] };
  out: MinilinksLink<Ref>[];
  outByType: { [id: number]: MinilinksLink<Ref>[] };
  from: MinilinksLink<Ref>;
  to: MinilinksLink<Ref>;
  constructor(link: any) {
    Object.assign(this, link);
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

export class MinilinkCollection<MGO extends MinilinksGeneratorOptions, L extends Link<number>> {
  types: { [id: number]: L[] } = {};
  byId: { [id: number]: L } = {};
  byFrom: { [id: number]: L[] } = {};
  byTo: { [id: number]: L[] } = {};
  byType: { [id: number]: L[] } = {};
  links: L[] = [];
  options: MGO;
  emitter: EventEmitter;
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
        const link = new this.options.Link({ ...linksArray[l], [options.typed]: [], [options.in]: [], [options.out]: [], [options.inByType]: {}, [options.outByType]: {} });
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
        if (byType[link[options.id]]?.length) {
          for (let i = 0; i < byType[link[options.id]]?.length; i++) {
            const dep = byType[link[options.id]][i];
            dep.type = link;
            link[options.typed].push(dep);
          }
        }
        // link.out += byFrom[link.id] // XXX
        if (byFrom[link[options.id]]?.length) {
          for (let i = 0; i < byFrom[link[options.id]]?.length; i++) {
            const dep = byFrom[link[options.id]][i];
            dep[options.from] = link;
            link[options.out].push(dep);
            // link.outByType[dep.type_id] += dep; // XXX
            link[options.outByType][dep[options.type_id]] = link[options.outByType][dep[options.type_id]] || [];
            link[options.outByType][dep[options.type_id]].push(dep);
          }
        }
        // link.in += byTo[link.id] // XXX
        if (byTo[link[options.id]]?.length) {
          for (let i = 0; i < byTo[link[options.id]]?.length; i++) {
            const dep = byTo[link[options.id]][i];
            dep[options.to] = link;
            link[options.in].push(dep);
            // link.inByType[dep.type_id] += dep; // XXX
            link[options.inByType][dep[options.type_id]] = link[options.inByType][dep[options.type_id]] || [];
            link[options.inByType][dep[options.type_id]].push(dep);
          }
        }
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
        // link.type = byId[link.type_id] // XXX
        link[options.type] = type;
        // type.typed += link;
        if (!type[options.typed].find(l => l.id === link.id)) type[options.typed].push(link);
      } else if (link[options.type_id]) anomalies.push(new Error(`${link[options.id]} link.type_id ${link[options.type_id]} not founded`));
      if (from) {
        // link.from = byId[link.from_id] // XXX
        link[options.from] = from;
        // from.out += link;
        if (!from[options.out].find(l => l.id === link.id)) from[options.out].push(link);
        // from.outByType[link.type_id] += link; // XXX
        from[options.outByType][link[options.type_id]] = from[options.outByType][link[options.type_id]] || [];
        if (!from?.[options.outByType]?.[link[options.type_id]].find(l => l.id === link.id)) from[options.outByType][link[options.type_id]].push(link);
      } else if (link[options.from_id]) anomalies.push(new Error(`${link[options.id]} link.from_id ${link[options.from_id]} not founded`));
      if (to) {
        // link.to = byId[link.to_id] // XXX
        link[options.to] = to;
        // to.in += link;
        if (!to[options.in].find(l => l.id === link.id)) to[options.in].push(link);
        // to.inByType[link.type_id] += link;
        to[options.inByType][link[options.type_id]] = to[options.inByType][link[options.type_id]] || [];
        if (!to[options.inByType][link[options.type_id]].find(l => l.id === link.id)) to[options.inByType][link[options.type_id]].push(link);
      } else if (link[options.to_id]) anomalies.push(new Error(`${link[options.id]} link.to_id ${link[options.to_id]} not founded`));
      if (options.handler) options.handler(link, this);
    }
    for (let l = 0; l < newLinks.length; l++) {
      const link: L = newLinks[l];
      if (!this._updating) this.emitter.emit('added', link);
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
      _remove(link?.[options.to]?.[options.in], (r) => r.id === id);
      // link.out += byFrom[link.id] // XXX
      _remove(link?.[options.from]?.[options.out], (r) => r.id === id);

      // byFrom[link.from_id]: link[]; // XXX
      _remove(byFrom?.[link?.[options.from_id]] || [], r => r.id === id);

      // byTo[link.to_id]: link[]; // XXX
      _remove(byTo?.[link?.[options.to_id]] || [], r => r.id === id);

      // byType[link.type_id]: link[]; // XXX
      _remove(byType?.[link?.[options.type_id]] || [], r => r.id === id);

      // from.outByType[link.type_id] += link; // XXX
      _remove(link?.[options.from]?.outByType?.[link.type_id] || [], r => r.id === id)

      // to.inByType[link.type_id] += link; // XXX
      _remove(link?.[options.to]?.inByType?.[link.type_id] || [], r => r.id === id)

      for (let i = 0; i < byFrom?.[id]?.length; i++) {
        const dep = byFrom?.[id]?.[i];
        // link.from = byId[link.from_id] // XXX
        dep[options.from] = undefined;
      }

      for (let i = 0; i < byTo?.[id]?.length; i++) {
        const dep = byTo?.[id]?.[i];
        // link.to = byId[link.to_id] // XXX
        dep[options.to] = undefined;
      }

      for (let i = 0; i < byType?.[id]?.length; i++) {
        const dep = byType?.[id]?.[i];
        // link.type = byId[link.type_id] // XXX
        dep[options.type] = undefined;
      }

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
  apply(linksArray: any[]): {
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
      if (!old) toAdd.push(link);
      else if (!options.equal(old, link)) {
        toUpdate.push(link);
        beforeUpdate[link.id] = old;
      }
      _byId[link.id] = link;
    }
    for (let l = 0; l < links.length; l++) {
      const link = links[l];
      if (!_byId[link.id]) toRemove.push(link);
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

export function useMinilinksFilter<L extends Link<number>>(ml, filter: (l) => boolean, results: (l: L, ml) => L[]): L | L[] {
  const [state, setState] = useState<L|L[]>();
  useEffect(() => {
    const addedListener = (ol, nl) => {
      if (filter(nl)) setState(results(nl, ml));
    };
    ml.emitter.on('added', addedListener);
    const updatedListener = (ol, nl) => {
      if (filter(nl)) setState(results(nl, ml));
    };
    ml.emitter.on('updated', updatedListener);
    const removedListener = (ol, nl) => {
      if (filter(nl)) setState(results(ol, ml));
    };
    ml.emitter.on('removed', removedListener);
    setState(results(undefined, ml));
    return () => {
      ml.emitter.removeListener('added', addedListener);
      ml.emitter.removeListener('updated', updatedListener);
      ml.emitter.removeListener('removed', removedListener);
    };
  });
  return state;
};
