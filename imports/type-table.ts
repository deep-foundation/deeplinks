import { HasuraApi } from '@deep-foundation/hasura/api';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { sql } from '@deep-foundation/hasura/sql';
import { permissions } from './permission';

export interface ITypeTableStringOptions {
  schemaName: string;
  tableName: string;
  valueType?: string;
  customColumnsSql?: string;
  customAfterSql?: string;
  linkRelation: string;
  linksTableName: string;
  api: HasuraApi;
}

export const generateUp = (options: ITypeTableStringOptions) => async () => {
  const { schemaName, tableName, valueType, customColumnsSql = '', customAfterSql = '', linkRelation, linksTableName, api } = options;

  await api.sql(sql`
    CREATE TABLE ${schemaName}."${tableName}" (id bigint PRIMARY KEY, link_id bigint, ${customColumnsSql ? customColumnsSql : `value ${valueType}`});
    CREATE SEQUENCE ${tableName}_id_seq
    AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${tableName}_id_seq OWNED BY ${schemaName}."${tableName}".id;
    ALTER TABLE ONLY ${schemaName}."${tableName}" ALTER COLUMN id SET DEFAULT nextval('${tableName}_id_seq'::regclass);
    CREATE INDEX IF NOT EXISTS ${tableName}__id_hash ON ${tableName} USING hash (id);
    CREATE INDEX IF NOT EXISTS ${tableName}__link_id_hash ON ${tableName} USING hash (link_id);
    CREATE INDEX IF NOT EXISTS ${tableName}__link_id_btree ON ${tableName} USING btree (link_id);
    ${/* Should we add customIndexesSql? */ customColumnsSql ? /*customColumnsSql*/ '' : `CREATE INDEX IF NOT EXISTS ${tableName}__value_btree ON ${tableName} USING btree (value);`}
    ${customAfterSql}
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: schemaName,
      name: tableName,
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: tableName,
      name: 'link',
      type: 'one_to_one',
      using: {
        manual_configuration: {
          remote_table: {
            schema: schemaName,
            name: linksTableName,
          },
          column_mapping: {
            link_id: 'id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: linksTableName,
      name: linkRelation,
      type: 'one_to_one',
      using: {
        manual_configuration: {
          remote_table: {
            schema: schemaName,
            name: tableName,
          },
          column_mapping: {
            id: 'link_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });
  await permissions(api, tableName, {
    select: {},
    insert: {}, // generatePermissionWhere(16),
    update: {}, // generatePermissionWhere(17),
    delete: {},
  });
  await api.query({
    type: 'create_event_trigger',
    args: {
      name: tableName,
      table: tableName,
      webhook: `${process.env.DEEPLINKS_URL}/api/values`,
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
};

export const generateDown = (options: ITypeTableStringOptions) => async () => {
  const { schemaName, tableName, linkRelation, linksTableName, api } = options;

  await api.query({
    type: 'drop_relationship',
    args: {
      table: linksTableName,
      relationship: linkRelation,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: tableName,
      relationship: 'link',
    },
  });
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: schemaName,
        name: tableName,
      },
    },
  });
  await api.sql(sql`
    DROP TABLE ${schemaName}."${tableName}";
  `);
};
