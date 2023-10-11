
import Debug from 'debug';
import { api, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const debug = Debug('deeplinks:migrations:plv8');
const log = debug.extend('log');
const error = debug.extend('error');

const mathjsPackage = require('../bundles/mathjs.js').code;
const jsonschemaPackage = require('../bundles/jsonschema.js').code;

export const createMathjsFabric = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__handlers__mathjs__package() RETURNS jsonb AS $package$ const sync__handlers__package = ${mathjsPackage}; return sync__handlers__package(); $package$ LANGUAGE plv8;`;

export const dropMathjsFabric = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__handlers__mathjs__package CASCADE;`;

export const createJsonschemaFabric = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__handlers__jsonschema__package() RETURNS jsonb AS $package$ const sync__handlers__package = ${jsonschemaPackage}; return sync__handlers__package(); $package$ LANGUAGE plv8;`;

export const dropJsonschemaFabric = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__handlers__jsonschema__package CASCADE;`;

export const up = async () => {
  log('up');

  await api.sql(createMathjsFabric);
  await api.sql(createJsonschemaFabric);
};

export const down = async () => {
  log('down');

  await api.sql(dropJsonschemaFabric);
  await api.sql(dropMathjsFabric);
};