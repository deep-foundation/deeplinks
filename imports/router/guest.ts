import { jwt } from '../jwt.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import gql from 'graphql-tag';
import { generateSerial, insertMutation } from '../gql/index.js';
import { ApolloServer } from 'apollo-server-express';
import { DeepClient } from '../client.js';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';

const JWT_SECRET = process.env.JWT_SECRET;
const jwt_secret = JSON.parse(JWT_SECRET);

export const typeDefsString = `
  type Query {
    guest: GuestOutput
  }
  type GuestOutput {
    token: String
    linkId: Int
  }
`;
export const typeDefs = gql`${typeDefsString}`;

const client = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
}, { ApolloClient: { defaultOptions: { query: { fetchPolicy: 'no-cache' }, watchQuery: { fetchPolicy: 'no-cache' } } } });

const deep = new DeepClient({
  apolloClient: client,
})

const resolvers = {
  Query: {
    guest: async (source, args, context, info) => {
      const { data: [{ id }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'User'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'Join'),
            to_id: await deep.id('deep', 'users')
          },
        ] },
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: id,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: id,
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
                out: { data: {
                  type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                  to_id: await deep.id('@deep-foundation/core', 'containTree'),
                } },
              } }
            } }
          },
        ] },
      });
      const token = jwt({
        secret: jwt_secret.key,
        linkId: id,
      });
      return { token, linkId: id };
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