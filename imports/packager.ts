import Debug from 'debug';
import { DeepClient } from './client.js';
import type { DeepSerialOperation } from './client.js';
import { Link, minilinks, MinilinksResult } from './minilinks.js';

const debug = Debug('deeplinks:packager');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

export interface PackageIdentifier {
  name: string; // name in deep instance packages namespace
  version?: string; // selector
  uri?: string; // will be used for dependencies install in future
  type?: string; // optional if address not specified
  options?: any;
  // typeId?: number; TODO
}

export interface Package {
  package: PackageIdentifier;
  data: PackageItem[];
  dependencies?: { [id: number]: PackageIdentifier };
  strict?: boolean;
  errors?: PackagerError[];
}

export interface PackageItem {
  id: number | string;
  type?: number | string;
  from?: number | string;
  to?: number | string;
  value?: PackagerValue;

  package?: { dependencyId: number; containValue: string; };

  _?: boolean;
  updated?: string[];
}

export interface PackagerValue {
  id?: number | string;
  link_id?: number | string;
  value?: number | string | any;
}

export type PackagerError = any;

export interface PackagerImportResult {
  errors?: PackagerError[];
  ids?: number[];
  packageId?: number;
  namespaceId?: number;
}

export type PackagerMutated = { [index: number]: boolean };

export interface PackagerExportOptions {
  packageLinkId: number;
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
    // @ts-ignore
    global.packager = this;
  }

  /**
   * Fetch package namespace.
   */
  async fetchPackageNamespaceId(
    name: string,
    deep: DeepClient<number>,
  ): Promise<{ error: any, namespaceId: number }> {
    try {
      const q = await this.client.select({
        value: { _eq: name },
        link: { type_id: { _eq: await deep.id('@deep-foundation/core', 'PackageNamespace') } },
      }, {
        table: `strings`,
        returning: 'id: link_id'
      });
      return { error: false, namespaceId: q?.data?.[0]?.id };
    } catch(e) {
      log('fetchPackageNamespaceId error');
      return { error: e, namespaceId: 0 };
    }
    return { error: true, namespaceId: 0 };
  }

  /**
   * Fetch package namespace.
   */
  async fetchDependenciedLinkId(
    pckg: Package,
    dependedLink: PackageItem,
  ): Promise<number> {
    try {
      const packageName = pckg?.dependencies?.[dependedLink?.package?.dependencyId]?.name;
      const packageTableName = `strings`;
      const q = await this.client.select({
        value: dependedLink?.package?.containValue,
        link: { from: { [packageTableName as any]: { value: packageName } } },
      }, {
        table: `strings`,
        returning: 'id link { id: to_id }'
      });
      return q?.data?.[0]?.link?.id || 0;
    } catch(e) {
      log('fetchDependenciedLinkId error');
      error(e);
    }
    return 0;
  }

  async insertItem(
    items: PackageItem[],
    item: PackageItem,
    errors: PackagerError[],
    mutated: PackagerMutated,
  ) {
    log('insertItem', item);
    try {
      // insert link section
      if (item.type) {
        const insert = { id: +item.id, type_id: +item.type, from_id: +item.from || 0, to_id: +item.to || 0 };
        // const linkInsert = await this.client.insert(insert, { name: 'IMPORT_PACKAGE_LINK' });
        const operations : DeepSerialOperation[] = [{
          table: 'links',
          type: 'insert',
          objects: [insert]
        }];

        log('insertItem promise awaited', item.id);
        if (item.value && !item.package) {
          log('insertItem value', item);
          let valueLink
          if (!item.type) {
            valueLink = items.find(i => i.id === item.id && !!i.type);
            log('insertItem .value', item, valueLink);  
          } else {
            valueLink = item;
          }
          if (!valueLink) {
            log('insertItem insertValue error');
            errors.push(`Link ${JSON.stringify(item)} for value is not found.`);
          }
          else {
            log('insertItem tables');
            const type = typeof(item?.value?.value);
            // const valueInsert = await this.client.insert({ link_id: valueLink.id, ...item.value }, { table: `${type}s` as any, name: 'IMPORT_PACKAGE_VALUE' });
            operations.push(
              {
                // @ts-ignore
                table: `${type}s`,
                type: 'insert',
                objects: [{ 
                  link_id: valueLink.id, 
                  ...item.value
                }]
              }
            );
            // log('insertItem valueInsert', valueInsert);
            // if (valueInsert?.errors) {
            //   log('insertItem insertValue error', { link_id: valueLink.id, ...item.value });
            //   errors.push(valueInsert?.errors);
            // }
          }
        }
        const linkInsert = await this.client.serial({
          name: 'IMPORT_PACKAGE_LINK',
          operations
        });
        if (linkInsert?.errors) {
          log('insertItem linkInsert error', insert);
          errors.push(linkInsert?.errors);
        }
        log('insertItem promise', item.id);
        await this.client.await(+item.id);
      }
    } catch(e) {
      log('insertItem error');
      error(e);
      errors.push(e);
    }
    return;
  }

  async insertItems(
    pckg: Package,
    data: PackageItem[],
    counter: number,
    dependedLinks: PackageItem[],
    errors: PackagerError[] = [],
    mutated: { [index: number]: boolean } = {},
  ): Promise<any> {
    try {
      for (let i = 0; i < dependedLinks.length; i++) {
        const item = dependedLinks[i];
        await this.insertItem(data, item, errors, mutated);
        if (errors.length) return { ids: [] };
      }
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.package) {
          await this.insertItem(data, item, errors, mutated);
          if (errors.length) return { ids: [] };
        }
      }
      return;
    } catch(e) {
      log('insertItems error');
      error(e);
      errors.push(e);
    }
    return;
  }

  async globalizeIds(pckg: Package, ids: number[], links: PackageItem[]): Promise<{ global: PackageItem[], difference: { [id:number]:number; } }> {
    const difference = {};
    const global = links.map(l => ({ ...l }));
    let idsIndex = 0;
    for (let l = 0; l < links.length; l++) {
      const item = links[l];
      const oldId = item.id;
      let newId;
      if (item.package) {
        newId = await this.client.id(pckg?.dependencies?.[item?.package?.dependencyId]?.name, item.package.containValue, true);
        if (!newId) pckg.errors.push(`dependency [${pckg?.dependencies?.[item?.package?.dependencyId]?.name} ${item.package.containValue}], not found`);
      } else if (item.type) {
        newId = ids[idsIndex++];
      }
      if (oldId && newId) difference[oldId] = newId;
      // type - link, package - ref to exists link, but may be will add new standards
      if (item.type || item.package) {
        for (let l = 0; l < links.length; l++) {
          const link = links[l];
          if (link.from === oldId) {
            global[l].from = newId;
          }
          if (link.to === oldId) {
            global[l].to = newId;
          }
          if (link.type === oldId && !link._) {
            global[l].type = newId;
          }
          if (link.id === oldId) {
            global[l].id = newId;
          }
        }
      }
      // log(item, global[l]);
    }
    const resultGlobal = global.filter(l => !l.package);
    return { global: resultGlobal, difference };
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
   * Import into system pckg.
   */
  async import(pckg: Package): Promise<PackagerImportResult> {
    const errors = [];
    try {
      this.validate(pckg, errors);
      if (errors.length) return { errors };
      const { data, counter, dependedLinks, packageId, namespaceId } = await this.deserialize(pckg, errors); 
      if (errors.length) return { errors };
      const { sorted } = sort(pckg, data, errors, {
        id: 'id',
        from: 'from',
        to: 'to',
        type: 'type',
      });
      if (errors.length) return { errors };
      const mutated = {};
      const ids = await this.client.reserve(counter);
      const { global, difference } = await this.globalizeIds(pckg, ids, sorted);
      if (pckg.errors?.length) {
        return { errors: pckg.errors };
      }
      await this.insertItems(pckg, global, counter, dependedLinks, errors, mutated);
      if (errors.length) return { errors };
      return { ids, errors, namespaceId: difference[namespaceId], packageId: difference[packageId] };
    } catch(e) {
      log('import error');
;     errors.push(e);
    }
    return { ids: [], errors };
  }

  async selectLinks(options: PackagerExportOptions): Promise<MinilinksResult<PackagerLink>> {
    const Contain = await this.client.id('@deep-foundation/core', 'Contain');
    const Package = await this.client.id('@deep-foundation/core', 'Package');
    const PackageVersion = await this.client.id('@deep-foundation/core', 'PackageVersion');
    const result = await this.client.select({
      _or: [
        { id: { _eq: options.packageLinkId } },
        { type_id: { _eq: Contain }, from: { id: { _eq: options.packageLinkId } } },
        { in: { type_id: { _eq: Contain }, from: { id: { _eq: options.packageLinkId } } } },
        { type_id: { _eq: PackageVersion }, to: { id: { _eq: options.packageLinkId } } },
      ],
      order_by: {id: 'asc'}
    }, {
      name: 'LOAD_PACKAGE_LINKS',
      returning: `
          id type_id from_id to_id value
          contains: in(where: { type_id: { _eq: ${Contain} }, string: { value: { _is_null: false } }, from: { type_id: { _eq: ${Package} } } }) {
            id value
            package: from {
              id value
              versions: in(where: {type_id: {_eq: ${PackageVersion}}, string: { value: { _is_null: false } }}) {
                id
                value
              }
            }
          }
          _type:type {
            id value
            contains: in(where: { type_id: { _eq: ${Contain} }, string: { value: { _is_null: false } }, from: { type_id: { _eq: ${Package} } } }) {
              id value
              package: from {
                id value
                versions: in(where: {type_id: {_eq: ${PackageVersion}}, string: { value: { _is_null: false } }}) {
                  id
                  value
                }
              }
            }
          }
          _from:from {
            id
            contains: in(where: { type_id: { _eq: ${Contain} }, string: { value: { _is_null: false } }, from: { type_id: { _eq: ${Package} } } }) {
              id value
              package: from {
                id value
                versions: in(where: {type_id: {_eq: ${PackageVersion}}, string: { value: { _is_null: false } }}) {
                  id
                  value
                }
              }
            }
          }
          _to:to {
            id
            contains: in(where: { type_id: { _eq: ${Contain} }, string: { value: { _is_null: false } }, from: { type_id: { _eq: ${Package} } } }) {
              id value
              package: from {
                id value
                versions: in(where: {type_id: {_eq: ${PackageVersion}}, string: { value: { _is_null: false } }}) {
                  id
                  value
                }
              }
            }
          }
        `
    })
    return minilinks((result)?.data);
  }

  /** Deserialize pckg data to links list with local numerical ids. */
  async deserialize(
    pckg: Package,
    errors: PackagerError[] = [],
  ): Promise<{
    data: PackageItem[];
    errors?: PackagerError[];
    counter: number;
    dependedLinks: PackageItem[];
    packageId: number;
    namespaceId: number;
  }> {
    const Contain = await this.client.id('@deep-foundation/core', 'Contain');
    const Join = await this.client.id('@deep-foundation/core', 'Join');
    const Package = await this.client.id('@deep-foundation/core', 'Package');
    const PackageNamespace = await this.client.id('@deep-foundation/core', 'PackageNamespace');
    const Active = await this.client.id('@deep-foundation/core', 'PackageActive');
    const Version = await this.client.id('@deep-foundation/core', 'PackageVersion');
    // clone for now hert pckg object
    const containsHash: { [key: string]: number } = {};
    let counter = 0;
    const dependedLinks = [];
    let packageId;
    const data: PackageItem[] = [];
    packageId = 'package';
    if (pckg.package.name !== corePackage) {
      containsHash[packageId] = ++counter;
      // package
      data.push({
        id: packageId,
        type: Package,
        value: { value: pckg.package.name },
        // @ts-ignore
        _: true,
      });
    }
    data.push(...pckg.data.map(l => ({ ...l, value: l.value ? { ...l.value } : undefined })));
    // log(data);
    // string id field to numeric ids
    for (let l = 0; l < data.length; l++) {
      const item = data[l];
      const local = item.id;
      if (containsHash[local]) item.id = containsHash[local];
      else containsHash[local] = (item.id = ++counter);
      if (item.package) dependedLinks.push(item);
    }
    // log(data);
    // type, from, to fields to numeric ids
    for (let l = 0; l < data.length; l++) {
      const item = data[l];
      if (item.type && !item._) {
        if (!containsHash[item.type]) errors.push(`${item.id} type ${item.type} !contain ${containsHash[item.type]}`);
        item.type = containsHash[item.type];
      }
      if (item.from) {
        if (!containsHash[item.from]) errors.push(`${item.id} from ${item.from} !contain ${containsHash[item.from]}`);
        item.from = containsHash[item.from];
      }
      if (item.to) {
        if (!containsHash[item.to]) errors.push(`${item.id} to ${item.to} !contain ${containsHash[item.to]}`);
        item.to = containsHash[item.to];
      }
    }
    // log(data);
    if (pckg.package.name === corePackage) {
      packageId = 'package';
      containsHash[packageId] = ++counter;
      // package
      data.push({
        id: packageId,
        type: Package,
        value: { value: pckg.package.name },
        // @ts-ignore
        _: true,
      });
    }
    // create contains links
    const containsArray = Object.keys(containsHash);
    for (let c = 0; c < containsArray.length; c++) {
      const containKey = containsArray[c];
      // each contain to package value
      if (containsHash[containKey] != containsHash[packageId] && !!data.find(l => l?.id === containsHash[containKey] && !l?.package)) {
        data.push({
          id: ++counter,
          type: Contain,
          from: containsHash[packageId],
          to: containsHash[containKey],
          value: { value: containKey },
          // @ts-ignore
          _: true,
        });
      }
    }
    const n = await this.fetchPackageNamespaceId(pckg.package.name, this.client);
    if (n.error) errors.push(n.error);
    let namespaceId = n.namespaceId;
    if (!namespaceId) {
      namespaceId = ++counter;
      // namespace it self
      data.push({
        id: namespaceId,
        type: PackageNamespace,
        value: { value: pckg.package.name },
        // @ts-ignore
        _: true,
      });
      // user contain package namespace
      if (this.client.linkId) {
        data.push({
          id: ++counter,
          type: Contain,
          from: this.client.linkId,
          to: namespaceId,
          // @ts-ignore
          _: true,
        });
        data.push({
          id: ++counter,
          type: Join,
          from: namespaceId,
          to: this.client.linkId,
          // @ts-ignore
          _: true,
        });
      }
      // active link if first in namespace
      data.push({
        id: ++counter,
        type: Active,
        to: containsHash[packageId],
        from: namespaceId,
        // @ts-ignore
        _: true,
      });
    }
    // version link
    data.push({
      id: ++counter,
      type: Version,
      to: containsHash[packageId],
      from: namespaceId,
      value: { value: pckg.package.version },
      // @ts-ignore
      _: true,
    });
    // contain link
    data.push({
      id: ++counter,
      type: Contain,
      from: namespaceId,
      to: containsHash[packageId],
      // @ts-ignore
      _: true,
    });
    if (pckg.package.name !== corePackage) {
      const packages = await this.client.id('deep', 'users', 'packages');
      data.push({
        id: ++counter,
        type: Join,
        from: containsHash[packageId],
        to: packages,
        // @ts-ignore
        _: true,
      });
      data.push({
        id: ++counter,
        type: Contain,
        from: packages,
        to: containsHash[packageId],
        // @ts-ignore
        _: true,
      });
    }
    // user contain package
    if (this.client.linkId) data.push({
      id: ++counter,
      type: Contain,
      from: this.client.linkId,
      to: containsHash[packageId],
      // @ts-ignore
      _: true,
    });
    return { data, errors, counter, dependedLinks, packageId: containsHash[packageId], namespaceId };
  }

  // translate from ml structure to package structure
  async serialize(globalLinks: MinilinksResult<PackagerLink>, options: PackagerExportOptions, pckg: Package) {
    const Contain = await this.client.id('@deep-foundation/core', 'Contain');

    // checks
    const names = {};
    for (let l = 0; l < globalLinks.links.length; l++) {
      const globalLink = globalLinks.links[l];
      if (globalLink?.contains?.length > 1) pckg.errors.push(`Link ${globalLink.id} have more then 1 Contain from package ${JSON.stringify(globalLink?.contains)}.`);
      if (
        // NOT contain in ( package |- contain -> * )
        !(globalLink?.type_id === Contain && globalLink?.from?.id === options.packageLinkId)
        // NOT package
        && globalLink?.id !== options.packageLinkId
      ) {
        // for (const contain of (globalLink?.contains || [])) {
        //   const name = contain?.value?.value;
        const name = globalLink?.contains?.[0]?.value?.value;
        if (!name) pckg.errors.push(`Link ${globalLink.id} has empty or invalid name: '${name}'.`);
        if (name === "this") pckg.errors.push(`Link ${globalLink.id} has invalid name: '${name}'. '${name}' is reserved for package itself, so it cannot be used as a name for link that is contained by package.`);
        if (names[name]) pckg.errors.push(`Link ${globalLink.id} has name '${name}' that is already used by ${names[name]} link.`);
        names[name] = globalLink.id;
        // }
      }
    }

    const localLinks = {};
    const lbyg = {};
    const gbyl = {};
    let localCounter = 1;
    const addLocalLink = (gId, localLink) => {
      if (!localLink.id) localLink.id = localCounter++;
      gbyl[localLink.id] = gId;
      lbyg[gId] = localLink.id;
      localLinks[localLink.id] = localLink;
      return localLink;
    };
    // convert global id to local id
    for (let g = 0; g < globalLinks.links.length; g++) {
      const link = globalLinks.links[g];
      // need to add into local? (not package, not contain)
      if (
        // NOT contain in ( package |- contain -> * )
        !(link?.type_id === Contain && link?.from?.id === options.packageLinkId)
        // NOT package
        && link?.id !== options.packageLinkId
      ) {
        // for (const contain of (link?.contains || [])) {
        //   const name = contain?.value?.value;
        const name = link?.contains?.[0]?.value?.value;
        addLocalLink(link.id, { id: name });
        // }
      }
    }
    // addLocalLink(options.packageLinkId, { id: 'this' });

    // convert global from_id to_id type_id to local from_id to_id type_id
    // generate dependencies
    const dependencies = [];
    const getDependencyIndex = (link) => {
      const alreadyIndex = dependencies.findIndex(l => l.name === link?.contains?.[0]?.package?.value?.value);
      if (!!~alreadyIndex) {
        return alreadyIndex;
      } else {
        dependencies.push({ name: link?.contains?.[0]?.package?.value?.value, version: link?.contains?.[0]?.package?.versions?.[0]?.value?.value });
        return dependencies.length - 1;
      }
    };
    const getDependencyId = (link) => {
      if (!link?.id) {
        return link?.id;
      }
      const dependencyId = getDependencyIndex(link);
      const containValue = link?.contains?.[0]?.value?.value;
      const exists = Object.values(localLinks).find((l:any) => l?.package?.dependencyId === dependencyId && l?.package?.containValue === containValue);
      const result = exists || addLocalLink(link?.id, {
        package: { dependencyId, containValue }
      });
      return result;
    };
    for (let g = 0; g < globalLinks.links.length; g++) {
      const globalLink = globalLinks.links[g];
      // need to add into local? (not package, not contain)
      if (
        // NOT contain in ( package |- contain -> * )
        !(globalLink?.type_id === Contain && globalLink?.from?.id === options.packageLinkId)
        // NOT package
        && globalLink?.id !== options.packageLinkId
      ) {
        const localLink = localLinks[lbyg[globalLink.id]];
        if (localLink) {
          if (globalLink.type_id) {
            if (globalLink.type) {
              localLink.type_id = localLinks[lbyg[globalLink.type_id]]?.id;
              if (typeof localLink.type_id !== 'string') {
                pckg.errors.push(`Link '${globalLink.id}' is serialized as '${localLink.id}': its 'type_id' has invalid value '${localLink.type_id}' converted from '${globalLink.type_id}'.`);
              }
            } else if (globalLink._type) {
              localLink.type_id = getDependencyId(globalLink._type)?.id;
              if (!Number.isInteger(localLink.type_id)) {
                pckg.errors.push(`Link '${globalLink.id}' is serialized as '${localLink.id}': its 'type_id' has invalid value '${localLink.type_id}' converted from '${globalLink._type}'.`);
              }
            } else {
              pckg.errors.push(`Unable to determine 'type_id' for link '${globalLink.id}' that is serialized as '${localLink.id}'.`);
            }
          }
          if (globalLink.from_id) {
            if (globalLink.from) {
              localLink.from_id = localLinks[lbyg[globalLink.from_id]]?.id;
              if (typeof localLink.from_id !== 'string') {
                pckg.errors.push(`Link '${globalLink.id}' is serialized as '${localLink.id}': its 'from_id' has invalid value '${localLink.from_id}' converted from '${globalLink.from_id}'.`);
              }
            } else if (globalLink._from) {
              localLink.from_id = getDependencyId(globalLink._from)?.id;
              if (!Number.isInteger(localLink.from_id)) {
                pckg.errors.push(`Link '${globalLink.id}' is serialized as '${localLink.id}': its 'from_id' has invalid value '${localLink.from_id}' converted from '${globalLink._from}'.`);
              }
            } else {
              pckg.errors.push(`Unable to determine 'from_id' for link '${globalLink.id}' that is serialized as '${localLink.id}'.`);
            }
          }
          if (globalLink.to_id) {
            if (globalLink.to) {
              localLink.to_id = localLinks[lbyg[globalLink.to_id]]?.id;
              if (typeof localLink.to_id !== 'string') {
                pckg.errors.push(`Link '${globalLink.id}' is serialized as '${localLink.id}': its 'from_id' has invalid value '${localLink.to_id}' converted from '${globalLink.to_id}'.`);
              }
            } else if (globalLink._to) {
              localLink.to_id = getDependencyId(globalLink._to)?.id;
              if (!Number.isInteger(localLink.to_id)) {
                pckg.errors.push(`Link '${globalLink.id}' is serialized as '${localLink.id}': its 'from_id' has invalid value '${localLink.to_id}' converted from '${globalLink._to}'.`);
              }
            } else {
              pckg.errors.push(`Unable to determine 'to_id' for link '${globalLink.id}' that is serialized as '${localLink.id}'.`);
            }
          }
          if (globalLink.value) {
            localLink.value = { value: globalLink?.value?.value };
          }
        }
      }
    }
    pckg.data = Object.values(localLinks).map((l: any) => (l.type_id ? {
      id: l.id,
      type: l.type_id,
      from: l.from_id,
      to: l.to_id,
      value: l.value,
    } : { ...l }));
    pckg.dependencies = dependencies;
    return pckg;
  }

  /**
   * Export from system pckg by package link id.
   */
  async export(options: PackagerExportOptions): Promise<Package> {
    const globalLinks = await this.selectLinks(options);
    const Package = await this.client.id('@deep-foundation/core', 'Package');
    const PackageVersion = await this.client.id('@deep-foundation/core', 'PackageVersion');
    const versionLink: any = globalLinks.types[PackageVersion]?.[0];
    const packageLink: any = globalLinks.types[Package]?.[0];
    const pckg: Package = {
      package: { name: packageLink?.value?.value, version: versionLink?.value?.value },
      data: [],
      errors: []
    };
    if (pckg.package.name === '@deep-foundation/core') {
      pckg.strict = true;
    }

    if (!packageLink) pckg.errors.push(`Failed to fetch Package link for package with id ${options.packageLinkId}.`);
    if (!versionLink) pckg.errors.push(`Failed to fetch PackageVersion link for package with id ${options.packageLinkId}.`);
    if (!pckg?.package?.name) pckg.errors.push(`Package name ('${pckg?.package?.name}') is missing or invalid in Package link with id ${packageLink?.id}.`);
    if (!pckg?.package?.version) pckg.errors.push(`Package version ('${pckg?.package?.version}') is missing or invalid in PackageVersion link with id ${versionLink?.id}.`);
    if (pckg?.errors?.length) return pckg;

    const ml = minilinks(globalLinks.links.filter(l => l.id !== versionLink?.id));
    const { sorted } = sort(pckg, ml.links, pckg.errors, {
      id: 'id',
      from: 'from_id',
      to: 'to_id',
      type: 'type_id',
    });
    ml.links = sorted;
    // log('pckg1', JSON.stringify(pckg));
    await this.serialize(ml, options, pckg);
    // log('pckg2', JSON.stringify(pckg));
    this.validate(pckg, pckg.errors);
    return pckg;
  }
}