import { HasuraApi } from '@deepcase/hasura/api';
import { sql } from '@deepcase/hasura/sql';
import Debug from 'debug';

const debug = Debug('deepcase:deeplinks:migrations:links');

export const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const SCHEMA = 'public';
export const TABLE_NAME = 'links';

export const up = async () => {
  debug('up');
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${TABLE_NAME}" (id bigint PRIMARY KEY, from_id bigint DEFAULT 0, to_id bigint DEFAULT 0, type_id bigint NOT NULL);
    CREATE SEQUENCE ${TABLE_NAME}_id_seq
    AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${TABLE_NAME}_id_seq OWNED BY ${SCHEMA}."${TABLE_NAME}".id;
    ALTER TABLE ONLY ${SCHEMA}."${TABLE_NAME}" ALTER COLUMN id SET DEFAULT nextval('${TABLE_NAME}_id_seq'::regclass);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__id_hash ON ${TABLE_NAME} USING hash (id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__from_id_hash ON ${TABLE_NAME} USING hash (from_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__from_id_btree ON ${TABLE_NAME} USING btree (from_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__to_id_hash ON ${TABLE_NAME} USING hash (to_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__to_id_btree ON ${TABLE_NAME} USING btree (to_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__type_id_hash ON ${TABLE_NAME} USING hash (type_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__type_id_btree ON ${TABLE_NAME} USING btree (type_id); 
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: TABLE_NAME,
    },
  });
  await api.query({
    type: 'create_event_trigger',
    args: {
      name: TABLE_NAME,
      table: TABLE_NAME,
      webhook: `${process.env.MIGRATIONS_DEEPLINKS_APP_URL}/api/eh/links`,
      insert: {
        columns: "*",
        payload: '*',
      },
      update: {
        columns: '*',
        payload: '*',
      },
      delete: {
        columns: '*'
      },
      replace: false,
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: TABLE_NAME,
      name: 'from',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            from_id: 'id',
          },
        },
      },
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: TABLE_NAME,
      name: 'to',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            to_id: 'id',
          },
        },
      },
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: TABLE_NAME,
      name: 'type',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            type_id: 'id',
          },
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TABLE_NAME,
      name: 'in',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            id: 'to_id',
          },
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TABLE_NAME,
      name: 'out',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            id: 'from_id',
          },
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TABLE_NAME,
      name: 'typed',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            id: 'type_id',
          },
        },
      },
    },
  });
};

export const down = async () => {
  debug('down');
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: TABLE_NAME,
      },
      cascade: true,
    },
  });
  await api.sql(sql`
    DROP TABLE ${SCHEMA}."${TABLE_NAME}";
  `);
};
