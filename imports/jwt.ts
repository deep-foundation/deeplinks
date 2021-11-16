import JWT from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const jwt_secret = Buffer.from(JWT_SECRET, 'base64');

export interface Options {
  linkId: number;
}

/** Only server, generate jwt by linkId option. */
export function jwt(options: Options) {
  return JWT.sign({
    "name": options.linkId.toString(),
    "sub": options.linkId.toString(),
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ['link'],
      "x-hasura-default-role": 'link',
      "x-hasura-user-id": options.linkId.toString(),
    }
  }, jwt_secret);
}
