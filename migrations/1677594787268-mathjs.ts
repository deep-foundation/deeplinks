import Debug from 'debug';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from '../imports/client';;
import { api, TABLE_NAME as LINKS_TABLE_NAME } from '../migrations/1616701513782-links';
import { sql } from '@deep-foundation/hasura/sql';
import { _ids } from '../imports/client';

const mathjs = require('../mathjs-bundled/mathjs.js').json;

const debug = Debug('deeplinks:migrations:plv8');
const log = debug.extend('log');
const error = debug.extend('error');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})


const mathjsFunction = /*javascript*/` return ${mathjs}`;

export const createMathjsFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__handlers__mathjs__package(link jsonb, handletypeid bigint) RETURNS jsonb AS $$ ${mathjsFunction} $$ LANGUAGE plv8;`;
export const dropMathjsFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__handlers__mathjs__package CASCADE;`;


export const up = async () => {
  log('up');

  await api.sql(createMathjsFunction);
};

export const down = async () => {
  log('down');

  await api.sql(dropMathjsFunction);
};
