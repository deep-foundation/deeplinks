import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { generateMutation, generateSerial, insertMutation } from '../imports/gql/index.js';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
import times from 'lodash/times';
import { time } from 'console';
import { Packager, Package } from '../imports/packager.js';
import { DeepClient } from '../imports/client.js';
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import { generateUp, generateDown } from '../imports/type-table.js';

export const BOOL_EXP_TABLE_NAME = 'bool_exp';

const debug = Debug('deeplinks:migrations:values');
const log = debug.extend('log');
const error = debug.extend('error');

const apolloClient = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

export const up = async () => {
  log('up');
  await (generateUp({
    schemaName: 'public',
    tableName: 'strings',
    valueType: 'TEXT NOT NULL DEFAULT ""',
    customColumnsSql: 'value text',
    linkRelation: 'string',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (generateUp({
    schemaName: 'public',
    tableName: 'numbers',
    valueType: 'numeric NOT NULL DEFAULT 0',
    customColumnsSql: 'value numeric',
    linkRelation: 'number',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (generateUp({
    schemaName: 'public',
    tableName: 'objects',
    valueType: 'jsonb NOT NULL DEFAULT \'{}\'::jsonb',
    customColumnsSql: 'value jsonb',
    linkRelation: 'object',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (generateUp({
    schemaName: 'public',
    tableName: BOOL_EXP_TABLE_NAME,
    valueType: 'TEXT',
    customColumnsSql: 'value text',
    api,
    deep,
  })());
};

export const down = async () => {
  log('down');
  await (generateDown({
    schemaName: 'public',
    tableName: 'strings',
    valueType: 'TEXT',
    customColumnsSql: 'value text',
    linkRelation: 'string',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (generateDown({
    schemaName: 'public',
    tableName: 'numbers',
    valueType: 'float8',
    customColumnsSql: 'value bigint',
    linkRelation: 'number',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (generateDown({
    schemaName: 'public',
    tableName: 'objects',
    valueType: 'jsonb',
    customColumnsSql: 'value jsonb',
    linkRelation: 'object',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (generateDown({
    schemaName: 'public',
    tableName: BOOL_EXP_TABLE_NAME,
    valueType: 'TEXT',
    customColumnsSql: 'value text',
    api,
    deep,
  })());
};