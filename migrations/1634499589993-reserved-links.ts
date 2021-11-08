import { generateApolloClient } from '@deepcase/hasura/client';
import Debug from 'debug';
import { up as upRels, down as downRels } from '@deepcase/materialized-path/relationships';
import { Trigger } from '@deepcase/materialized-path/trigger';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from '../../../../deeplinks/migrations/1616701513782-links';
import { generatePermissionWhere, permissions } from '../../../../deeplinks/imports/permission';
import { sql } from '@deepcase/hasura/sql';

const debug = Debug('deepcase:deeplinks:migrations:reserved-links');

const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_RL_TABLE = process.env.MIGRATIONS_RL_TABLE || 'rl_example__links__reserved';
const DEFAULT_DATE_TYPE_SQL = process.env.MIGRATIONS_DATE_TYPE_SQL || 'timestamp';
const DEFAULT_RL_CHECK_TIME = process.env.MIGRATIONS_RL_CHECK_TIME || 60 * 60 * 1000;
const NEXT_PUBLIC_DEEPLINKS_SERVER = process.env.NEXT_PUBLIC_DEEPLINKS_SERVER || 'http://localhost:3007';

export const RL_TABLE_NAME = 'reserved';

export const upTable = async ({
  SCHEMA = DEFAULT_SCHEMA, RL_TABLE = DEFAULT_RL_TABLE, DATE_TYPE = DEFAULT_DATE_TYPE_SQL, customColumns = ''
} = {}) => {
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${RL_TABLE}" (id bigint PRIMARY KEY, created_at ${DEFAULT_DATE_TYPE_SQL}, reserved_ids jsonb, user_id bigint${customColumns});
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
  debug('up');
  debug('table');
  await upTable({
    RL_TABLE: RL_TABLE_NAME,
  });

  debug('trigger');
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__reserved__instead_of_insert__function() RETURNS TRIGGER AS $trigger$
    BEGIN
      IF NEW.id IS NOT NULL THEN
        IF EXISTS( SELECT id FROM ${RL_TABLE_NAME} as RL, ${LINKS_TABLE_NAME} AS LINKS WHERE RL.reserved_ids @> NEW.id AND LINKS.type_id = 26
          UPDATE ${LINKS_TABLE_NAME} SET type_id = NEW.type_id, from_id = NEW.from_id, to_id = NEW.to_id WHERE id = NEW.id;
        ELSE
        RAISE EXCEPTION 'Illegal INSERT with id --> %', NEW.id USING HINT = 'Use reserve action before inserting link with id';
        END IF;
      END IF;
      RETURN NEW;
    END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__reserved__instead_of_insert__trigger INSTEAD OF INSERT ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__reserved__instead_of_insert__function();`);

  debug('cron_trigger');
  await api.query({
    type: 'create_cron_trigger',
    args: {
      name: 'reserved_links_cleaner',
      webhook: `${NEXT_PUBLIC_DEEPLINKS_SERVER}/reserved/cleaner`,
      schedule: '0 22 * * 1-5',
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

  debug('action_types');
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
  debug('action');
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
        handler: `${NEXT_PUBLIC_DEEPLINKS_SERVER}/reserved/webhook`
      }
    }
  });
  debug('permissions');
  await api.query({
    type : 'pg_create_select_permission',
    args : {
        table : LINKS_TABLE_NAME,
        role : 'link',
        permission : {
          columns : [],
        }
    }
  });
  await api.query({
    type: 'create_insert_permission',
    args: {
      table: LINKS_TABLE_NAME,
      role: 'link',
      permission: {
        columns: [],
      }
    }
  });
  await api.query({
    type: 'create_update_permission',
    args: {
      table: LINKS_TABLE_NAME,
      role: 'link',
      permission: {
        columns: [],
      }
    }
  });
  await api.query({
    type: 'create_delete_permission',
    args: {
      table: LINKS_TABLE_NAME,
      role: 'link',
      permission: {
        columns: [],
      }
    }
  });
};

export const down = async () => {
  debug('down');
  debug('permissions');
  await api.query({
    type : 'pg_drop_select_permission',
    args : {
        table : LINKS_TABLE_NAME,
        role : 'link',
    }
  });
  await api.query({
    type : 'pg_drop_insert_permission',
    args : {
        table : LINKS_TABLE_NAME,
        role : 'link',
    }
  });
  await api.query({
    type : 'pg_drop_update_permission',
    args : {
        table : LINKS_TABLE_NAME,
        role : 'link',
    }
  });
  await api.query({
    type : 'pg_drop_delete_permission',
    args : {
        table : LINKS_TABLE_NAME,
        role : 'link',
    }
  });
  debug('action');
  await api.query({
    type:'drop_action',
    args:{
       name:'reserve',
       clear_data: true
    }
 });
  debug('cron_trigger');
  await api.query({
    type: 'delete_cron_trigger',
    args: {
       name: 'reserved_links_cleaner',
    }
 });
 debug('trigger');
  await api.sql(sql`
    DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__reserved__instead_of_insert__trigger ON ${LINKS_TABLE_NAME} CASCADE;
    DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__reserved__instead_of_insert__function() CASCADE;
  `);
  debug('table');
  await downTable({
    RL_TABLE: RL_TABLE_NAME,
  });
};
