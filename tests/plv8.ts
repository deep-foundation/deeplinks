import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

describe('plv8', () => {
  it(`user can basic dc operations`, async () => {
    
  });
});