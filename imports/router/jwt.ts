import { jwt } from '../jwt.js';
import { generateRemoteSchema } from '@deep-foundation/hasura/remote-schema.js';
import gql from 'graphql-tag';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from '../client.js';

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

const JWT_SECRET = process.env.JWT_SECRET;
const jwt_secret = JSON.parse(JWT_SECRET);

export const typeDefsString = `
  type Query {
    jwt(input: JWTInput): JWTOutput
  }
  input JWTInput {
    linkId: Int
  }
  type JWTOutput {
    token: String
    linkId: Int
    error: String
  }
`;

export const typeDefs = gql`${typeDefsString}`;

const resolvers = {
  Query: {
    jwt: async (source, args, context, info) => {
      const { linkId } = args.input;
      try {
        if (!linkId) {
          return {
            linkId: +context?.headers?.['x-hasura-user-id']
          };
        }
        if (!+context?.headers?.['x-hasura-user-id'] && context?.headers?.['x-hasura-role'] !== 'admin') {
          return { error: '!currentUser' };
        }
        if (
          context?.headers?.['x-hasura-role'] !== 'admin' &&
          !(await deep.select({
            subject_id: { _eq: +context?.headers?.['x-hasura-user-id'] },
            action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowAdmin') },
          }, { table: 'can', returning: 'rule_id' }))?.data?.[0] &&
          +context?.headers?.['x-hasura-user-id'] !== linkId &&
          !await deep.can(
            linkId, +context?.headers?.['x-hasura-user-id'], await deep.id('@deep-foundation/core', 'AllowLogin')
          )
        ) {
          return { error: 'cant' };
        }
        const token = jwt({
          secret: jwt_secret.key,
          linkId,
          role: await deep.can(null, linkId, await deep.id('@deep-foundation/core', 'AllowAdmin')) ? 'admin' : 'link',
        });
        return { token, linkId };
      } catch(error) {
        return { error };
      }
    },
  }
};

const context = ({ req }) => {
  return { headers: req.headers };
};

const generateApolloServer = (httpServer) => {
  return new ApolloServer({
    introspection: true,
    typeDefs, 
    resolvers,
    context,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageGraphQLPlayground()
    ]});
  }

export default generateApolloServer;