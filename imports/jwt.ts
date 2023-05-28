import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import JWT from 'jsonwebtoken';

export interface Options {
  linkId: number;
  secret: string;
  role?: string;
}

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

/** Only server, generate jwt by linkId option. */
export function jwt(options: Options) {
  const role = options.role || 'link';
  return JWT.sign({
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": [role],
      "x-hasura-default-role": role,
      "x-hasura-user-id": options.linkId.toString(),
    }
  }, options.secret);
}
