import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';

const adminToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsibGluayJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJsaW5rIiwieC1oYXN1cmEtdXNlci1pZCI6IjM5In0sImlhdCI6MTYzNzAzMjQwNn0.EtYolslSV66xKe7Bx4x3MkS-dQL5hPqaUqE0eStH3KE`;

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  token: adminToken,
});

const deep = new DeepClient({ apolloClient });

describe('permissions', () => {
  it(`anonymous`, async () => {
    // const adminId = await deep.id('@deep-foundation/core', 'admin');
    // const { data: [{ id }] } = await deep.insert({ type_id: 1 });
  });
});