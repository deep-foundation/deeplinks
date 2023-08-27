import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { generateMutation, generateSerial, insertMutation } from '../gql/index.js';
import Debug from 'debug';

const debug = Debug('deeplinks:eh:reserved');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const SCHEMA = 'public';

export const api = new HasuraApi({
  path: process.env.DEEPLINKS_HASURA_PATH,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const client = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

export default async (req, res) => {
  try {
    const count = req?.body?.input?.count;
    if (!count) return res.status(500).json({ error: 'no count' });
    // const token = req?.body?.session_variables;
    const links = [];
    for (let i = 0; i < count; i++) links[i] = { type_id: 0 };
    const mutateLinksResult = await client.mutate(generateSerial({
      actions: [insertMutation('links', { objects: links })],
      name: 'INSERT_LINKS',
    }));
    const ids = mutateLinksResult.data['m0']?.returning?.map(node => node.id);
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
    if (!mutateLinksResult.data['m0']?.returning?.[0]?.id) res.status(500).json({ error: 'insert reserved error' });
    return res.json({ ids });
  } catch(e) {
    error(JSON.stringify(e, null, 2));
    return res.status(500).json({ error: e.toString() });
  }
};
