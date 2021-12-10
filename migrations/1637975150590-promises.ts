import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { up as upTable, down as downTable } from '@deep-foundation/materialized-path/table';
import { up as upRels, down as downRels } from '@deep-foundation/materialized-path/relationships';
import { Trigger } from '@deep-foundation/materialized-path/trigger';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { generatePermissionWhere, permissions } from '../imports/permission';
import { sql } from '@deep-foundation/hasura/sql';
import { ALLOWED_IDS, DENIED_IDS, GLOBAL_ID_PROMISE, GLOBAL_ID_THEN } from '../imports/client';

const debug = Debug('deeplinks:migrations:promises');

export const up = async () => {
  debug('up');
  await api.sql(sql`CREATE OR REPLACE FUNCTION links__promise__insert__function() RETURNS TRIGGER AS $trigger$ DECLARE PROMISE bigint; BEGIN
    -- я закоментил это, так как больше нет вероятности возникновения таблиц, и тут все равно будет другой твой код Константин)
    -- IF (NEW."id" NOT IN (${DENIED_IDS.join(',')}) AND NEW."type_id" != 0 AND NEW."type_id" NOT IN (${DENIED_IDS.join(',')}) AND NEW."type_id" IN (${ALLOWED_IDS.join('m')})) THEN
    --   INSERT INTO links ("type_id") VALUES (${GLOBAL_ID_PROMISE}) RETURNING id INTO PROMISE;
    --   INSERT INTO links ("type_id","from_id","to_id") VALUES (${GLOBAL_ID_THEN},NEW."id",PROMISE);
    -- END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER links__promise__insert__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE links__promise__insert__function();`);
  await api.sql(sql`CREATE TRIGGER links__promise__update__trigger AFTER UPDATE ON "links" FOR EACH ROW EXECUTE PROCEDURE links__promise__insert__function();`);
};

export const down = async () => {
  debug('down');
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__promise__insert__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__promise__insert__trigger ON "${LINKS_TABLE_NAME}";`);
};
