import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';

const debug = Debug('deeplinks:migrations:links');
const log = debug.extend('log');
const error = debug.extend('error');

export const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const SCHEMA = 'public';
export const TABLE_NAME = 'links';

export const up = async () => {
  log('up');
  await api.sql(sql`
    CREATE OR REPLACE FUNCTION public.${TABLE_NAME}__unvalue__delete_links__function()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
      BEGIN
        DELETE FROM strings WHERE "link_id" = OLD."id";
        DELETE FROM numbers WHERE "link_id" = OLD."id";
        DELETE FROM objects WHERE "link_id" = OLD."id";
        RETURN OLD;
      END;
    $function$;
    CREATE TRIGGER ${TABLE_NAME}__unvalue__delete_links__trigger AFTER DELETE ON "${TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${TABLE_NAME}__unvalue__delete_links__function();
  `);
};

export const down = async () => {
  log('down');
  await api.sql(sql`
    DROP TRIGGER IF EXISTS ${TABLE_NAME}__unvalue__delete_links__trigger ON ${TABLE_NAME} CASCADE;
    DROP FUNCTION IF EXISTS ${TABLE_NAME}__unvalue__delete_links__function() CASCADE;
  `);
};
