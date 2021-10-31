import { ApolloClient } from '@apollo/client';
import { link } from 'fs';
import { deleteMutation, generateMutation, generateSerial, insertMutation, updateMutation } from './gql';
import { generateQuery, generateQueryData } from './gql/query';
import { LinksResult, Link, minilinks } from './minilinks';

export interface IPackagerExportOptions {
  packageLinkId: number;
}

export interface IPackagerSelector {
  package: string;
  id: number;
  any?: any;
}

export interface IPackagerLink {
  id: number;
  _id?: number;

  from_id: number;
  to_id: number;
  type_id: number;

  value: any;
}
export interface IPackagerLinkLinked extends Link<any> {
  value: any;
}
export interface IPackagerError {
  message: string;
}

export interface IPackagerPackage {
  package?: string;
  links: IPackagerLink[];
  dependencies?: { [localId:number]: IPackagerSelector };
  strict?: boolean;
  errors?: IPackagerError[];
}

const delay = (time) => new Promise(r => setTimeout(() => r(true), time));
export class Packager {
  client: ApolloClient<any>;
  constructor(client: ApolloClient<any>) {
    this.client = client;
    // @ts-ignore
    global.packager = this;
  }
  async loadPackageLinks(options: IPackagerExportOptions): Promise<LinksResult<IPackagerLinkLinked>> {
    const result = await this.client.query(generateQuery({
      queries: [
        generateQueryData({ tableName: 'links', returning: `
          id type_id from_id to_id value
          type {
            id value
            contains: in(where: { type_id: { _eq: 13 }, from: { type_id: { _eq: 32 } } }) {
              id
              package: from {
                id value
              }
            }
          }
          from {
            id
            contains: in(where: { type_id: { _eq: 13 }, from: { type_id: { _eq: 32 } } }) {
              id
              package: from {
                id value
              }
            }
          }
          to {
            id
            contains: in(where: { type_id: { _eq: 13 }, from: { type_id: { _eq: 32 } } }) {
              id
              package: from {
                id value
              }
            }
          }
        `, variables: { where: {
          _or: [
            { id: { _eq: options.packageLinkId } },
            { type_id: { _eq: 13 }, from: { id: { _eq: options.packageLinkId } } },
            { in: { type_id: { _eq: 13 }, from: { id: { _eq: options.packageLinkId } } } },
          ]
        } } }),
      ],
      name: 'LOAD_PACKAGE_LINKS',
    }));
    return minilinks((result)?.data?.q0);
  }
  async loadTypesTablesHash(types: number[]): Promise<{ [type: string]: string }> {
    const q = await this.client.query(generateQuery({
      queries: [
        generateQueryData({ tableName: 'links', returning: 'id values: out(where: { type_id: { _eq: 31 } }) { id: to_id }', variables: { where: {
          type_id: { _eq: 29 },
          out: { type_id: { _eq: 31 }, to_id: { _in: types } },
        } } }),
      ],
      name: 'LOAD_TYPES_TABLES_HASH',
    }));
    const tables = (q)?.data?.q0;
    const result = {};
    for (let t = 0; t < tables.length; t++) {
      const table = tables[t];
      for (let i = 0; i < table.values.length; i++) {
        const type = table.values[i].id;
        if (types.includes(type)) result[type] = table.id;
      }
    }
    return result;
  }
  async parseGlobalLinks(globalLinks: LinksResult<IPackagerLinkLinked>, options: IPackagerExportOptions, pckg: IPackagerPackage) {
    let counter = 1;
    const dependencies = {};
    const dependencedPackages = {};
    for (let l = 0; l < globalLinks.links.length; l++) {
      const link = globalLinks.links[l];
      if (!!link.type_id && !globalLinks.byId[link.type_id]) {
        if (!dependencedPackages[link?.type?.contains?.[0]?.package?.id]) {
          dependencedPackages[link?.type?.contains?.[0]?.package?.id] = await this.exportPackage({ packageLinkId: +link?.type?.contains?.[0]?.package?.id });
        }
        const dep = { id: dependencedPackages[link?.type?.contains?.[0]?.package?.id]?.links?.find(l => l?._id === link.type_id)?.id, package: link?.type?.contains?.[0]?.package?.value?.value };
        link.type_id = counter++;
        dependencies[link.type_id] = dep;
      }
      if (!!link.from_id && !globalLinks.byId[link.from_id]) {
        if (!dependencedPackages[link?.from?.contains?.[0]?.package?.id]) {
          dependencedPackages[link?.from?.contains?.[0]?.package?.id] = await this.exportPackage({ packageLinkId: +link?.from?.contains?.[0]?.package?.id });
        }
        const dep = { id: dependencedPackages[link?.from?.contains?.[0]?.package?.id]?.links?.find(l => l?._id === link.from_id)?.id, package: link?.from?.contains?.[0]?.package?.value?.value };
        link.from_id = counter++;
        dependencies[link.from_id] = dep;
      }
      if (!!link.to_id && !globalLinks.byId[link.to_id]) {
        if (!dependencedPackages[link?.to?.contains?.[0]?.package?.id]) {
          dependencedPackages[link?.to?.contains?.[0]?.package?.id] = await this.exportPackage({ packageLinkId: +link?.to?.contains?.[0]?.package?.id });
        }
        const dep = { id: dependencedPackages[link?.to?.contains?.[0]?.package?.id]?.links?.find(l => l?._id === link.to_id)?.id, package: link?.to?.contains?.[0]?.package?.value?.value };
        link.to_id = counter++;
        dependencies[link.to_id] = dep;
      }
    }
    for (let l = 0; l < globalLinks.links.length; l++) {
      const link = globalLinks.links[l];
      link._id = link.id;
      link.id = counter++;
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
      const { id: __id, link_id: __link_id, ...value } = link.value;
      const newLink: IPackagerLink = {
        id: link.id,
        _id: link._id,
        type_id: link.type_id,
        from_id: link.from_id,
        to_id: link.to_id,
        value,
      };
      pckg.links.push(newLink);
    }
    pckg.dependencies = dependencies;
  }
  async exportPackage(options: IPackagerExportOptions) {
    const globalLinks = await this.loadPackageLinks(options);
    const pckgLink = globalLinks.types?.[32]?.[0];
    const packageName = pckgLink?.value?.value;
    const pckg = {
      package: packageName,
      links: [],
      errors: [],
    };
    await this.parseGlobalLinks(globalLinks, options, pckg);
    return pckg;
  }
  async importPackage(pckg: IPackagerPackage) {
    const links = minilinks(pckg.links);
    let sorted = [];
    if (pckg.strict) {
      sorted.push(...links.links);
    } else { 
      for (let i = 0; i < links.links.length; i++) {
        const link = links.links[i];
        const first = sorted.findIndex((l, index) => l.from_id == link.id || l.to_id == link.id || l.type_id == link.id);
        const max = sorted.reduce((p, l, index) => l.id == link.type_id || l.id == link.from_id || l.id === link.to_id ? index : p, 0);
        sorted.splice((!!~first && first < max ? first : max) + 1, 0, link);
      }
    }
    const errors = [];
    const ids = [];
    for (let i = 0; i < sorted.length; i++) {
      const link = sorted[i];
      const objects = { type_id: link.type_id, from_id: link.from_id, to_id: link.to_id };
      const mutateResult = await this.client.mutate(generateSerial({
        actions: [insertMutation('links', { objects })],
        name: 'IMPORT_PACKAGE_LINKS',
      }));
      if (mutateResult?.errors) {
        errors.push(mutateResult?.errors);
        break;
      } else {
        ids.push(mutateResult?.data?.m0?.returning?.[0]?.id);
        link.id = mutateResult?.data?.m0?.returning?.[0]?.id;
        link._mutated = true;
        for (let li = 0; li < link.out.length; li++) {
          link.out[li].from_id = link.id;
        }
        for (let li = 0; li < link.in.length; li++) {
          link.in[li].to_id = link.id;
        }
        for (let li = 0; li < link.typed.length; li++) {
          link.typed[li].type_id = link.id;
        }
      }
    }
    await delay(3000);
    if (!errors.length) {
      const tables = await this.loadTypesTablesHash(sorted.filter(l => l.type_id === 1).map(l => l.id));
      const actions = sorted.filter(l => l._mutated && !!tables[l.type_id]).map(l => insertMutation(`table${tables[l.type_id]}`, { objects: { link_id: l.id, ...l.value } }));
      if (actions?.length) {
        const insertValuesResult = await this.client.mutate(generateSerial({
          actions,
          name: 'IMPORT_PACKAGE_LINKS',
        }));
        if (insertValuesResult?.errors) {
          errors.push(insertValuesResult?.errors);
        }
      }
    }
    if (errors.length) {
      const mutateResult = await this.client.mutate(generateSerial({
        actions: [deleteMutation('links', { where: { id: { _in: ids } } })],
        name: 'REVERT_IMPORT_PACKAGE_LINKS',
      }));
    }
  }
}
