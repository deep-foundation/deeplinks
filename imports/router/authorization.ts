import { jwt } from '../jwt';
import { generateRemoteSchema } from '@deep-foundation/hasura/remote-schema';
import gql from 'graphql-tag';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from '../client';
import Chance from 'chance';

const chance = new Chance();

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
    authorization: Authorization
  }
  type Authorization {
    try(input: AuthorizationTryInput): AuthorizationTryOutput
    set(input: AuthorizationSetInput): AuthorizationSetOutput
    get(input: AuthorizationGetInput): AuthorizationGetOutput
  }
  input AuthorizationTryInput {
    linkId: Int
  }
  type AuthorizationTryOutput {
    id: String
    error: String
  }
  input AuthorizationSetInput {
    id: String!
    linkId: Int
    error: String
  }
  type AuthorizationSetOutput {
    error: String
  }
  input AuthorizationGetInput {
    id: String!
  }
  type AuthorizationGetOutput {
    jwt: JWT
    error: String
  }
  type JWT {
    token: String
    linkId: Int
  }
`;

export const typeDefs = gql`${typeDefsString}`;

const tries = {};

const resolvers = {
  Query: {
    authorization: {
      try: async (source, args, context, info) => {
        const { linkId } = args.input;
        if (linkId && linkId !== +context?.headers?.['x-hasura-user-id']) {
          return {
            error: '!currentUser'
          };
        }
        const id = chance.string({ length: 16 });
        tries[id] = {
          linkId,
          jwt: undefined,
        };
      },
      set: async (source, args, context, info) => {
        const { id, linkId: authLinkId, error } = args.input;
        if (!tries[id]) {
          return {
            error: '!try'
          };
        }
        let { linkId } = tries[id];
        if (error) {
          tries[id].error = error;
          return;
        }
        let jwt;
        const auth = await deep.select({
          type_id: await deep.id('@deep-foundation/core', 'Authorization'),
          to_id: authLinkId,
        });
        if (auth?.data?.length) {
          if (linkId) {
            return {
              error: `authorization already attached to link ${linkId}`,
            };
          } else {
            linkId = auth?.data?.[0].from_id;
            jwt = await deep.jwt({ linkId });
          }
        } else if (!auth?.data?.length) {
          if (!linkId) {
            jwt = await deep.guest();
            linkId = jwt.linkId;
          } else {
            jwt = await deep.jwt({ linkId });
          }
          await deep.insert({
            type_id: await deep.id('@deep-foundation/core', 'Authorization'),
            from_id: jwt.linkId,
            to_id: authLinkId,
          });
        }
        tries[id].jwt = jwt;
      },
      get: async (source, args, context, info) => {
        const { id } = args.input;
        if (!tries[id]) {
          return {
            error: '!try'
          };
        }
        const { linkId } = tries[id];
        if (linkId && linkId !== +context?.headers?.['x-hasura-user-id']) {
          return {
            error: '!currentUser'
          };
        }
        return {
          jwt: tries[id].jwt,
        };
      },
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