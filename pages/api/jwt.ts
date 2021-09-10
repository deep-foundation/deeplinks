import jwt from 'jsonwebtoken';

import gql from 'graphql-tag';
import { generateRemoteSchema } from '@deepcase/hasura/remote-schema';

const JWT_SECRET = process.env.JWT_SECRET;

const typeDefs = gql`
  type Query {
    jwt(input: JWTInput): JWTOutput
  }
  input JWTInput {
    linkId: Int
    role: String
  }
  type JWTOutput {
    token: String
    linkId: Int
    role: String
  }
`;

const resolvers = {
  Query: {
    jwt: async (source, args, context, info) => {
      const { linkId, role } = args.input;
      const token = jwt.sign({
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": [role],
          "x-hasura-default-role": role,
          "x-hasura-user-id": linkId.toString(),
        }
      }, JWT_SECRET);
      return { token, linkId, role: role };
    },
  }
};

const context = ({ req }) => {
  return { headers: req.headers };
};
module.exports = generateRemoteSchema({ typeDefs, resolvers, context, path: '/api/jwt' });
