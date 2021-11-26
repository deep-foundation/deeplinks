import { generateQuery, generateQueryData } from '../gql';
import { HasuraApi } from '@deep-foundation/hasura/api';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { corsMiddleware } from '@deep-foundation/hasura/cors-middleware';
import Cors from 'cors';

const SCHEMA = 'public';

const RESERVED_LIFETIME_MS = +process.env.RESERVED_LIFETIME || 24 * 60 * 60 * 1000;

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
    const body = req?.body;
    const result = await client.query(generateQuery({
      queries: [
        generateQueryData({ tableName: 'reserved', returning: `reserved_ids`, variables: { where: {
          created_at: {
            _lt: new Date(Date.now() - RESERVED_LIFETIME_MS)
          }
        } } }),
      ],
      name: 'CRON_RESERVED',
    }));

    return res.json({ cleaned: [] });
  } catch(error) {
    return res.status(500).json({ error: error.toString() });
  }
};