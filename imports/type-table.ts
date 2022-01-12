import { HasuraApi } from '@deep-foundation/hasura/api';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { sql } from '@deep-foundation/hasura/sql';
import { DeepClient } from './client';
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
  deep: DeepClient;
}

export const generateUp = (options: ITypeTableStringOptions) => async () => {
  const { schemaName, tableName, valueType, customColumnsSql = '', customAfterSql = '', linkRelation, linksTableName, api, deep } = options;

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
  const { schemaName, tableName, linkRelation, linksTableName, api, deep } = options;

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

export const promiseTriggersUp = (options: ITypeTableStringOptions) => async () => {
  const { schemaName, tableName, valueType, customColumnsSql = '', customAfterSql = '', linkRelation, linksTableName, api, deep } = options;

  const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
  const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
  const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${tableName}__promise__insert__function() RETURNS TRIGGER AS $trigger$ DECLARE PROMISE bigint;
  BEGIN
    IF (
        EXISTS(
          SELECT 1
          FROM links handle_update, links updated_link
          WHERE
              updated_link.id = NEW."link_id"
          AND handle_update.from_id = updated_link."type_id"
          AND handle_update.type_id = ${handleUpdateTypeId}
        )
    ) THEN
    INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
    INSERT INTO links ("type_id","from_id","to_id") VALUES (${thenTypeId},NEW."link_id",PROMISE);
    END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${tableName}__promise__insert__trigger AFTER INSERT ON "${tableName}" FOR EACH ROW EXECUTE PROCEDURE ${tableName}__promise__insert__function();`);
};

export const promiseTriggersDown = (options: ITypeTableStringOptions) => async () => {
  const { schemaName, tableName, linkRelation, linksTableName, api, deep } = options;
  
  await api.sql(sql`DROP TRIGGER IF EXISTS ${tableName}__promise__insert__trigger ON "${tableName}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${tableName}__promise__insert__function CASCADE;`);
};