var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    yield api.sql(sql `
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
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
    yield api.sql(sql `
    DROP TRIGGER IF EXISTS ${TABLE_NAME}__unvalue__delete_links__trigger ON ${TABLE_NAME} CASCADE;
    DROP FUNCTION IF EXISTS ${TABLE_NAME}__unvalue__delete_links__function() CASCADE;
  `);
});
//# sourceMappingURL=1658622099992-unvalue.js.map