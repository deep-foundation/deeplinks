import Cors from 'cors';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { corsMiddleware } from '@deep-foundation/hasura/cors-middleware';
import { HasuraApi } from "@deep-foundation/hasura/api";
import { generateMutation, generateSerial, insertMutation } from '../gql';

const SCHEMA = 'public';

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
    const count = req?.body?.input?.count;
    if (!count) res.status(500).json({ error: 'no count' });
    // const token = req?.body?.session_variables;
    const links = [];
    for (let i = 0; i < count; i++) links[i] = { type_id: 0 };
    console.log('reserve count', count);
    const mutateLinksResult = await client.mutate(generateSerial({
      actions: [insertMutation('links', { objects: links })],
      name: 'INSERT_LINKS',
    }));
    const ids = mutateLinksResult.data['m0']?.returning?.map(node => node.id);
    console.log('reserve ids', ids);
    if (!ids)  res.status(500).json({ error: 'insert links error' });
    const mutateReservedResult = await client.mutate(generateSerial({
      actions: [
        generateMutation({
          tableName: 'reserved', operation: 'insert',
          variables: { objects: { reserved_ids: ids, user_id: 123123, created_at: new Date().toISOString() } }, //userid
        }),
      ],
      name: 'INSERT_RESERVED',
    }));
    console.log(mutateReservedResult.errors, mutateReservedResult.data);
    if (!mutateLinksResult.data['m0']?.returning?.[0]?.id) res.status(500).json({ error: 'insert resrved error' });
    return res.json({ ids });
  } catch(error) {
    console.log(JSON.stringify(error, null, 2));
    return res.status(500).json({ error: error.toString() });
  }
};