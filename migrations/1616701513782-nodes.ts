import { HasuraApi } from '@deepcase/hasura/api';
import { sql } from '@deepcase/hasura/sql';

export const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const SCHEMA = 'public';
export const GRAPH_TABLE = 'dc_dg_nodes';

export const permissions = async (table) => {
  await api.query({
    type: 'create_select_permission',
    args: {
      table: table,
      role: 'guest',
      permission: {
        columns: '*',
        filter: {},
        limit: 999,
        allow_aggregations: true
      }
    }
  });
  await api.query({
    type: 'create_insert_permission',
    args: {
      table: table,
      role: 'guest',
      permission: {
        check: {},
        columns: '*',
      }
    }
  });
  await api.query({
    type: 'create_update_permission',
    args: {
      table: table,
      role: 'guest',
      permission: {
        columns: '*',
        filter: {},
        check: {},
      }
    }
  });
  await api.query({
    type: 'create_delete_permission',
    args: {
      table: table,
      role: 'guest',
      permission: {
        filter: {},
      }
    }
  });
};

export const up = async () => {
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${GRAPH_TABLE}" (id integer, from_id integer, to_id integer, type_id integer);
    CREATE SEQUENCE ${GRAPH_TABLE}_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${GRAPH_TABLE}_id_seq OWNED BY ${SCHEMA}."${GRAPH_TABLE}".id;
    ALTER TABLE ONLY ${SCHEMA}."${GRAPH_TABLE}" ALTER COLUMN id SET DEFAULT nextval('${GRAPH_TABLE}_id_seq'::regclass);
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: GRAPH_TABLE,
    },
  });
  await permissions(GRAPH_TABLE);
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: GRAPH_TABLE,
      name: 'from',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
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
      table: GRAPH_TABLE,
      name: 'to',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
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
      table: GRAPH_TABLE,
      name: 'type',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
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
      table: GRAPH_TABLE,
      name: 'in',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
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
      table: GRAPH_TABLE,
      name: 'out',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
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
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: GRAPH_TABLE,
      },
    },
  });
  await api.sql(sql`
    DROP TABLE ${SCHEMA}."${GRAPH_TABLE}";
  `);
};
