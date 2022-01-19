import { generateApolloClient } from '@deep-foundation/hasura/client';
import { HasuraApi } from "@deep-foundation/hasura/api";
import { generateMutation, generateSerial } from './gql';
import { DeepClient } from './client';

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

const deep = new DeepClient({
  apolloClient: client,
})

export const replaceSymbol = '777777777777';

export const applyBoolExpToLink = (sql: string, linkId: number) => {
  return sql.replace(replaceSymbol, `${linkId}`);
};

export const boolExpToSQL = async (boolExpId: number, boolExpValue: any) => {
  try {
    const gql = JSON.stringify(boolExpValue).replace(/"([^"]+)":/g, '$1:');
    const explained = await api.explain(`{ links(where: { _and: [{ id: { _eq: ${replaceSymbol} } }, ${gql}] }, limit: 1) { id } }`);
    const sql = explained?.data?.[0]?.sql;
    if (sql) {
      const convertedSql = `SELECT json_array_length("root") as "root" FROM (${sql}) as "root"`
      const boolExp = await deep.select({ link_id: { _eq: boolExpId } }, { table: 'bool_exp', returning: 'id link_id' });
      const boolExpLink = boolExp?.data?.[0];
      if (boolExpLink) {
        const mutateResult = await deep.update(boolExpLink.id, {
          value: convertedSql,
        }, { table: 'bool_exp' });
      } else {
        const mutateResult = await deep.insert({
          link_id: boolExpId,
          value: convertedSql,
        }, { table: 'bool_exp' });
      }
    }
  } catch (error) {
    console.log(error);
  }
};