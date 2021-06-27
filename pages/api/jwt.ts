import jwt from 'jsonwebtoken';

import gql from 'graphql-tag';
import { generateRemoteSchema } from '@deepcase/hasura/remote-schema';

const JWT_SECRET = process.env.JWT_SECRET;

const typeDefs = gql`
  type Query {
    dc_dg_jwt(input: DC_DG_JWTInput): DC_DG_JWTOutput
  }
  input DC_DG_JWTInput {
    linkId: Int
    role: String
  }
  type DC_DG_JWTOutput {
    token: String
    linkId: Int
    role: String
  }
`;

const resolvers = {
  Query: {
    dc_dg_jwt: async (source, args, context, info) => {
      const { linkId, role } = args.input;
      const token = jwt.sign({
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": [role],
          "x-hasura-default-role": role,
          "x-hasura-user-id": linkId,
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
