import { jwt } from '../jwt';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import gql from 'graphql-tag';
import { generateSerial, insertMutation } from '../gql';
import { ApolloServer } from 'apollo-server-express';
import { DeepClient } from '../client';
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
});

const deep = new DeepClient({
  apolloClient: client,
})

const resolvers = {
  Query: {
    guest: async (source, args, context, info) => {
      const { data: [{ id }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'User'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: await deep.id('@deep-foundation/core', 'system', 'users')
        } },
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Selector'),
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'Include'),
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
                type_id: await deep.id('@deep-foundation/core', 'Include'),
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
              out: { data: [
                {
                  type_id: await deep.id('@deep-foundation/core', 'Include'),
                  to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
                },
              ], }
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