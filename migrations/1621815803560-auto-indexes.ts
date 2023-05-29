import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';

const debug = Debug('deeplinks:migrations:auto-indexes');
const log = debug.extend('log');
const error = debug.extend('error');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const up = async () => {
  log('up');
  await api.sql(sql`CREATE OR REPLACE FUNCTION create_btree_index(schema_name text, table_name text, column_name text) RETURNS void
  AS $$
  BEGIN
      EXECUTE 'CREATE INDEX IF NOT EXISTS ' || table_name || '__' || column_name || '_btree ON ' || schema_name || '.' || table_name || ' USING btree (' || column_name || ');';
  END;
  $$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION create_btree_indexes_for_all_columns(schema__name text, table__name text) RETURNS void
  AS $$
  BEGIN
      PERFORM create_btree_index(table_schema, table_name, column_name) FROM information_schema.columns
      WHERE 
          table_schema = schema__name 
      AND table_name = table__name
      AND data_type != 'text' -- It is not recommended to index 'text' columns with 'btree' index (this index has a limit of key size - 2712 bytes, and 'text' columns can contain larger text strings)
      ;
  END;
  $$ LANGUAGE plpgsql;`);
};

export const down = async () => {
  log('down');
  await api.sql(sql`DROP FUNCTION create_btree_index;`);
  await api.sql(sql`DROP FUNCTION create_btree_indexes_for_all_columns;`);
};
