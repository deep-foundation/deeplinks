import gql from 'graphql-tag';
import Gists from 'gists';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { Packager } from '../packager';
import { ApolloServer } from 'apollo-server-express';
import { DeepClient } from '../client';
import fs from 'fs';
import os from 'os';
import { v4 as uuid } from 'uuid';
import child_process from 'child_process';

const tmpdir = os.tmpdir();

const gists = new Gists({
  username: 'ivansglazunov', 
  password: process?.env?.PASSWORD,
});

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const packager = new Packager(new DeepClient({ apolloClient: client }));

const typeDefs = gql`
  type Query {
    packagerInstall(input: PackagerInstallInput): PackagerInstallOutput
    packagerPublish(input: PackagerPublishInput): PackagerPublishOutput
  }
  input PackagerInstallInput {
    name: String
    version: String
    address: String
    type: String
  }
  type PackagerInstallOutput {
    ids: [Int]
    errors: [String]
  }
  input PackagerPublishInput {
    id: Int
    address: String
    type: String
  }
  type PackagerPublishOutput {
    errors: [String]
  }
`;

const resolvers = {
  Query: {
    packagerInstall: async (source, args, context, info) => {
      const { name, version, address, type } = args.input;
      const errors = [];
      if (type === 'gist') {
        const result = await gists.get(address);
        const files = result?.body?.files;
        const deepPckgContent = files?.['deep.json']?.content;
        if (deepPckgContent) {
          try {
            const deepPckg = JSON.parse(deepPckgContent);
            const { ids, errors } = await packager.import(deepPckg);
            return { ids, errors };
          } catch(error) {
            errors.push(error);
          }
        } else {
          errors.push(`deep.json not founded in gist`);
        }
      } else if (type === 'npm') {
        const dirid = uuid();
        const dir = [tmpdir,dirid].join('/');
        fs.mkdirSync(dir);
        child_process.execSync(`cd ${dir}; npm install ${address};`,{stdio:[0,1,2]});
        const deepPckgContent = fs.readFileSync([dir,'node_modules',address,'deep.json'].join('/'), { encoding: 'utf-8' });
        if (deepPckgContent) {
          try {
            const deepPckg = JSON.parse(deepPckgContent);
            const { ids, errors } = await packager.import(deepPckg);
          } catch(error) {
            errors.push(error);
          }
        } else {
          errors.push(`deep.json not founded in gist`);
        }
        fs.rmdirSync(dir);
      } else {
        errors.push(`type ${type} is not valid`);
      }
      return { ids: [], errors };
    },
    packagerPublish: async (source, args, context, info) => {
      const { id, address, type } = args.input;
      if (type === 'gist') {

      }
      const errors = [];
      return { errors };
    },
  }
};

const context = ({ req }) => {
  return { headers: req.headers };
};

const apolloServer = new ApolloServer({ introspection: true, typeDefs, resolvers, context });

export default apolloServer;
