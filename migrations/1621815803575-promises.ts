import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { up as upTable, down as downTable } from '@deep-foundation/materialized-path/table';
import { up as upRels, down as downRels } from '@deep-foundation/materialized-path/relationships';
import { Trigger } from '@deep-foundation/materialized-path/trigger';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { generatePermissionWhere, permissions } from '../imports/permission';
import { sql } from '@deep-foundation/hasura/sql';
import { GLOBAL_ID_PROMISE, GLOBAL_ID_REJECTED, GLOBAL_ID_RESOLVED, GLOBAL_ID_THEN } from '../imports/global-ids';

const debug = Debug('deeplinks:migrations:promises');

export const up = async () => {
  debug('up');
  // await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__promise__insert__function() RETURNS TRIGGER AS $trigger$ DECLARE PROMISE bigint; BEGIN
  //   IF (NEW."type_id" NOT IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,${GLOBAL_ID_THEN},${GLOBAL_ID_PROMISE},${GLOBAL_ID_RESOLVED},${GLOBAL_ID_REJECTED})) THEN
  //     INSERT INTO ${LINKS_TABLE_NAME} ("type_id") VALUES (${GLOBAL_ID_PROMISE}) RETURNING id INTO PROMISE;
  //     INSERT INTO ${LINKS_TABLE_NAME} ("type_id","from_id","to_id") VALUES (${GLOBAL_ID_THEN},NEW."id",PROMISE);
  //   END IF;
  //   RETURN NEW;
  // END; $trigger$ LANGUAGE plpgsql;`);
  // await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__promise__insert__trigger AFTER INSERT ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__insert__function();`);
};

export const down = async () => {
  debug('down');
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__promise__insert__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__promise__insert__trigger ON "${LINKS_TABLE_NAME}";`);
};
