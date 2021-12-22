import { jwt } from '../jwt';
import { generateRemoteSchema } from '@deep-foundation/hasura/remote-schema';
import gql from 'graphql-tag';
import { ApolloServer } from 'apollo-server-express';

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