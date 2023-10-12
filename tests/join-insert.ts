import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

describe('join-insert', () => {
  it(`{ type_id: 1, string: { data: { value: 'abc' } }, from: { data: { type_id: 1 } }, to: { data: { type_id: 1 } } }`, async () => {
    const r: any = await deep.insert({ type_id: 1, string: { data: { value: 'abc' } }, from: { data: { type_id: 1 } }, to: { data: { type_id: 1 } } }, { returning: `id type_id value from_id from { id type_id } to_id to { id type_id }` });
    const rId = r?.data?.[0]?.id;
    const vId = r?.data?.[0]?.value?.id;
    assert.equal(r?.data, [{
      id: rId, type_id: 1,
      value: { id: vId, link_id: rId, value: 'abc' },
      from_id: rId - 1, from: { id: rId - 1, type_id: 1, __typename: 'links' },
      to_id: rId - 2, to: { id: rId - 2, type_id: 1, __typename: 'links' },
    }]);
  });
});