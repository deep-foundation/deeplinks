import { HasuraApi } from '@deep-foundation/hasura/api';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { sql } from '@deep-foundation/hasura/sql';
import { down as downRels, up as upRels } from '@deep-foundation/materialized-path/relationships';
import { down as downTable, up as upTable } from '@deep-foundation/materialized-path/table';
import { Trigger } from '@deep-foundation/materialized-path/trigger';
import Debug from 'debug';
import { GLOBAL_ID_ANY, GLOBAL_ID_INCLUDE_DOWN, GLOBAL_ID_INCLUDE_NODE, GLOBAL_ID_INCLUDE_UP, GLOBAL_ID_TREE } from '../imports/client';
import { SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';

const debug = Debug('deeplinks:migrations:auto-indexes');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const up = async () => {
  debug('up');
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
      WHERE table_schema = schema__name AND table_name = table__name;
  END;
  $$ LANGUAGE plpgsql;`);
};

export const down = async () => {
  debug('down');
  await api.sql(sql`DROP FUNCTION create_btree_index;`);
  await api.sql(sql`DROP FUNCTION create_btree_indexes_for_all_columns;`);
};
