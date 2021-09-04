import Cors from 'cors';
import { generateApolloClient } from '@deepcase/hasura/client';
import { corsMiddleware } from '@deepcase/hasura/cors-middleware';
import { HasuraApi } from "@deepcase/hasura/api";
import { generateMutation, generateSerial } from '@deepcase/deeplinks/imports/gql';

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
    const oldRow = event?.data?.old;
    const newRow = event?.data?.new;
    if (operation === 'INSERT' || operation === 'UPDATE') {
      const explained = await api.explain(`{ links(where: { _and: [{ id: { _eq: 777777777777 } }, ${newRow.gql}] }, limit: 1) { id } }`);
      const sql = explained?.data?.[0]?.sql;
      if (sql) {
        const convertedSql = `SELECT json_array_length("root") as "root" FROM (${sql}) as "root"`
        const mutateResult = await client.mutate(generateSerial({
          actions: [
            generateMutation({
              tableName: 'bool_exp', operation: 'update',
              variables: { where: { id: { _eq: newRow.id } }, _set: { sql: convertedSql } },
            }),
          ],
          name: 'INSERT_TYPE_TYPE',
        }))
        if (mutateResult?.errors) {
          return res.status(500).json({ error: mutateResult?.errors});
        }
        return res.json({ result: 'exaplained' });
      }
      console.log(explained);
      console.log(`{ links(where: { _and: [{ id: { _eq: 777777777777 } }, ${newRow.gql}] }, limit: 1) { id } }`);
      return res.status(500).json({ error: 'notexplained' });
    }
    return res.status(500).json({ error: 'operation can be only INSERT or UPDATE' });
  } catch(error) {
    return res.status(500).json({ error: error.toString() });
  }
};