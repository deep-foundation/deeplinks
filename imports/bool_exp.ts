import Debug from 'debug';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { HasuraApi } from "@deep-foundation/hasura/api";
import { generateMutation, generateSerial } from './gql';
import { DeepClient } from './client';

const debug = Debug('deeplinks:bool_exp');

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

export const itemReplaceSymbol = 777777777777;
export const userReplaceSymbol = 777777777778;
export const itemPublicSymbol = 'X-Deep-Item-Id';
export const userPublicSymbol = 'X-Deep-User-Id';

export const applyBoolExpToLink = (sql: string, linkId: number) => {
  return sql.replace(`${itemReplaceSymbol}`, `${linkId}`);
};

export const boolExpToSQL = async (boolExpId: number, boolExpValue: any) => {
  debug('boolExpToSQL', boolExpId, boolExpValue);
  let gql, explained, sql;
  try {
    gql = JSON.stringify(boolExpValue).replace(/"([^"]+)":/g, '$1:');
    gql = gql.replace(`'${userPublicSymbol}'`, userReplaceSymbol);
    gql = gql.replace(`"${userPublicSymbol}"`, userReplaceSymbol);
    gql = gql.replace(`'${itemPublicSymbol}'`, itemReplaceSymbol);
    gql = gql.replace(`"${itemPublicSymbol}"`, itemReplaceSymbol);
    explained = await api.explain(`{ links(where: { _and: [{ id: { _eq: ${itemReplaceSymbol} } }, ${gql}] }, limit: 1) { id } }`);
    sql = explained?.data?.[0]?.sql;
    if (sql) {
      const convertedSql = `SELECT json_array_length("root") as "root" FROM (${sql}) as "root"`
      const boolExp = await deep.select({ link_id: { _eq: boolExpId } }, { table: 'bool_exp', returning: 'id link_id' });
      const boolExpLink = boolExp?.data?.[0];
      debug('boolExpLink', boolExpLink);
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
    console.log(gql, explained, sql);
  }
};