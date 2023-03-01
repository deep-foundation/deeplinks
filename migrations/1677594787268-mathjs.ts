import Debug from 'debug';
import { api, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { sql } from '@deep-foundation/hasura/sql';
import { _ids } from '../imports/client';
import fs from 'fs';

const mathjs = require('../mathjs-bundled/mathjs.js').code;

const debug = Debug('deeplinks:migrations:plv8');
const log = debug.extend('log');
const error = debug.extend('error');

const mathjsFunction = `const sync__handlers__package = ${mathjs}; return sync__handlers__package()`;
export const createMathjsFunction = `CREATE OR REPLACE FUNCTION links__sync__handlers__mathjs__package() RETURNS jsonb AS $code$ ${mathjsFunction} $code$ LANGUAGE plv8;`;
export const dropMathjsFunction = `DROP FUNCTION IF EXISTS links__sync__handlers__mathjs__package CASCADE;`;

export const up = async () => {
  log('up');

  await api.sql(createMathjsFunction);
};

export const down = async () => {
  log('down');

  await api.sql(dropMathjsFunction);
};