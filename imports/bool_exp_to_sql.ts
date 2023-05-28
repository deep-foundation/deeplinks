import Debug from 'debug';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { generateMutation, generateSerial } from './gql/index.js';
import { DeepClient } from './client.js';

const debug = Debug('deeplinks:bool_exp');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

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
  log('boolExpToSQL', boolExpId, boolExpValue);
  let gql, explained, sql;
  try {
    if (typeof(boolExpValue) !== 'object') {
      throw new Error('boolExpValue must be object');
    }
    const serializedQuery = deep.serializeQuery(boolExpValue);
    gql = JSON.stringify(serializedQuery?.where).replace(/"([^"]+)":/g, '$1:');
    gql = gql.replace(new RegExp(`'${userPublicSymbol}'`, 'g'), userReplaceSymbol);
    gql = gql.replace(new RegExp(`"${userPublicSymbol}"`, 'g'), userReplaceSymbol);
    gql = gql.replace(new RegExp(`'${itemPublicSymbol}'`, 'g'), itemReplaceSymbol);
    gql = gql.replace(new RegExp(`"${itemPublicSymbol}"`, 'g'), itemReplaceSymbol);
    explained = await api.explain(`{ links(where: { _and: [{ id: { _eq: ${itemReplaceSymbol} } }, ${gql}] }, limit: 1) { id } }`);
    sql = explained?.data?.[0]?.sql;
    if (sql) {
      const convertedSql = `SELECT json_array_length("root") as "root" FROM (${sql}) as "root"`
      const boolExp = await deep.select({ link_id: { _eq: boolExpId } }, { table: 'bool_exp' as any, returning: 'id link_id' });
      const boolExpLink = boolExp?.data?.[0];
      log('boolExpLink', boolExpLink);
      if (boolExpLink) {
        const mutateResult = await deep.update(boolExpLink.id, {
          value: convertedSql,
        }, { table: 'bool_exp' as any });
      } else {
        const mutateResult = await deep.insert({
          link_id: boolExpId,
          value: convertedSql,
        }, { table: 'bool_exp' as any });
      }
    }
  } catch (e) {
    error(e);
    error('error', gql, explained, sql);
  }
};