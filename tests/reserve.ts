import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const root = new DeepClient({ apolloClient });

let adminToken: string;
let deep: any;

beforeAll(async () => {
  const { linkId, token } = await root.jwt({ linkId: await root.id('deep', 'admin') });
  adminToken = token;
  deep = new DeepClient({ deep: root, token: adminToken, linkId });
});

describe('reserve', () => {
  it(`root reserve`, async () => {
    const ids = await root.reserve(3);
    assert.equal(ids.length, 3);
  });
  it(`admin reserve`, async () => {
    const ids = await deep.reserve(3);
    assert.equal(ids.length, 3);
  });
});