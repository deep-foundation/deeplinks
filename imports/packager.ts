import { ApolloClient } from '@apollo/client';
import { generateQuery, generateQueryData } from './gql/query';
import { TABLE_NAME as LINKS_TABLE_NAME } from '../migrations/1616701513782-links';

export interface IPackagerExportOptions {}

export class Packager {
  client: ApolloClient<any>;
  constructor(client: ApolloClient<any>) {
    this.client = client;
  }
  async exportPackage(options: IPackagerExportOptions) {
    this.client.query(generateQuery({
      queries: [
        generateQueryData({ tableName: LINKS_TABLE_NAME, variables: { where: {
          
        } } }),
      ],
      name: 'LOAD_PACKAGE_LINKS',
    }));
  }
}