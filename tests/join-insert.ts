import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

describe('join-insert', () => {
  it(`{ type_id: 1, from: { data: { type_id: 1 } }, to: { data: { type_id: 1 } } }`, async () => {
    const r = await deep.insert({ type_id: 1, from: { data: { type_id: 1 } }, to: { data: { type_id: 1 } } }, { returning: `id type_id from_id from { id type_id } to_id to { id type_id }` });
    const rId = r?.data?.[0]?.id;
    assert(r?.data, [{
      id: rId, type_id: 1,
      from_id: rId - 1, from: { id: rId - 1, type_id: 1, __typename: 'links' },
      to_id: rId - 2, to: { id: rId - 2, type_id: 1, __typename: 'links' },
    }]);
  });
});