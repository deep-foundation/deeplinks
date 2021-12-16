import { generateQuery, generateQueryData } from '../gql';
import { HasuraApi } from '@deep-foundation/hasura/api';
import { generateApolloClient } from '@deep-foundation/hasura/client';

const RESERVED_LIFETIME_MS = +process.env.RESERVED_LIFETIME || 24 * 60 * 60 * 1000;

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