import JWT from 'jsonwebtoken';

export interface Options {
  linkId: number;
  secret: string;
}

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
