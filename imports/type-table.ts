import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import { DeepClient } from './client.js';

export interface ITypeTableStringOptions {
  schemaName: string;
  tableName: string;
  valueType?: string;
  customColumnsSql?: string;
  customAfterSql?: string;
  linkRelation?: string;
  linksTableName?: string;
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
  if (linkRelation && linksTableName) {
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
        webhook: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/values`,
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
  }
};

export const generateDown = (options: ITypeTableStringOptions) => async () => {
  const { schemaName, tableName, linkRelation, linksTableName, api, deep } = options;

  if (linkRelation && linksTableName) await api.query({
    type: 'drop_relationship',
    args: {
      table: linksTableName,
      relationship: linkRelation,
    },
  });
  if (linkRelation && linksTableName) await api.query({
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

  const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
  const dockerIsolationProviderTypeId = await deep.id('@deep-foundation/core', 'DockerIsolationProvider');

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${tableName}__promise__insert__function() RETURNS TRIGGER AS $trigger$
  DECLARE
    PROMISE bigint;
    SELECTOR record;
    HANDLE_UPDATE record;
    user_id bigint;
    hasura_session json;
    updated_link links;
  BEGIN
    SELECT * INTO updated_link FROM links WHERE "id" = NEW."link_id";
    FOR HANDLE_UPDATE IN
      SELECT id, type_id FROM links l
      WHERE
          "from_id" = updated_link."type_id"
      AND "type_id" = ${handleUpdateTypeId} 
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = l."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      PERFORM insert_promise(updated_link."id", HANDLE_UPDATE."id", HANDLE_UPDATE."type_id", updated_link, updated_link, null, 'INSERT');
    END LOOP;

    hasura_session := current_setting('hasura.user', 't');
    user_id := hasura_session::json->>'x-hasura-user-id';
    
    FOR SELECTOR IN
      SELECT s.selector_id, h.id as handle_operation_id, h.type_id as handle_operation_type_id, s.query_id
      FROM selectors s, links h
      WHERE
          s.item_id = NEW."link_id"
      AND s.selector_id = h.from_id
      AND h.type_id = ${handleUpdateTypeId}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = h."to_id" AND supports.
      id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      IF SELECTOR.query_id = 0 OR bool_exp_execute(NEW."link_id", SELECTOR.query_id, user_id) THEN
        PERFORM insert_promise(updated_link."id", SELECTOR.handle_operation_id, SELECTOR.handle_operation_type_id, updated_link, updated_link, SELECTOR.selector_id, 'INSERT');
      END IF;
    END LOOP;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${tableName}__promise__insert__trigger AFTER INSERT ON "${tableName}" FOR EACH ROW EXECUTE PROCEDURE ${tableName}__promise__insert__function();`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${tableName}__promise__update__function() RETURNS TRIGGER AS $trigger$
  DECLARE
    PROMISE bigint;
    SELECTOR record;
    HANDLE_UPDATE record;
    user_id bigint;
    hasura_session json;
    updated_link links;
  BEGIN
    SELECT * INTO updated_link FROM links WHERE "id" = NEW."link_id";
    FOR HANDLE_UPDATE IN
      SELECT id, type_id FROM links l
      WHERE
          "from_id" = updated_link."type_id"
      AND "type_id" = ${handleUpdateTypeId} 
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = l."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      PERFORM insert_promise(updated_link."id", HANDLE_UPDATE."id", HANDLE_UPDATE."type_id", updated_link, updated_link, null, 'UPDATE');
    END LOOP;

    hasura_session := current_setting('hasura.user', 't');
    user_id := hasura_session::json->>'x-hasura-user-id';
    
    FOR SELECTOR IN
      SELECT s.selector_id, h.id as handle_operation_id, h.type_id as handle_operation_type_id, s.query_id
      FROM selectors s, links h
      WHERE
          s.item_id = NEW."link_id"
      AND s.selector_id = h.from_id
      AND h.type_id = ${handleUpdateTypeId}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = h."to_id" AND supports.
      id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      IF SELECTOR.query_id = 0 OR bool_exp_execute(NEW."link_id", SELECTOR.query_id, user_id) THEN
        PERFORM insert_promise(updated_link."id", SELECTOR.handle_operation_id, SELECTOR.handle_operation_type_id, updated_link, updated_link, SELECTOR.selector_id, 'UPDATE');
      END IF;
    END LOOP;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${tableName}__promise__update__trigger AFTER UPDATE ON "${tableName}" FOR EACH ROW EXECUTE PROCEDURE ${tableName}__promise__update__function();`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${tableName}__promise__delete__function() RETURNS TRIGGER AS $trigger$
  DECLARE
    PROMISE bigint;
    SELECTOR record;
    HANDLE_UPDATE record;
    user_id bigint;
    hasura_session json;
    updated_link links;
  BEGIN
    SELECT * INTO updated_link FROM links WHERE "id" = OLD."link_id";
    FOR HANDLE_UPDATE IN
      SELECT id, type_id FROM links l
      WHERE
          "from_id" = updated_link."type_id"
      AND "type_id" = ${handleUpdateTypeId} 
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = l."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      PERFORM insert_promise(updated_link."id", HANDLE_UPDATE."id", HANDLE_UPDATE."type_id", updated_link, updated_link, null, 'DELETE');
    END LOOP;

    hasura_session := current_setting('hasura.user', 't');
    user_id := hasura_session::json->>'x-hasura-user-id';
    
    FOR SELECTOR IN
      SELECT s.selector_id, h.id as handle_operation_id, h.type_id as handle_operation_type_id, s.query_id
      FROM selectors s, links h
      WHERE
          s.item_id = OLD."link_id"
      AND s.selector_id = h.from_id
      AND h.type_id = ${handleUpdateTypeId}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = h."to_id" AND supports.
      id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      IF SELECTOR.query_id = 0 OR bool_exp_execute(OLD."link_id", SELECTOR.query_id, user_id) THEN
        PERFORM insert_promise(updated_link."id", SELECTOR.handle_operation_id, SELECTOR.handle_operation_type_id, updated_link, updated_link, SELECTOR.selector_id, 'DELETE');
      END IF;
    END LOOP;
    RETURN OLD;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${tableName}__promise__delete__trigger BEFORE DELETE ON "${tableName}" FOR EACH ROW EXECUTE PROCEDURE ${tableName}__promise__delete__function();`);
};

export const promiseTriggersDown = (options: ITypeTableStringOptions) => async () => {
  const { schemaName, tableName, linkRelation, linksTableName, api, deep } = options;
  
  await api.sql(sql`DROP TRIGGER IF EXISTS ${tableName}__promise__insert__trigger ON "${tableName}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${tableName}__promise__insert__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${tableName}__promise__update__trigger ON "${tableName}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${tableName}__promise__update__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${tableName}__promise__delete__trigger ON "${tableName}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${tableName}__promise__delete__function CASCADE;`);
};