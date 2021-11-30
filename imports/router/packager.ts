import gql from 'graphql-tag';
import Gists from 'gists';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { Packager } from '../packager';
import { ApolloServer } from 'apollo-server-express';

const gists = new Gists({
  username: 'ivansglazunov', 
  password: 'Isg7499Github',
});

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const packager = new Packager(client);

const typeDefs = gql`
  type Query {
    packagerInstall(input: PackagerInstallInput): PackagerInstallOutput
    packagerPublish(input: PackagerPublishInput): PackagerPublishOutput
  }
  input PackagerInstallInput {
    name: String
    version: String
    uri: String
    type: String
  }
  type PackagerInstallOutput {
    ids: [Int]
    errors: [String]
  }
  input PackagerPublishInput {
    id: Int
    uri: String
    type: String
  }
  type PackagerPublishOutput {
    errors: [String]
  }
`;

const resolvers = {
  Query: {
    packagerInstall: async (source, args, context, info) => {
      const { name, version, uri, type } = args.input;
      const errors = [];
      if (type === 'gist') {
        const result = await gists.get('4cf14e3e58f4e96f7e7914b963ecdd29');
        const files = result?.body?.files;
        const deepPckgContent = files?.['deep.pckg']?.content;
        if (deepPckgContent) {
          try {
            const deepPckg = JSON.parse(deepPckgContent);
            const { ids, errors } = await packager.import(deepPckg);
            return { ids, errors };
          } catch(error) {
            errors.push(error);
          }
        } else {
          errors.push(`deep.pckg not founded in gist`);
        }
      }
      return { ids: [], errors };
    },
    packagerPublish: async (source, args, context, info) => {
      const { id, uri, type } = args.input;
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
