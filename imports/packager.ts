import Debug from 'debug';
import { DeepClient } from './client';
import { Link, minilinks, MinilinksResult } from './minilinks';

const debug = Debug('deeplinks:packager');

export interface PackagerPackageIdentifier {
  name: string;
  version?: string;
  uri?: string;
  type?: string;
  options?: any;
  // typeId?: number; TODO
}

export interface PackagerPackage {
  package: PackagerPackageIdentifier;
  data: PackagerPackageItem[];
  dependencies?: { [id: number]: PackagerPackageIdentifier };
  strict?: boolean;
  errors?: PackagerError[];
}

export interface PackagerPackageItem {
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
  pckg: PackagerPackage,
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
  pckg: PackagerPackage;
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
  ): Promise<{ error: any, namespaceId: number }> {
    try {
      const q = await this.client.select({ value: { _eq: name }, }, {
        table: `strings`,
        returning: 'id: link_id'
      });
      return { error: false, namespaceId: q?.data?.[0]?.id };
    } catch(error) {
      debug('fetchPackageNamespaceId error');
      return { error, namespaceId: 0 };
    }
    return { error: true, namespaceId: 0 };
  }

  /**
   * Fetch package namespace.
   */
  async fetchDependenciedLinkId(
    pckg: PackagerPackage,
    dependedLink: PackagerPackageItem,
  ): Promise<number> {
    try {
      const packageName = pckg?.dependencies?.[dependedLink?.package?.dependencyId]?.name;
      const packageTableName = `strings`;
      const q = await this.client.select({
        value: dependedLink?.package?.containValue,
        link: { from: { [packageTableName]: { value: packageName } } },
      }, {
        table: `strings`,
        returning: 'id link { id: to_id }'
      });
      return q?.data?.[0]?.link?.id || 0;
    } catch(error) {
      debug('fetchDependenciedLinkId error');
      console.log(error);
    }
    return 0;
  }

  async insertItem(
    items: PackagerPackageItem[],
    item: PackagerPackageItem,
    errors: PackagerError[],
    mutated: PackagerMutated,
  ) {
    debug('insertItem', item);
    try {
      // insert link section
      if (item.type) {
        const insert = { id: +item.id, type_id: +item.type, from_id: +item.from || 0, to_id: +item.to || 0 };
        const linkInsert = await this.client.insert(insert, { name: 'IMPORT_PACKAGE_LINK' });
        if (linkInsert?.errors) {
          errors.push(linkInsert?.errors);
        }
      }
      debug('insertItem promise', item.id);
      await this.client.await(+item.id);
      debug('insertItem promise awaited', item.id);
      if (item.value && !item.package) {
        debug('insertItem value', item);
        let valueLink
        if (!item.type) {
          valueLink = items.find(i => i.id === item.id && !!i.type);
          debug('insertItem .value', item, valueLink);  
        } else {
          valueLink = item;
        }
        if (!valueLink) {
          errors.push(`Link ${JSON.stringify(item)} for value not founded.`);
        }
        else {
          debug('insertItem tables');
          const type = typeof(item?.value?.value);
          const valueInsert = await this.client.insert({ link_id: valueLink.id, ...item.value }, { table: `${type}s`, name: 'IMPORT_PACKAGE_VALUE' });
          debug('insertItem valueInsert', valueInsert);
          if (valueInsert?.errors) errors.push(valueInsert?.errors);
        }
      }
    } catch(error) {
      debug('insertItem error');
      console.log(error);
      errors.push(error);
    }
    return;
  }

  async insertItems(
    pckg: PackagerPackage,
    data: PackagerPackageItem[],
    counter: number,
    dependedLinks: PackagerPackageItem[],
    errors: PackagerError[] = [],
    mutated: { [index: number]: boolean } = {},
  ): Promise<any> {
    // console.log('insertItems', data);
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
    } catch(error) {
      debug('insertItems error');
      console.log(error);
      errors.push(error);
    }
    return;
  }

  async globalizeIds(pckg: PackagerPackage, ids: number[], links: PackagerPackageItem[]): Promise<{ global: PackagerPackageItem[], difference: { [id:number]:number; } }> {
    const difference = {};
    const global = links.map(l => ({ ...l }));
    let idsIndex = 0;
    for (let l = 0; l < links.length; l++) {
      const item = links[l];
      const oldId = item.id;
      let newId;
      if (item.package) {
        newId = await this.client.id(pckg.dependencies[item.package.dependencyId].name, item.package.containValue);
      } else if (item.type) {
        newId = ids[idsIndex++];
      }
      if (oldId && newId) difference[oldId] = newId;
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
      // console.log(item, global[l]);
    }
    return { global, difference };
  }

  /**
   * Import into system pckg.
   */
  async import(pckg: PackagerPackage): Promise<PackagerImportResult> {
    const errors = [];
    try {
      if (!pckg?.package?.name) throw new Error(`!pckg?.package?.name`);
      if (!pckg?.package?.version) throw new Error(`!pckg?.package?.version`);
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
      const ids = await this.client.reserve(counter + 7);
      const { global, difference } = await this.globalizeIds(pckg, ids, sorted);
      await this.insertItems(pckg, global, counter, dependedLinks, errors, mutated);
      if (errors.length) return { errors };
      return { ids, errors, namespaceId: difference[namespaceId], packageId: difference[packageId] };
    } catch(error) {
      debug('import error');
      errors.push(error);
    }
    return { ids: [], errors };
  }

  async selectLinks(options: PackagerExportOptions): Promise<MinilinksResult<PackagerLink>> {
    const Contain = await this.client.id('@deep-foundation/core', 'Contain');
    const Package = await this.client.id('@deep-foundation/core', 'PackagerPackage');
    const PackageVersion = await this.client.id('@deep-foundation/core', 'PackageVersion');
    const result = await this.client.select({
      _or: [
        { id: { _eq: options.packageLinkId } },
        { type_id: { _eq: Contain }, from: { id: { _eq: options.packageLinkId } } },
        { in: { type_id: { _eq: Contain }, from: { id: { _eq: options.packageLinkId } } } },
        { type_id: { _eq: PackageVersion }, to: { id: { _eq: options.packageLinkId } } },
      ]
    }, {
      name: 'LOAD_PACKAGE_LINKS',
      returning: `
          id type_id from_id to_id value
          type {
            id value
            contains: in(where: { type_id: { _eq: ${Contain} }, from: { type_id: { _eq: ${Package} } } }) {
              id value
              package: from {
                id value
              }
            }
          }
          from {
            id
            contains: in(where: { type_id: { _eq: ${Contain} }, from: { type_id: { _eq: ${Package} } } }) {
              id value
              package: from {
                id value
              }
            }
          }
          to {
            id
            contains: in(where: { type_id: { _eq: ${Contain} }, from: { type_id: { _eq: ${Package} } } }) {
              id value
              package: from {
                id value
              }
            }
          }
        `
    })
    return minilinks((result)?.data);
  }

  /** Deserialize pckg data to links list with local numerical ids. */
  async deserialize(
    pckg: PackagerPackage,
    errors: PackagerError[] = [],
  ): Promise<{
    data: PackagerPackageItem[];
    errors?: PackagerError[];
    counter: number;
    dependedLinks: PackagerPackageItem[];
    packageId: number;
    namespaceId: number;
  }> {
    const Contain = await this.client.id('@deep-foundation/core', 'Contain');
    const Package = await this.client.id('@deep-foundation/core', 'PackagerPackage');
    const PackageNamespace = await this.client.id('@deep-foundation/core', 'PackageNamespace');
    const Active = await this.client.id('@deep-foundation/core', 'PackageActive');
    const Version = await this.client.id('@deep-foundation/core', 'PackageVersion');
    // clone for now hert pckg object
    const containsHash: { [key: string]: number } = {};
    let counter = 0;
    const dependedLinks = [];
    let packageId;
    const data: PackagerPackageItem[] = [];
    if (pckg.package.name !== corePackage) {
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
    data.push(...pckg.data.map(l => ({ ...l, value: l.value ? { ...l.value } : undefined })));
    // console.log(data);
    // string id field to numeric ids
    for (let l = 0; l < data.length; l++) {
      const item = data[l];
      const local = item.id;
      if (containsHash[local]) item.id = containsHash[local];
      else containsHash[local] = (item.id = ++counter);
      if (item.package) dependedLinks.push(item);
    }
    // console.log(data);
    // type, from, to fields to numeric ids
    console.log(data, containsHash);
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
    // console.log(data);
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
      const contain = containsArray[c];
      // each contain to package value
      if (containsHash[contain] != containsHash[packageId]) {
        data.push({
          id: ++counter,
          type: Contain,
          from: containsHash[packageId],
          to: containsHash[contain],
          value: { value: contain },
          // @ts-ignore
          _: true,
        });
      }
    }
    const n = await this.fetchPackageNamespaceId(pckg.package.name);
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
      if (this.client.linkId) data.push({
        id: ++counter,
        type: Contain,
        from: this.client.linkId,
        to: namespaceId,
        // @ts-ignore
        _: true,
      });
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

  async serialize(globalLinks: MinilinksResult<PackagerLink>, options: PackagerExportOptions, pckg: PackagerPackage) {
    const Contain = await this.client.id('@deep-foundation/core', 'Contain');
    let counter = 1;
    let dependenciesCounter = 1;
    const dependencies = {};
    const dependencedPackages = {};
    const handledDepLinks = {};
    const containsByTo = {};
    const links = [];
    for (let l = 0; l < globalLinks.links.length; l++) {
      const link = globalLinks.links[l];
      await debug('link1', link);
      if (
        !!link.type_id && !globalLinks.byId[link.type_id] && !(
        // NOT contain in ( package |- contain -> * )
          link?.type_id === Contain && link?.from?.id === options.packageLinkId
        ) && !(
          // NOT package
          link?.id === options.packageLinkId
        )
      ) {
        const name = link?.type?.contains?.[0]?.package?.value?.value;
        const foundedDep = dependencedPackages[name];
        await debug('dep', link, handledDepLinks, foundedDep, name);
        if (!!name && !foundedDep) {
          const depPack = { name: name };
          const index = dependenciesCounter++;
          dependencies[index] = depPack;
          dependencedPackages[name] = index;
        }
        if (!handledDepLinks[link.type_id]) {
          const containValue = link?.type?.contains?.[0]?.value?.value;
          if (!containValue) pckg.errors.push(`Link contain from package to ${link?.type?.id} does not have value.`);
          links.push({
            id: link.type_id,
            package: { dependencyId: dependencedPackages[name], containValue },
          });
          handledDepLinks[link.type_id] = true;
        }
      }
      if (!!link.from_id && !globalLinks.byId[link.from_id]) {
        await debug('from_id', link);
        const name = link?.from?.contains?.[0]?.package?.value?.value;
        const foundedDep = dependencedPackages[name];
        if (!!name && !foundedDep) {
          const depPack = { name: name };
          const index = dependenciesCounter++;
          dependencies[index] = depPack;
          dependencedPackages[name] = index;
        }
        if (!handledDepLinks[link.from_id]) {
          const containValue = link?.from?.contains?.[0]?.value?.value;
          if (!containValue) pckg.errors.push(`Link contain from package to ${link?.from?.id} does not have value.`);
          links.push({
            id: link.from_id,
            package: { dependencyId: dependencedPackages[name], containValue },
          });
          handledDepLinks[link.from_id] = true;
        }
      }
      if (!!link.to_id && !globalLinks.byId[link.to_id]) {
        await debug('from_id', link);
        const name = link?.to?.contains?.[0]?.package?.value?.value;
        const foundedDep = dependencedPackages[name];
        if (!!name && !foundedDep) {
          const depPack = { name: name };
          const index = dependenciesCounter++;
          dependencies[index] = depPack;
          dependencedPackages[name] = index;
        }
        if (!handledDepLinks[link.to_id]) {
          const containValue = link?.to?.contains?.[0]?.value?.value;
          if (!containValue) pckg.errors.push(`Link contain from package to ${link?.to?.id} does not have value.`);
          links.push({
            id: link.to_id,
            package: { dependencyId: dependencedPackages[name], containValue },
          });
          handledDepLinks[link.to_id] = true;
        }
      }
      await debug('link2', link);
    }
    pckg.dependencies = dependencies;
    for (let l = 0; l < globalLinks.links.length; l++) {
      const link = globalLinks.links[l];
      if (link.type_id === Contain) {
        containsByTo[+link.to_id] = link;
      } else if (link.id !== options.packageLinkId) {
        links.push(link);
      }
    }
    for (let l = 0; l < links.length; l++) {
      const link = links[l];
      if (link.id === options.packageLinkId) continue;
      link._id = link.id;
      if (!link.package) {
        link.id = containsByTo[+link.id]?.value?.value ? containsByTo[+link.id].value.value : counter++;
        for (let li = 0; li < link?.out?.length; li++) {
          const _link = link.out[li];
          _link.from_id = link.id;
        }
        for (let li = 0; li < link?.in?.length; li++) {
          const _link = link.in[li];
          _link.to_id = link.id;
        }
        for (let li = 0; li < link?.typed?.length; li++) {
          const _link = link.typed[li];
          _link.type_id = link.id;
        }
        let value;
        if (link?.value) {
          const { id: __id, link_id: __link_id, ..._value } = link.value;
          value = _value;
        }
        const newLink: PackagerPackageItem = {
          id: link.id,
          type: link.type_id,
        };
        if (link.from) newLink.from = link.from.id;
        if (link.to) newLink.to = link.to.id;
        if (link.package) newLink.package = link.package;
        if (value) newLink.value = value;
        pckg.data.push(newLink);
      } else {
        const newLink: PackagerPackageItem = {
          id: counter++,
          package: link.package,
        };
        for (let li = 0; li < links?.length; li++) {
          const _link = links[li];
          if (_link?.from_id === link?.id) _link.from_id = newLink?.id;
          if (_link?.to_id === link?.id) _link.to_id = newLink?.id;
          if (_link?.type_id === link?.id && !_link._) _link.type_id = newLink?.id;
        }
        pckg.data.push(newLink);
      }
    }
  }

  /**
   * Export from system pckg by package link id.
   */
  async export(options: PackagerExportOptions): Promise<PackagerPackage> {
    const globalLinks = await this.selectLinks(options);
    const Package = await this.client.id('@deep-foundation/core', 'PackagerPackage');
    const PackageVersion = await this.client.id('@deep-foundation/core', 'PackageVersion');
    const version: any = globalLinks.types[PackageVersion]?.[0] || '0.0.0';
    const pack: any = globalLinks.types[Package]?.[0];
    const pckg = {
      package: { name: pack?.value?.value, version: version?.value?.value },
      data: [],
      errors: [],
    };

    if (!pack) pckg.errors.push('!package');
    if (!version) pckg.errors.push('!version');
    if (pckg?.errors?.length) return pckg;

    const ml = minilinks(globalLinks.links.filter(l => l.id !== version?.id));
    const { sorted } = sort(pckg, ml.links, pckg.errors, {
      id: 'id',
      from: 'from_id',
      to: 'to_id',
      type: 'type_id',
    });
    ml.links = sorted;
    // console.log('pckg1', JSON.stringify(pckg));
    await this.serialize(ml, options, pckg);
    // console.log('pckg2', JSON.stringify(pckg));
    return pckg;
  }
}