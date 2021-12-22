import { jwt } from '../jwt';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import gql from 'graphql-tag';
import { generateSerial, insertMutation } from '../gql';
import { ApolloServer } from 'apollo-server-express';
import { DeepClient } from '../client';

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
      const { data: [{ id }] } = await deep.insert({ type_id: await deep.id('@deep-foundation/core', 'User') });
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

const apolloServer = new ApolloServer({ introspection: true, typeDefs, resolvers, context });

export default apolloServer;
