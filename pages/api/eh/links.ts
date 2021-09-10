import Cors from 'cors';
import { generateApolloClient } from '@deepcase/hasura/client';
import { corsMiddleware } from '@deepcase/hasura/cors-middleware';
import { HasuraApi } from "@deepcase/hasura/api";
import { generateMutation, generateQuery, generateSerial } from '@deepcase/deeplinks/imports/gql';
import { gql } from 'apollo-boost';
import vm from 'vm';

export const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const cors = Cors({ methods: ['GET', 'HEAD', 'POST'] });
export default async (req, res) => {
  await corsMiddleware(req, res, cors);
  try {
    const event = req?.body?.event;
    const operation = event?.op;
    if (operation === 'INSERT' || operation === 'UPDATE' || operation === 'DELETE') {
      const oldRow = event?.data?.old;
      const newRow = event?.data?.new;
      const typeId = operation === 'DELETE' ? oldRow.type_id : newRow.type_id;
      const handleStringResult = await client.query({ query: gql`query SELECT_STRING_HANDLE($typeId: bigint) { string(where: {
        link: {
          type_id: { _eq: 20 },
          to_id: { _eq: 16 },
          from_id: { _eq: $typeId }
        },
      }) {
        id
        value
      } }`, variables: {
        typeId,
      }});
      const handleStringValue = handleStringResult?.data?.string?.[0]?.value;
      try { 
        vm.runInNewContext(handleStringValue, { console, Error, oldRow, newRow });
      } catch(error) {
        console.log(error);
      }
      return res.status(500).json({ error: 'notexplained' });
    }
    return res.status(500).json({ error: 'operation can be only INSERT or UPDATE' });
  } catch(error) {
    return res.status(500).json({ error: error.toString() });
  }
};