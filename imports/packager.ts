import Debug from 'debug';
import { DeepClient } from './client.js';
import type { DeepSerialOperation } from './client.js';
import { Id, Link, minilinks, MinilinksResult } from './minilinks.js';
import { delay } from './promise.js';
import isEqual from 'lodash/isEqual.js';

const debug = Debug('deeplinks:packager');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output

export interface PackageIdentifier {
  name?: string; // name in deep instance packages namespace
  version?: string; // selector
  uri?: string; // will be used for dependencies install in future
  type?: string; // optional if address not specified
  options?: any;
  // typeId?: number; TODO
}

export interface Package {
  package?: PackageIdentifier;
  data?: Array<PackageItem>;
  dependencies?: Array<PackageIdentifier>;
  strict?: boolean;
  errors?: PackagerError[];
}

export interface PackageItem {
  id: Id | string;
  type?: Id | string;
  from?: Id | string;
  to?: Id | string;
  value?: PackagerValue;
  alias?: Id;

  package?: { dependencyId: Id; containValue: string; };
}

export interface PackagerValue {
  id?: Id;
  link_id?: Id;
  value?: number | string | any;
}

export type PackagerError = any;

export interface PackagerImportResult {
  errors?: PackagerError[];
  ids?: Id[];
  packageId?: Id;
  namespaceId?: Id;
  inserting?: any[];
  updating?: any[];
  pckg?: Package;
}

export type PackagerMutated = { [index: number]: boolean };

export interface PackagerExportOptions {
  packageLinkId: Id;
}

export interface PackagerLink extends Link<any> {
  value?: any;
}

const corePackage = '@deep-foundation/core';

/** Generate inserting order for links and values. */
export function sort(
  pckg: Package,
  data: any[],
  errors: PackagerError[] = [],
  references: {
    id: string;
    from: string;
    to: string;
    type: string;
  }
) {
  let sorted = [];
  if (pckg.strict) {
    sorted = data;
  } else {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.value && !item[references.type]) {
        const max = sorted.reduce((p, l, index) => l[references.id] == item[references.id] ? index : p, 0);
        sorted.splice((max) + 1, 0, item);
      } else if (item.package) {
        sorted.splice(0, 0, item);
      } else {
        // @ts-ignore
        const _ = item?._;
        const firstDependIndex = sorted.findIndex((l, index) => {
          return l[references.from] == item[references.id] || l[references.to] == item[references.id] || (
            // @ts-ignore
            (l[references.type] == item[references.id]) && !l._
          );
        });
        const maxDependIndex = sorted.reduce((p, l, index) => {
          return ((l[references.id] == item[references.type]) && !_) || l[references.id] == item[references.from] || l[references.id] === item[references.to] ? index : p;
        }, 0);
        const _index = (!!~firstDependIndex && firstDependIndex < maxDependIndex ? firstDependIndex : maxDependIndex)
        sorted.splice(_index + 1, 0, item);
      }
    }
  }
  return { sorted };
}

export class Packager<L extends Link<any>> {
  pckg: Package;
  client: DeepClient<any>;
  constructor(client: DeepClient<L>) {
    this.client = client;
  }

  validate(pckg: Package, errors: any[]) {
    if (pckg.strict) return;
    if (!pckg?.package?.name) errors.push(`!pckg?.package?.name`);
    if (!pckg?.package?.version) errors.push(`!pckg?.package?.version`);
    if (pckg.hasOwnProperty('dependencies')) {
      if (typeof(pckg?.dependencies) === 'object') {
        const keys = Object.keys(pckg?.dependencies);
        for (let i = 0; i < keys.length; i++) {
          const dep = pckg?.dependencies[keys[i]];
          if (typeof(dep) === 'object') {
            if (typeof(dep.name) !== 'string') errors.push(`!dep[${i}].name`);
            // if (typeof(dep.version) !== 'string') errors.push(`!dep[${i}].version`);
            // if (typeof(dep.uri) !== 'string') errors.push(`!dep[${i}].uri`);
            // if (typeof(dep.type) !== 'string') errors.push(`!dep[${i}].type`);
          } else errors.push(`!pckg.dependencies[keys[${i}]]`);
        }
      } else errors.push('!pckg?.dependencies');
    }
    if (Object.prototype.toString.call(pckg?.data) === '[object Array]') {
      for (let i = 0; i < pckg?.data.length; i++) {
        const item = pckg?.data[i];
        if (typeof(item) === 'object') {
          if (typeof(item?.id) !== 'string' && typeof(item?.id) !== 'number') errors.push(`!item[${i}].id`);
          if (typeof(item?.package) === 'object') {
            if (typeof(item?.package?.dependencyId) !== 'number') errors.push(`!item[${i}].package?.dependencyId`);
            if (typeof(item?.package?.containValue) !== 'string') errors.push(`!item[${i}].package?.containValue`);
            if (!pckg.dependencies?.[item.package.dependencyId]) errors.push(`!pckg.dependencies?.[pckg.data[${i}].package.dependencyId,(${item.package.dependencyId})]`);
          } else {
            if (typeof(item?.type) !== 'string' && typeof(item?.type) !== 'number') errors.push(`!item[${i}(id:${item?.id})].type`);
            if (item.hasOwnProperty('from') && typeof(item?.from) !== 'undefined') if (typeof(item?.from) !== 'string' && typeof(item?.from) !== 'number') errors.push(`!item[${i}(id:${item?.id})].from`);
            if (item.hasOwnProperty('to') && typeof(item?.to) !== 'undefined') if (typeof(item?.to) !== 'string' && typeof(item?.to) !== 'number') errors.push(`!item[${i}(id:${item?.id})].to`);
            if (item.value) {
              if (typeof(item?.value) !== 'object') errors.push(`!item[${i}].value`);
              else {
                if (typeof(item?.value?.value) !== 'number' && typeof(item?.value?.value) !== 'string' && typeof(item?.value?.value) !== 'object') errors.push(`!item[${i}].value.value`);
              }
            }
          }
        } else errors.push(`!pckg.dependencies[keys[${i}]]`);
      }
    } else errors.push('!pckg?.dependencies');
  }

  /**
   * Update packageId to pckg stage.
   */
  async update(packageId: Id, pckg: Package): Promise<PackagerImportResult> {
    if (!this.client.isId(packageId)) return { errors: ['!packageId'] };
    if (typeof(pckg) !== 'object') return { errors: ['!pckg'] };
    const { ids, inserting, updating, errors } = await this.apply(pckg, packageId);
    if (errors.length) return { errors };
    const { namespaceId } = await this.exec({ inserting, updating, pckg, packageId });
    return { ids, inserting, updating, errors, pckg, packageId, namespaceId };
  }

  /**
   * Import into system pckg.
   */
  async import(pckg: Package): Promise<PackagerImportResult> {
    if (typeof(pckg) !== 'object') return { errors: ['!pckg'] };
    const { ids, inserting, updating, errors } = await this.apply(pckg);
    if (errors.length) return { errors };
    const dc = '@deep-foundation/core';
    const Package = await this.client.id(dc, 'Package');
    const { data: [{ id: packageId }] } = await this.client.insert({ type_id: Package, string: (pckg as Package)?.package?.name });
    const { namespaceId } = await this.exec({ inserting, updating, packageId, pckg });
    return { ids, inserting, updating, errors, pckg, packageId, namespaceId };
  }

  /**
   * Generate { ids, errors, inserting, updating } to this.exec
   */
  async apply(pckg: Package, _packageId?: Id): Promise<{
    inserting?: any[];
    updating?: any[];
    package?: PackageIdentifier,
    ids?: number[];
    errors?: any[];
  }> {
    const deep = this.client;
    const errors = [];

    let idI = 0;
    const ids = Array.from(Array(pckg.data.length).keys()).map(id => id+99999999);
    // const ids = await deep.reserve(pckg.data.length);

    const dc = '@deep-foundation/core';
    const Contain = await deep.id(dc, 'Contain');

    const packageId = _packageId || ids[idI++];
    const inserting = [];
    const updating = [];
    const remembered: any = {};
    const remember = (itemId: Id, linkId: Id) => {
      remembered[itemId] = linkId;
    }
    const remind = async (itemId: Id) => {
      console.log('remind', itemId);
      if (!itemId) return 0;
      if (remembered[itemId]) return remembered[itemId];
      else {
        const item = pckg.data.find(i => i.id == itemId);
        await fill(item);
      }
    }
    const fill = async (item: PackageItem) => {
      console.log('fill', item);
      await delay(100);
      if (item.package) {
        const pId =await deep.id(
          pckg.dependencies[item.package.dependencyId].name,
          item.package.containValue,
        );
        console.log('fill', 'package', pId, 
          pckg.dependencies[item.package.dependencyId].name,
          item.package.containValue,
        );
        remember(item.id, pId);
      } else if (item.alias) {
        const linkId = await remind(item.alias);
        const ins = { type_id: Contain, from_id: packageId, to_id: linkId, string: item.id };
        inserting.push(ins);
        console.log('fill', 'inserting alias', ins);
        remember(item.id, linkId);
      } else {
        let exists;
        if (_packageId) exists = await deep.one({ id: { _id: [packageId, item.id] } });
        if (!exists) {
          const linkId = ids[idI++];
          const value = item?.value?.value;
          const v = typeof(value);
          const ins = {
            id: linkId,
            name: item.id,
            type_id: await remind(item.type),
            ...(item.from ? { from_id: await remind(item.from) } : {}),
            ...(item.to ? { to_id: await remind(item.to) } : {}),
            ...(item.to ? { to_id: await remind(item.to) } : {}),
            ...(!!value ? { [v]: { value } } : {})
          };
          inserting.push(ins);
          console.log('fill', 'inserting !exists', ins);
          remember(item.id, linkId);
        } else {
          const linkId = exists.id;
          console.log('fill', 'inserting exists', exists);
          remember(item.id, linkId);
          const value = item?.value?.value;
          if (!isEqual(exists?.value?.value, value)) updating.push({ id: linkId, value });
          const from_id = await remind(item.from);
          const to_id = await remind(item.to);
          if (from_id != exists.from_id || to_id != exists.to_id) updating.push({ id: linkId, from_id, to_id });
        }
      }
    }

    try {
      this.validate(pckg, errors);
      if (errors.length) return { errors };
      
      for (let item of pckg.data) {
        await fill(item)
      }

      if (errors.length) return { errors };
      return { ids, errors, inserting, updating, package: pckg.package };
    } catch(e) {
      errors.push(deep.stringify(e));
    }
    return { ids, errors };
  }

  async exec({
    pckg, packageId, inserting, updating
  }: {
    pckg: Package; packageId?: Id; inserting?: any[]; updating?: any[];
  }) {
    const deep = this.client;
    if (!deep.isId(packageId)) throw new Error('!packageId');
    await deep.insert(inserting.map(i => ({ ...i, containerId: packageId })));
    for (let u of updating) {
      if (u.value) await deep.value(u.id, u.value);
      else await deep.update(u.id, { from_id: u.from_id, to_id: u.to_id })
    }
    let version;
    const dc = '@deep-foundation/core';
    const PackageVersion = await deep.id(dc, 'PackageVersion');
    version = await deep.one({ type_id: PackageVersion, to_id: packageId });
    if (version) await deep.value(version.id, pckg.package.version);
    else {
      const PackageNamespace = await deep.id(dc, 'PackageNamespace');
      let namespace = await deep.one({ type_id: PackageNamespace, string: pckg.package.name });
      if (!namespace) namespace = (await deep.insert({ type_id: PackageNamespace, string: pckg.package.name }))?.data?.[0];
      await deep.insert({ type_id: PackageVersion, from_id: namespace.id, to_id: packageId, string: pckg.package.version });
      return { packageId, namespaceId: namespace.id };
    }
    return { packageId, namespaceId: version.from_id };
  }

  /**
   * Export from system pckg by package link id.
   */
  async export(options: PackagerExportOptions | Id): Promise<Package> {
    const deep = this.client;
    const packageId = typeof(options) === 'object' ? options?.packageLinkId : options;
    const errors = [];
    const pckg: Package = {
      package: {},
      errors,
      data: [],
      dependencies: [],
    };
    const error = (message) => {
      errors.push(message);
      throw new Error('!exported');
    };
    try {
      if (!(typeof(packageId) === 'number' || typeof(packageId) === 'string')) errors.push('!packageId');
      if (errors.length) return pckg;
      const dc = '@deep-foundation/core';
      const Contain = await deep.id(dc, 'Contain');
      const Package = await deep.id(dc, 'Package');
      const PackageVersion = await deep.id(dc, 'PackageVersion');
      const { data } = await deep.select({
        type_id: Package, id: packageId,
        return: {
          _version: {
            relation: 'in', type_id: PackageVersion,
          },
          _contains: {
            relation: 'out', type_id: Contain,
            return: {
              _item: {
                relation: 'to'
              },
            },
          },
        },
      });
      const load = async (id) => await deep.one({
        type_id: Contain,
        to_id: id,
        return: {
          _package: {
            relation: 'from',
            return: {
              _version: {
                relation: 'in', type_id: PackageVersion,
              },
            }
          },
        }
      });
      if (!data?.[0]) error(`!package ${packageId}`);
      pckg.package.name = data?.[0]?.value?.value;
      pckg.package.version = data?.[0]?._version?.[0]?.value?.value || '0.0.0';
      const contains = {}; // [name: Contain { _item | _package }]
      const ids = {}; // [id: Contain { _item | _package }]
      const packed = {}; // [id: { id type? from? to? value? package?{ dependencyId containValue } }]
      let dependId = 1;
      const depended = {}; // [idLink:  ]
      const dependencies = {}; // [idPackage: pckg.dependencies[index]]
      for (let l of data) {
        contains[l?.value?.value] = l;
        ids[l?.to_id] = l;
      }
      const find = async (id) => {
        if (!ids[id]) {
          ids[id] = await load(id);
          console.log('find', 'id', id, 'loaded', ids[id]?.value?.value, ids[id]?._package?.value?.value);
          if (!ids[id]?.value?.value) errors.push(`!${id}.name`);
          if (!ids[id]?._package?.id) error(`!${id}.package`);
          if (!dependencies.hasOwnProperty(`${ids[id]?._package?.id}`)) {
            dependencies[ids[id]?._package?.id] = pckg.dependencies.length;
            if (!ids[id]?._package?.value?.value) errors.push(`package !${ids[id]?._package?.id}?.value?.value`);
            if (!ids[id]?._package?._version?.[0]?.value?.value) errors.push(`package !${ids[id]?._package?.id}?.version?.value?.value`);
            pckg.dependencies.push({
              name: ids[id]?._package?.value?.value,
              version: ids[id]?._package?._version?.[0]?.value?.value
            });
            console.log('find', 'id', id, 'add dependency', dependencies[ids[id]?._package?.id], '=', ids[id]?._package?.value?.value);
          }
          if (!depended.hasOwnProperty(id)) {
            depended[id] = { id: dependId++, package: {
              dependencyId: dependencies[ids[id]?._package?.id],
              containValue: ids[id]?.value?.value,
            } };
            pckg.data.push(depended[id]);
            console.log('find', 'id', id, 'add depended', dependId);
          }
        } else {
          console.log('find', 'id', id, 'exists', ids[id]?.value?.value, ids[id]?._package?.value?.value);
        }
        if (!ids[id]) {
          error(`!${id}`);
        }
        return ids[id];
      };
      const pack = async (contain) => {
        const link = contain._item;
        console.log('pack', 'contain', contain.id, 'link', link.id);
        if (packed[link.id]) return packed[link.id];
        let _type, _from, _to;
        _type = await find(link.type_id);
        if (link.from_id) _from = await find(link.from_id);
        if (link.to_id) _to = await find(link.to_id);
        packed[link.id] = {
          id: contain?.value?.value,
          type: _type?._package ? depended[link.type_id].id : _type?.value?.value,
          from: _from?._package ? depended[link.from_id].id : _from?.value?.value,
          to: _to?._package ? depended[link.to_id].id : _to?.value?.value,
          value: link?.value,
        };
        pckg.data.push(packed[link.id]);
      };
      for (let l of data?.[0]?._contains) {
        if (!l?.value?.value) errors.push(`!${l.id}.name`)
        contains[l?.value?.value] = l;
        ids[l?.to_id] = l;
      }
      for (let l of data?.[0]?._contains) {
        await pack(l);
      }
      return pckg;
    } catch(e) {
      errors.push(deep.stringify(e));
      return { errors };
    }  
  }
}