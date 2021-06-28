import { HasuraApi } from '@deepcase/hasura/api';
import { generateApolloClient } from '@deepcase/hasura/client';
import { sql } from '@deepcase/hasura/sql';
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
    ${customAfterSql}
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: schemaName,
      name: tableName,
    },
  });
  await permissions(api, tableName);
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: linksTableName,
      name: linkRelation,
      using: {
        manual_configuration: {
          remote_table: {
            schema: schemaName,
            name: tableName,
          },
          column_mapping: {
            id: 'link_id',
          },
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: tableName,
      name: 'link',
      using: {
        manual_configuration: {
          remote_table: {
            schema: schemaName,
            name: linksTableName,
          },
          column_mapping: {
            link_id: 'id',
          },
        },
      },
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
