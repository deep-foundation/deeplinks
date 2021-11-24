import { ApolloClient } from '@apollo/client';
import { link } from 'fs';
import Debug from 'debug';
import { DENIED_IDS, GLOBAL_ID_CONTAIN, GLOBAL_ID_PACKAGE, GLOBAL_ID_PACKAGE_VERSION, GLOBAL_ID_TABLE, GLOBAL_ID_TABLE_VALUE, GLOBAL_NAME_CONTAIN, GLOBAL_NAME_PACKAGE, GLOBAL_NAME_TABLE, GLOBAL_NAME_TABLE_VALUE } from './global-ids';
import { deleteMutation, generateMutation, generateSerial, insertMutation, updateMutation } from './gql';
import { generateQuery, generateQueryData } from './gql/query';
import { LinksResult, Link, LinkPlain, minilinks } from './minilinks';
import { awaitPromise } from './promise';
import { reserve } from './reserve';

const debug = Debug('deeplinks:packager');

export interface PackagerPackageIdentifier {
  name: string;
  version: string;
  uri: string;
  type: string;
  options?: any;
  // typeId?: number; TODO
}

export interface PackagerPackage {
  package: PackagerPackageIdentifier;
  data: PackagerPackageItem[];
  dependencies?: PackagerPackageIdentifier[];
  strict?: boolean;
  errors?: PackagerError[];
}

export interface PackagerPackageItem {
  id: number | string;
  type?: number | string;
  from?: number | string;
  to?: number | string;
  value?: PackagerValue;
  package?: number;
}

export interface PackagerValue {
  [key: string]: any;
}

export type PackagerError = any;

export interface PackagerImportResult {
  errors?: PackagerError[];
}

export type PackagerMutated = { [index: number]: boolean };

export interface PackagerExportOptions {
  packageLinkId: number;
}

export interface PackagerLink extends Link<any> {
  value?: any;
}

/** Deserialize pckg data to links list with local numerical ids. */
export function deserialize(
  pckg: PackagerPackage,
  errors: PackagerError[] = [],
): {
  data: PackagerPackageItem[];
  errors?: PackagerError[];
  counter: number;
 } {
  // clone for now hert pckg object
  const data: PackagerPackageItem[] = pckg.data.map(l => ({ ...l, value: l.value ? { ...l.value } : undefined }));
  const containsHash: { [key: string]: number } = {};
  let counter = 0;
  // string id field to numeric ids
  for (let l = 0; l < data.length; l++) {
    const item = data[l];
    const local = item.id;
    if (containsHash[local]) item.id = containsHash[local];
    else containsHash[local] = item.id = ++counter;
    // @ts-ignore
    item._ = local;
  }
  // type, from, to fields to numeric ids
  for (let l = 0; l < data.length; l++) {
    const item = data[l];
    if (item.type) item.type = containsHash[item.type];
    if (item.from) item.from = containsHash[item.from] || 0;
    if (item.to) item.to = containsHash[item.to] || 0;
  }
  data.push({
    id: ++counter,
    type: GLOBAL_ID_PACKAGE,
    value: { value: pckg.package.name },
    // @ts-ignore
    _: true,
  });
  data.push({
    id: ++counter,
    type: GLOBAL_ID_PACKAGE_VERSION,
    value: { value: pckg.package.version },
    // @ts-ignore
    _: true,
  });
  // create contains links
  const containsArray = Object.keys(containsHash);
  for (let c = 0; c < containsArray.length; c++) {
    const contain = containsArray[c];
    data.push({
      id: ++counter,
      type: containsHash?.['Contain'],
      from: containsHash?.['package'],
      to: containsHash[contain],
      value: { value: contain },
    });
  }
  return { data, errors, counter };
}

/** Generate inserting order for links and values. */
export function sort(
  pckg: PackagerPackage,
  data: PackagerPackageItem[],
  errors: PackagerError[] = [],
) {
  let sorted = [];
  if (pckg.strict) {
    sorted = data;
  } else {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item?.type) {
        const first = sorted.findIndex((l, index) => l.from == item.id || l.to == item.id || l.type == item.id);
        const max = sorted.reduce((p, l, index) => l.id == item.type || l.id == item.from || l.id === item.to ? index : p, 0);
        sorted.splice((!!~first && first < max ? first : max) + 1, 0, item);
      } else {
        const max = sorted.reduce((p, l, index) => l.id == item.id ? index : p, 0);
        sorted.splice((max) + 1, 0, item);
      }
    }
  }
  return { sorted };
}

export class Packager {
  pckg: PackagerPackage;
  client: ApolloClient<any>;
  constructor(client: ApolloClient<any>) {
    this.client = client;
    // @ts-ignore
    global.packager = this;
  }

  /**
   * Fetch tables names by type names.
   */
  async fetchTableNamesValuedToTypeId(
    types: number[],
    errors: PackagerError[],
  ): Promise<{ [type: string]: string }> {
    const result = {};
    try {
      const q = await this.client.query(generateQuery({
        queries: [
          generateQueryData({ tableName: 'links', returning: `id values: out(where: { type_id: { _eq: ${GLOBAL_ID_TABLE_VALUE} } }) { id: to_id }`, variables: { where: {
            type_id: { _eq: GLOBAL_ID_TABLE },
            out: { type_id: { _eq: GLOBAL_ID_TABLE_VALUE }, to_id: { _in: types } },
          } } }),
        ],
        name: 'LOAD_TYPES_TABLES_HASH',
      }));
      const tables = (q)?.data?.q0;
      for (let t = 0; t < tables.length; t++) {
        const table = tables[t];
        for (let i = 0; i < table.values.length; i++) {
          const type = table.values[i].id;
          if (types.includes(type)) result[type] = table.id;
        }
      }
    } catch(error) {
      debug('fetchTableNamesValuedToTypeId error', error);
      errors.push(error);
    }
    return result;
  }

  async insertItem(
    id: number,
    items: PackagerPackageItem[],
    item: PackagerPackageItem,
    errors: PackagerError[],
    mutated: PackagerMutated,
  ) {
    debug('insertItem', { id }, item);
    try {
      if (item.type) {
        const linkInsert = await this.client.mutate(generateSerial({
          actions: [insertMutation('links', { objects: { id, type_id: item.type, from_id: item.from || 0, to_id: item.to || 0 } })],
          name: 'IMPORT_PACKAGE_LINK',
        }));
        if (linkInsert?.errors) {
          errors.push(linkInsert?.errors);
        }
        mutated[item.id] = true;
        item.id = id;
        items.filter(i => (
          i.id === item.id && (
            // @ts-ignore
            !i._
        ))).forEach(l => l.id = id);
        items.filter(i => (
          i.from === item.id && (
            // @ts-ignore
            !i._
        ))).forEach(l => l.from = id);
        items.filter(i => (
          i.to === item.id && (
            // @ts-ignore
            !i._
        ))).forEach(l => l.to = id);
        items.filter(i => (
          i.type === item.id && (
            // @ts-ignore
            !i._
        ))).forEach(l => l.type = id);
      }
      debug('insertItem promise', id);
      await awaitPromise({ id, client: this.client });
      debug('insertItem promise awaited', id);
      if (item.value) {
        debug('insertItem value', id, item);
        let valueLink
        if (!item.type) {
          valueLink = items.find(i => i.id === item.id && !!i.type);
          debug('insertItem .value', item, valueLink);
        } else {
          valueLink = item;
        }
        if (!valueLink) {
          errors.push(`Link ${item.id} for value not founded.`);
        }
        else {
          const tables = await this.fetchTableNamesValuedToTypeId([+valueLink.type], errors);
          debug('insertItem tables', tables);
          if (!tables[valueLink.type]) errors.push(`Table for type ${valueLink.type} for link ${valueLink.id} not founded for insert ${JSON.stringify(item)}.`);
          const valueInsert = await this.client.mutate(generateSerial({
            actions: [insertMutation(`table${tables[valueLink.type]}`, { objects: { link_id: valueLink.id, ...item.value } })],
            name: 'IMPORT_PACKAGE_VALUE',
          }));
          debug('insertItem valueInsert', valueInsert);
          if (valueInsert?.errors) errors.push(valueInsert?.errors);
        }
      }
    } catch(error) {
      debug('insertItem error', error);
      errors.push(error);
    }
    return;
  }

  async insertItems(
    pckg: PackagerPackage,
    data: PackagerPackageItem[],
    counter: number,
    errors: PackagerError[] = [],
    mutated: { [index: number]: boolean } = {},
  ) {
    try {
      const ids = await reserve({
        client: this.client,
        count: counter,
      });
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const id = ids[+(item.id) - 1];
        if (!id) console.log(`Cant find id for`, item, data.filter(i => i.id === item.id));
        await this.insertItem(id, data, item, errors, mutated);
        if (errors.length) return;
      }
    } catch(error) {
      debug('insertItems error', error);
      errors.push(error);
    }
  }

  async importNamespace() {
    // const result = await this.client.query(generateQuery({
    //   queries: [
    //     generateQueryData({ tableName: 'links', returning: `
    //       id type_id from_id to_id value
    //       type {
    //         id value
    //         contains: in(where: { type_id: { _eq: ${GLOBAL_ID_CONTAIN} }, from: { type_id: { _eq: ${GLOBAL_ID_PACKAGE} } } }) {
    //           id
    //           package: from {
    //             id value
    //           }
    //         }
    //       }
    //       from {
    //         id
    //         contains: in(where: { type_id: { _eq: ${GLOBAL_ID_CONTAIN} }, from: { type_id: { _eq: ${GLOBAL_ID_PACKAGE} } } }) {
    //           id
    //           package: from {
    //             id value
    //           }
    //         }
    //       }
    //       to {
    //         id
    //         contains: in(where: { type_id: { _eq: ${GLOBAL_ID_CONTAIN} }, from: { type_id: { _eq: ${GLOBAL_ID_PACKAGE} } } }) {
    //           id
    //           package: from {
    //             id value
    //           }
    //         }
    //       }
    //     `, variables: { where: {
    //       _or: [
    //         { id: { _eq: options.packageLinkId } },
    //         { type_id: { _eq: GLOBAL_ID_CONTAIN }, from: { id: { _eq: options.packageLinkId } } },
    //         { in: { type_id: { _eq: GLOBAL_ID_CONTAIN }, from: { id: { _eq: options.packageLinkId } } } },
    //       ]
    //     } } }),
    //   ],
    //   name: 'LOAD_PACKAGE_LINKS',
    // }));
  }
  
  /**
   * Import into system pckg.
   */
  async import(pckg: PackagerPackage): Promise<PackagerImportResult> {
    const errors = [];
    try {
      const { data, counter } = deserialize(pckg, errors);
      if (errors.length) return { errors };
      const { sorted } = sort(pckg, data, errors);
      if (errors.length) return { errors };
      await this.insertItems(pckg, sorted, counter, errors);
      if (errors.length) return { errors };
      await this.importNamespace();
    } catch(error) {
      debug('insertItems error', error);
      errors.push(error);
    }
    return { errors };
  }

  async selectLinks(options: PackagerExportOptions): Promise<LinksResult<PackagerLink>> {
    const result = await this.client.query(generateQuery({
      queries: [
        generateQueryData({ tableName: 'links', returning: `
          id type_id from_id to_id value
          type {
            id value
            contains: in(where: { type_id: { _eq: ${GLOBAL_ID_CONTAIN} }, from: { type_id: { _eq: ${GLOBAL_ID_PACKAGE} } } }) {
              id
              package: from {
                id value
              }
            }
          }
          from {
            id
            contains: in(where: { type_id: { _eq: ${GLOBAL_ID_CONTAIN} }, from: { type_id: { _eq: ${GLOBAL_ID_PACKAGE} } } }) {
              id
              package: from {
                id value
              }
            }
          }
          to {
            id
            contains: in(where: { type_id: { _eq: ${GLOBAL_ID_CONTAIN} }, from: { type_id: { _eq: ${GLOBAL_ID_PACKAGE} } } }) {
              id
              package: from {
                id value
              }
            }
          }
        `, variables: { where: {
          _or: [
            { id: { _eq: options.packageLinkId } },
            { type_id: { _eq: GLOBAL_ID_CONTAIN }, from: { id: { _eq: options.packageLinkId } } },
            { in: { type_id: { _eq: GLOBAL_ID_CONTAIN }, from: { id: { _eq: options.packageLinkId } } } },
          ]
        } } }),
      ],
      name: 'LOAD_PACKAGE_LINKS',
    }));
    return minilinks((result)?.data?.q0);
  }

  async serialize(globalLinks: LinksResult<PackagerLink>, options: PackagerExportOptions, pckg: PackagerPackage) {
    let counter = 1;
    // const dependencies = {};
    // const dependencedPackages = {};
    // for (let l = 0; l < globalLinks.links.length; l++) {
    //   const link = globalLinks.links[l];
    //   if (!!link.type_id && !globalLinks.byId[link.type_id]) {
    //     if (!dependencedPackages[link?.type?.contains?.[0]?.package?.id]) {
    //       dependencedPackages[link?.type?.contains?.[0]?.package?.id] = await this.export({ packageLinkId: +link?.type?.contains?.[0]?.package?.id });
    //     }
    //     const dep = { id: dependencedPackages[link?.type?.contains?.[0]?.package?.id]?.links?.find(l => l?._id === link.type_id)?.id, package: link?.type?.contains?.[0]?.package?.value?.value };
    //     link.type_id = counter++;
    //     dependencies[link.type_id] = dep;
    //   }
    //   if (!!link.from_id && !globalLinks.byId[link.from_id]) {
    //     if (!dependencedPackages[link?.from?.contains?.[0]?.package?.id]) {
    //       dependencedPackages[link?.from?.contains?.[0]?.package?.id] = await this.export({ packageLinkId: +link?.from?.contains?.[0]?.package?.id });
    //     }
    //     const dep = { id: dependencedPackages[link?.from?.contains?.[0]?.package?.id]?.links?.find(l => l?._id === link.from_id)?.id, package: link?.from?.contains?.[0]?.package?.value?.value };
    //     link.from_id = counter++;
    //     dependencies[link.from_id] = dep;
    //   }
    //   if (!!link.to_id && !globalLinks.byId[link.to_id]) {
    //     if (!dependencedPackages[link?.to?.contains?.[0]?.package?.id]) {
    //       dependencedPackages[link?.to?.contains?.[0]?.package?.id] = await this.export({ packageLinkId: +link?.to?.contains?.[0]?.package?.id });
    //     }
    //     const dep = { id: dependencedPackages[link?.to?.contains?.[0]?.package?.id]?.links?.find(l => l?._id === link.to_id)?.id, package: link?.to?.contains?.[0]?.package?.value?.value };
    //     link.to_id = counter++;
    //     dependencies[link.to_id] = dep;
    //   }
    // }
    const containsByTo = {};
    const links = [];
    for (let l = 0; l < globalLinks.links.length; l++) {
      const link = globalLinks.links[l];
      if (link.type_id === GLOBAL_ID_CONTAIN) {
        containsByTo[+link.to_id] = link;
      } else links.push(link);
    }
    for (let l = 0; l < links.length; l++) {
      const link = links[l];
      link._id = link.id;
      link.id = containsByTo[+link.id]?.value?.value ? containsByTo[+link.id].value.value : counter++;
      for (let li = 0; li < link.out.length; li++) {
        const _link = link.out[li];
        _link.from_id = link.id;
      }
      for (let li = 0; li < link.in.length; li++) {
        const _link = link.in[li];
        _link.to_id = link.id;
      }
      for (let li = 0; li < link.typed.length; li++) {
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
      if (value) newLink.value = value;
      pckg.data.push(newLink);
    }
  }

  /**
   * Export from system pckg by package link id.
   */
  async export(options: PackagerExportOptions): Promise<PackagerPackage> {
    const globalLinks = await this.selectLinks(options);
    const packageLink = globalLinks.links?.find(l => l?.type?.value?.value === GLOBAL_NAME_PACKAGE);
    const packageName = packageLink?.value?.value;
    const pckg = {
      package: packageName,
      data: [],
      strict: false,
      errors: [],
    };
    await this.serialize(globalLinks, options, pckg);
    return pckg;
  }
}