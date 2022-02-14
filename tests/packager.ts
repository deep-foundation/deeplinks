import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

const GIST_URL = process.env.GIST_URL;

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const root = new DeepClient({ apolloClient });

let adminToken: string;
let deep: any;

beforeAll(async () => {
  const { linkId, token } = await root.jwt({ linkId: await root.id('@deep-foundation/core', 'system', 'admin') });
  adminToken = token;
  deep = new DeepClient({ deep: root, token: adminToken, linkId });
});

describe('packager', () => {
  if (GIST_URL) {
    it(`install`, async () => {
      // insert query
      const { data: [{ id: packageQueryId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'PackagerQuery'),
        string: { data: { value: GIST_URL } },
      });
      // initiate installation
      const { data: [{ id: packageInstallId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'PackagerInstall'),
        from_id: deep.linkId, // actual user only can be here
        to_id: packageQueryId,
      });
      // you can await promise of all operations about this link
      await deep.await(packageInstallId);
    });
  } else {
    throw new Error('!GIST_URL');
  }
});