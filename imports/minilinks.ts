import _remove from 'lodash/remove';
import _isEqual from 'lodash/isEqual';
import EventEmitter from 'events';
import { useMemo, useRef } from 'react';
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
};

export interface MinilinksInstance<L extends Link<number>>{
  (linksArray: L[], memory?: MinilinksResult<L>): MinilinksResult<L>
}

export function Minilinks<MGO extends MinilinksGeneratorOptions, L extends Link<number>>(options: MGO): MinilinksInstance<L> {
  return function minilinks<L>(linksArray = [], memory: any = {}): MinilinksResult<L> {
    if (!memory.options) memory.options = options;
    const types: { [id: number]: L[] } = memory.types || {};
    const byId: { [id: number]: L } = memory.byId || {};
    const links: L[] = memory.links || [];
    const newLinks: L[] = [];
    for (let l = 0; l < linksArray.length; l++) {
      if (byId[linksArray[l][options.id]]) {
        if (options.handler) options.handler(byId[linksArray[l][options.id]], memory);
      } else {
        const link = { ...linksArray[l], [options.typed]: [], [options.in]: [], [options.out]: [], [options.inByType]: {}, [options.outByType]: {} };
        byId[link[options.id]] = link;
        types[link[options.type_id]] = types[link[options.type_id]] || [];
        types[link[options.type_id]].push(link);
        links.push(link);
        newLinks.push(link);
      }
    }
    for (let l = 0; l < newLinks.length; l++) {
      const link = newLinks[l];
      if (byId[link[options.type_id]]) {
        link[options.type] = byId[link[options.type_id]];
        byId[link[options.type_id]][options.typed].push(link);
      }
      if (byId[link[options.from_id]]) {
        link[options.from] = byId[link[options.from_id]];
        byId[link[options.from_id]][options.out].push(link);
        byId[link[options.from_id]][options.outByType][link[options.type_id]] = byId[link[options.from_id]][options.outByType][link[options.type_id]] || [];
        byId[link[options.from_id]][options.outByType][link[options.type_id]].push(link);
      }
      if (byId[link[options.to_id]]) {
        link[options.to] = byId[link[options.to_id]];
        byId[link[options.to_id]][options.in].push(link);
        byId[link[options.to_id]][options.inByType][link[options.type_id]] = byId[link[options.to_id]][options.inByType][link[options.type_id]] || [];
        byId[link[options.to_id]][options.inByType][link[options.type_id]].push(link);
      }
      if (options.handler) options.handler(link, memory);
    }
    if (!memory.types) memory.types = types;
    if (!memory.byId) memory.byId = byId;
    if (!memory.links) memory.links = links;
    return memory;
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
    const { byId, byFrom, byTo, byType, links, options } = this;
    const anomalies = [];
    const errors = [];
    const newLinks: L[] = [];
    for (let l = 0; l < linksArray.length; l++) {
      if (!!byId[linksArray[l][options.id]]) errors.push(new Error(`${linksArray[l][options.id]} can't add because already exists in collection`));
      if (byId[linksArray[l][options.id]]) {
        if (options.handler) options.handler(byId[linksArray[l][options.id]], this);
      } else {
        const link = { ...linksArray[l], [options.typed]: [], [options.in]: [], [options.out]: [], [options.inByType]: {}, [options.outByType]: {} };
        byId[link[options.id]] = link;
        if (link[options.from_id]) {
          if (byFrom[link[options.from_id]]) byFrom[link[options.from_id]].push(link);
          else byFrom[link[options.from_id]] = [link]
        }
        if (link[options.to_id]) {
          if (byTo[link[options.to_id]]) byTo[link[options.to_id]].push(link);
          else byTo[link[options.to_id]] = [link]
        }
        if (link[options.type_id]) {
          if (byType[link[options.type_id]]) byType[link[options.type_id]].push(link);
          else byType[link[options.type_id]] = [link]
        }
        if (byType[link[options.id]]?.length) {
          for (let i = 0; i < byType[link[options.id]]?.length; i++) {
            const dep = byType[link[options.id]][i];
            dep.type = link;
            link[options.typed].push(dep);
          }
        }
        if (byFrom[link[options.id]]?.length) {
          for (let i = 0; i < byFrom[link[options.id]]?.length; i++) {
            const dep = byFrom[link[options.id]][i];
            dep.from = link;
            link[options.out].push(dep);
          }
        }
        if (byTo[link[options.id]]?.length) {
          for (let i = 0; i < byTo[link[options.id]]?.length; i++) {
            const dep = byTo[link[options.id]][i];
            dep.to = link;
            link[options.in].push(dep);
          }
        }
        links.push(link);
        newLinks.push(link);
      }
    }
    for (let l = 0; l < newLinks.length; l++) {
      const link: L = newLinks[l];
      if (byId[link[options.type_id]]) {
        link[options.type] = byId[link[options.type_id]];
        byId[link[options.type_id]][options.typed].push(link);
      } else if (link[options.type_id]) anomalies.push(new Error(`${link[options.id]} link.type_id ${link[options.type_id]} not founded`));
      if (byId[link[options.from_id]]) {
        link[options.from] = byId[link[options.from_id]];
        byId[link[options.from_id]][options.out].push(link);
        byId[link[options.from_id]][options.outByType][link[options.type_id]] = byId[link[options.from_id]][options.outByType][link[options.type_id]] || [];
        byId[link[options.from_id]][options.outByType][link[options.type_id]].push(link);
      } else if (link[options.from_id]) anomalies.push(new Error(`${link[options.id]} link.from_id ${link[options.from_id]} not founded`));
      if (byId[link[options.to_id]]) {
        link[options.to] = byId[link[options.to_id]];
        byId[link[options.to_id]][options.in].push(link);
        byId[link[options.to_id]][options.inByType][link[options.type_id]] = byId[link[options.to_id]][options.inByType][link[options.type_id]] || [];
        byId[link[options.to_id]][options.inByType][link[options.type_id]].push(link);
      } else if (link[options.to_id]) anomalies.push(new Error(`${link[options.id]} link.to_id ${link[options.to_id]} not founded`));
      if (options.handler) options.handler(link, this);
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
    const { byId, byFrom, byTo, byType, types, links, options } = this;
    const anomalies = [];
    const errors = [];
    const newLinks: L[] = [];
    for (let l = 0; l < idsArray.length; l++) {
      const id = idsArray[l];
      if (!byId[id]) errors.push(new Error(`${id} can't delete because not exists in collection`));
      for (let i = 0; i < byFrom?.[id]?.length; i++) {
        const dep = byFrom?.[id]?.[i];
        dep[options.from] = undefined;
      }
      delete byFrom?.[id];
      for (let i = 0; i < byTo?.[id]?.length; i++) {
        const dep = byTo?.[id]?.[i];
        dep[options.to] = undefined;
      }
      delete byTo?.[id];
      for (let i = 0; i < byType?.[id]?.length; i++) {
        const dep = byType?.[id]?.[i];
        dep[options.type] = undefined;
      }
      delete byType?.[id];
      delete byId?.[id];
      if (!this._updating) this.emitter.emit('removed', id);
    }
    _remove(links, l => idsArray.includes(l[options.id]));
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
    const { byId, byFrom, byTo, byType, types, links, options } = this;
    const toAdd = [];
    const toUpdate = [];
    const toRemove = [];
    const _byId: any = {};
    for (let l = 0; l < linksArray.length; l++) {
      const link = linksArray[l];
      const old = byId[link.id];
      console.log('link', link, 'old', old);
      if (!old) toAdd.push(link);
      else if (!options.equal(old, link)) {
        toUpdate.push(link);
        this.emitter.emit('updated', old, link);
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

export function useMinilinks<L extends Link<number>>(): MinilinksHookInstance<L> {
  // @ts-ignore
  const mlRef = useRef<MinilinksResult<L>>(useMemo(() => {
    // @ts-ignore
    return new MinilinkCollection();
  }, []));
  const ml: MinilinksResult<L> = mlRef.current;
  return { ml, ref: mlRef };
}
