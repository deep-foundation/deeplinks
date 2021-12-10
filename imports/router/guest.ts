import { jwt } from '../jwt';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import gql from 'graphql-tag';
import { generateSerial, insertMutation } from '../gql';
import { ApolloServer } from 'apollo-server-express';
import { DeepClient } from '../client';

const JWT_SECRET = process.env.JWT_SECRET;
const jwt_secret = JSON.parse(JWT_SECRET);

const typeDefs = gql`
  type Query {
    guest: GuestOutput
  }
  type GuestOutput {
    token: String
    linkId: Int
  }
`;

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

const resolvers = {
  Query: {
    guest: async (source, args, context, info) => {
      const result = await client.mutate(generateSerial({
        actions: [insertMutation('nodes', { objects: { type_id: await deep.id('@deep-foundation/core', 'User') } })],
        name: 'INSERT_LINK',
      }));
      const linkId = result?.data?.m0?.returning?.[0]?.id;
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

const apolloServer = new ApolloServer({ introspection: true, typeDefs, resolvers, context });

export default apolloServer;
