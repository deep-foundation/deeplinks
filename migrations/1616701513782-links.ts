import Debug from 'debug';
import { HasuraApi } from '@deepcase/hasura/api';
import { sql } from '@deepcase/hasura/sql';
import { permissions } from '../imports/permission';

const debug = Debug('deepcase:deepgraph:migrations:links');

export const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const SCHEMA = 'public';
export const TABLE_NAME = 'dc_dg_links';

export const up = async () => {
  debug('up');
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${TABLE_NAME}" (id bigint, from_id bigint NOT NULL, to_id bigint NOT NULL, type_id bigint NOT NULL);
    CREATE SEQUENCE ${TABLE_NAME}_id_seq
    AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${TABLE_NAME}_id_seq OWNED BY ${SCHEMA}."${TABLE_NAME}".id;
    ALTER TABLE ONLY ${SCHEMA}."${TABLE_NAME}" ALTER COLUMN id SET DEFAULT nextval('${TABLE_NAME}_id_seq'::regclass);
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: TABLE_NAME,
    },
  });
  await permissions(api, TABLE_NAME, { "_or": [
    { "id": { "_eq": "X-Hasura-User-Id" } },
    { "type_id": { "_eq": 14 } },
    { "type_id": { "_eq": 1 } },
    { "_by_item": { "by_path_item": { "item": { "type_id": { "_eq": 11 } } } } },
    { "_by_item": { "by_path_item": { "item_id": { "_eq": "X-Hasura-User-Id" } } } },
  ] });
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
    },
  });
  await api.sql(sql`
    DROP TABLE ${SCHEMA}."${TABLE_NAME}";
  `);
};
