
import Debug from 'debug';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from '../imports/client';;
import { api, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { sql } from '@deep-foundation/hasura/sql';

const debug = Debug('deeplinks:migrations:plv8');
const log = debug.extend('log');
const error = debug.extend('error');

export const up = async () => {
  log('up');

  // await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__in__trasaction__handler__function() RETURNS TRIGGER AS $trigger$ 
  //   plv8.execute = undefined;
  //   plv8.prepare = undefined;
  //   var prepare = plv8.find_function("prepareHandler");
  //   var prepared = prepare(NEW, TG_OP);
  //   return NEW;
  // END; $trigger$ LANGUAGE plv8;`);
  // await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__in__trasaction__handler__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__insert__function();`);

};

export const down = async () => {
  log('down');

  // await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__in__trasaction__handler__trigger ON "${LINKS_TABLE_NAME}";`);
  // await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__in__trasaction__handler__function CASCADE;`);
};
