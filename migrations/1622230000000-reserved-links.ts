import Debug from 'debug';
import { api, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
import { sql } from '@deep-foundation/hasura/sql.js';

const debug = Debug('deeplinks:migrations:reserved-links');
const log = debug.extend('log');
const error = debug.extend('error');

const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_RL_TABLE = process.env.MIGRATIONS_RL_TABLE || 'rl_example__links__reserved';
const DEFAULT_DATE_TYPE_SQL = process.env.MIGRATIONS_DATE_TYPE_SQL || 'timestamp';
const DEFAULT_RL_CRON_SCHEDULE = process.env.DEFAULT_RL_CRON_SCHEDULE || '0 * * * *';
const MIGRATIONS_DEEPLINKS_URL = process.env.MIGRATIONS_DEEPLINKS_URL || 'http://localhost:3006';

export const RL_TABLE_NAME = 'reserved';

export const upTable = async ({
  SCHEMA = DEFAULT_SCHEMA, RL_TABLE = DEFAULT_RL_TABLE, DATE_TYPE = DEFAULT_DATE_TYPE_SQL, customColumns = ''
} = {}) => {
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${RL_TABLE}" (id bigint PRIMARY KEY, created_at ${DEFAULT_DATE_TYPE_SQL}, reserved_ids jsonb, user_id bigint${customColumns});
    CREATE SEQUENCE ${RL_TABLE}_id_seq
    AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${RL_TABLE}_id_seq OWNED BY ${SCHEMA}."${RL_TABLE}".id;
    ALTER TABLE ONLY ${SCHEMA}."${RL_TABLE}" ALTER COLUMN id SET DEFAULT nextval('${RL_TABLE}_id_seq'::regclass);
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: RL_TABLE,
    },
  });
};

export const downTable = async ({
  SCHEMA = DEFAULT_SCHEMA, RL_TABLE = DEFAULT_RL_TABLE
} = {}) => {
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: RL_TABLE,
      },
    },
  });
  await api.sql(sql`
    DROP TABLE ${SCHEMA}."${RL_TABLE}";
  `);
};

export const up = async () => {
  log('up');
  log('table');
  await upTable({
    RL_TABLE: RL_TABLE_NAME,
  });

  log('trigger');
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__reserved__instead_of_insert__function() RETURNS TRIGGER AS $trigger$
    BEGIN
      IF NEW.id IS NOT NULL THEN
        IF EXISTS( SELECT FROM ${RL_TABLE_NAME} as RL, ${LINKS_TABLE_NAME} AS LINKS WHERE RL.reserved_ids @> NEW.id::text::jsonb AND LINKS.type_id = 0 AND LINKS.id = NEW.id) THEN
          DELETE FROM ${LINKS_TABLE_NAME} WHERE id = NEW.id;
          RETURN NEW;
        ELSE
          IF (NOT EXISTS (SELECT * FROM "links_id_seq" WHERE last_value >= NEW.id)) THEN
            RAISE EXCEPTION 'Illegal insert link with custom id with { id: %, type_id: %, from_id: %, to_id: % } %.', NEW.id, NEW.type_id, NEW.from_id, NEW.to_id, (SELECT row_to_json(t) FROM "links_id_seq" as t) USING HINT = 'Use reserve action before inserting link with id';
          END IF;
        END IF;
      END IF;
      RETURN NEW;
    END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__reserved__instead_of_insert__trigger BEFORE INSERT ON "${LINKS_TABLE_NAME}" FOR EACH ROW WHEN (pg_trigger_depth() < 1 AND NEW.type_id != 0) EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__reserved__instead_of_insert__function();`);

  log('cron_trigger');
  await api.query({
    type: 'create_cron_trigger',
    args: {
      name: 'reserved_links_cleaner',
      webhook: `${MIGRATIONS_DEEPLINKS_URL}/api/reserved-cleaner`,
      schedule: DEFAULT_RL_CRON_SCHEDULE,
      include_in_metadata: true,
      payload: {},
      retry_conf: {
        num_retries: 3,
        timeout_seconds: 120,
        tolerance_seconds: 21675,
        retry_interval_seconds: 12
      },
      comment: 'clean reserved'
    }
  });

  log('action_types');
  await api.query({
    type: 'set_custom_types',
    args: {
      scalars: [],
      enums: [],
      input_objects: [],
      objects: [
        {
          name: 'reserveResponse',
          fields: [
            {
              name: 'ids',
              type: '[String!]!'
            }
          ]
        }
      ]
    }
  });
  log('action');
  await api.query({
    type: 'create_action',
    args: {
      name: 'reserve',
      definition: {
        kind: 'synchronous',
        type: 'mutation',
        forward_client_headers: true,
        arguments: [
          {
            name: 'count',
            type: 'Int!'
          },
        ],
        output_type: 'reserveResponse',
        handler: `${MIGRATIONS_DEEPLINKS_URL}/api/reserved`
      }
    }
  });
  await api.metadata({
    type: 'create_action_permission',
    args: {
      action: 'reserve',
      role: 'link',
    }
  });
};

export const down = async () => {
  log('down');
  log('action');
  await api.query({
    type:'drop_action',
    args:{
       name:'reserve',
       clear_data: true
    }
  });
  log('cron_trigger');
  await api.query({
    type: 'delete_cron_trigger',
    args: {
       name: 'reserved_links_cleaner',
    }
  });
  log('trigger');
  await api.sql(sql`
    DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__reserved__instead_of_insert__trigger ON ${LINKS_TABLE_NAME} CASCADE;
    DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__reserved__instead_of_insert__function() CASCADE;
  `);
  log('table');
  await downTable({
    RL_TABLE: RL_TABLE_NAME,
  });
};
