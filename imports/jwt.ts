import { generateApolloClient } from '@deep-foundation/hasura/client';
import JWT from 'jsonwebtoken';

export interface Options {
  linkId: number;
  secret: string;
}

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

/** Only server, generate jwt by linkId option. */
export function jwt(options: Options) {
  return JWT.sign({
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ['link'],
      "x-hasura-default-role": 'link',
      "x-hasura-user-id": options.linkId.toString(),
    }
  }, options.secret);
}
