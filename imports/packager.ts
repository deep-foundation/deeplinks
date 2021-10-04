import { ApolloClient } from '@apollo/client';
import { generateQuery, generateQueryData } from '@deepcase/deeplinks/imports/gql/query';
import { LinksResult, Link, minilinks } from './minilinks';

export interface IPackagerExportOptions {
  packageLinkId: number;
}

export interface IPackagerCursor {
  packageName: string;
  linkName: string;
}

export interface IPackagerLink extends Link<any> {
  string: {
    id: number;
    value: string;
  };
}

export interface IPackagerError {
  message: string;
}

export interface IPackagerPackage {
  packageName: string;
  version: string;
  links: {
    id?: IPackagerCursor;
    from_id?: IPackagerCursor;
    to_id?: IPackagerCursor;
    type_id?: IPackagerCursor;
  }[];
  errors: IPackagerError[];
}

export class Packager {
  client: ApolloClient<any>;
  constructor(client: ApolloClient<any>) {
    this.client = client;
  }
  async loadPackageLinks(options: IPackagerExportOptions): Promise<LinksResult<IPackagerLink>> {
    return minilinks((await this.client.query(generateQuery({
      queries: [
        generateQueryData({ tableName: 'links', returning: 'id type_id from_id to_id string { id value }', variables: { where: {
          _or: [
            { id: { _eq: options.packageLinkId } },
            { type_id: { _eq: 13 }, from: { id: { _eq: options.packageLinkId } } },
            { type_id: { _eq: 1 }, in: { type_id: { _eq: 13 }, from: { id: { _eq: options.packageLinkId } } } },
          ],
        } } }),
      ],
      name: 'LOAD_PACKAGE_LINKS',
    })))?.data?.q0);
  }
  parseGlobalLinks(globalLinks: LinksResult<IPackagerLink>, options: IPackagerExportOptions, pckg: IPackagerPackage) {
    let counter = 1;
    for (let l = 0; l < globalLinks.links.length; l++) {
      const link = globalLinks.links[l];
      if (link.type_id === 1) {
        if (!link?.string?.value) pckg.errors.push({ message: `Link ${link.id} is broken, link.string.value does not exists.` });
        else {
          link.id = link.string.value;
        }
      } else {
        link.id = counter++;
      }
      for (let lo = 0; lo < link.out.length; lo++) {
        const linkOut = link.out[lo];
        linkOut.from_id = link.string.value;
      }
      for (let li = 0; li < link.in.length; li++) {
        const linkIn = link.in[li];
        linkIn.to_id = link.string.value;
      }
      pckg.links.push({
        id: link.id,
        type_id: link.type_id || '',
        from_id: link.from_id || '',
        to_id: link.to_id || '',
      });
    }
  }
  async exportPackage(options: IPackagerExportOptions) {
    const globalLinks = await this.loadPackageLinks(options);
    const pckgLink = globalLinks.types?.[31]?.[0];
    const packageName = pckgLink?.string?.value;
    const pckg = {
      packageName,
      version: '',
      links: [],
      errors: [],
    };
    if (typeof(packageName) !== 'string') {
      pckg.errors.push({ message: 'Package is broken, name not founded in pckgLink.string.value.' });
    }
    this.parseGlobalLinks(globalLinks, options, pckg);
    return pckg;
  }
}
