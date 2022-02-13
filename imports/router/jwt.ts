import { jwt } from '../jwt';
import { generateRemoteSchema } from '@deep-foundation/hasura/remote-schema';
import gql from 'graphql-tag';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from '../client';

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
  }
`;

export const typeDefs = gql`${typeDefsString}`;

const resolvers = {
  Query: {
    jwt: async (source, args, context, info) => {
      const { linkId } = args.input;
      if (
        context?.headers?.['x-hasura-role'] !== 'admin' &&
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
      });
      return { token, linkId };
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