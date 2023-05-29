import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import { DeepClient } from '../imports/client.js';
import { promiseTriggersUp, promiseTriggersDown } from '../imports/type-table.js';

const debug = Debug('deeplinks:migrations:promises');
const log = debug.extend('log');
const error = debug.extend('error');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export const up = async () => {
  log('up');

  const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
  const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
  const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
  const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
  const handleScheduleTypeId = await deep.id('@deep-foundation/core', 'HandleSchedule');
  const dockerIsolationProviderTypeId = await deep.id('@deep-foundation/core', 'DockerIsolationProvider');

  // create sql type values_operation_type upper case
  await api.sql(sql`CREATE TYPE public.values_operation_type AS ENUM ('INSERT', 'UPDATE', 'DELETE');`);
  
  // promise_links
  await api.sql(sql`CREATE TABLE IF NOT EXISTS public.promise_links (
    id bigserial PRIMARY KEY,
    promise_id bigint NOT NULL,
    old_link_id bigint,
    old_link_type_id bigint,
    old_link_from_id bigint,
    old_link_to_id bigint,
    new_link_id bigint,
    new_link_type_id bigint,
    new_link_from_id bigint,
    new_link_to_id bigint,
    selector_id bigint,
    handle_operation_id bigint NOT NULL,
    handle_operation_type_id bigint NOT NULL,
    handler_id bigint NOT NULL,
    isolation_provider_image_name text NOT NULL,
    code text NOT NULL,
    values_operation public.values_operation_type
  );`);
  await api.sql(sql`select create_btree_indexes_for_all_columns('public', 'promise_links');`);
  await api.query({
    type: 'track_table',
    args: {
      schema: 'public',
      name: 'promise_links',
    },
  });

  await api.sql(sql`CREATE OR REPLACE FUNCTION get_handle_operation_details(
    handle_operation_id bigint
    , OUT handler_id bigint
    , OUT isolation_provider_image_name text
    , OUT code text
  )
  AS $$   
  DECLARE
    supports_id bigint;
    isolation_id bigint;
    file_id bigint;
  BEGIN
    SELECT "to_id" INTO handler_id FROM "links" WHERE "id" = handle_operation_id;
    SELECT "from_id" INTO supports_id FROM "links" WHERE "id" = handler_id;
    SELECT "from_id" INTO isolation_id FROM "links" WHERE "id" = supports_id;
    SELECT "to_id" INTO file_id FROM "links" WHERE "id" = handler_id;
    SELECT "value" INTO isolation_provider_image_name FROM "strings" WHERE "link_id" = isolation_id;
    SELECT "value" INTO code FROM "strings" WHERE "link_id" = file_id;
  END; $$ LANGUAGE plpgsql;`);

  await api.sql(sql`CREATE OR REPLACE FUNCTION insert_promise(
    promise_source_id bigint,
    handle_operation_id bigint,
    handle_operation_type_id bigint,
    old_link links default null,
    new_link links default null,
    selector_id bigint default null,
    values_operation public.values_operation_type default null
  )
  RETURNS VOID AS $$   
  DECLARE
    PROMISE bigint;
    handler_id bigint;
    isolation_provider_image_name text;
    code text;
  BEGIN
    SELECT * INTO handler_id, isolation_provider_image_name, code FROM get_handle_operation_details(handle_operation_id);
    INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
    INSERT INTO links ("type_id", "from_id", "to_id") VALUES (${thenTypeId}, promise_source_id, PROMISE);
    INSERT INTO promise_links ("promise_id", "old_link_id", "old_link_type_id", "old_link_from_id", "old_link_to_id", "new_link_id", "new_link_type_id", "new_link_from_id", "new_link_to_id", "handle_operation_id", "handle_operation_type_id", "handler_id", "isolation_provider_image_name", "code", "selector_id", "values_operation") VALUES (PROMISE, old_link."id", old_link."type_id", old_link."from_id", old_link."to_id", new_link."id", new_link."type_id", new_link."from_id", new_link."to_id", handle_operation_id, handle_operation_type_id, handler_id, isolation_provider_image_name, code, selector_id, values_operation);
  END; $$ LANGUAGE plpgsql;`);
  
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__promise__insert__function() RETURNS TRIGGER AS $$ 
  DECLARE 
    PROMISE bigint;
    SELECTOR record;
    HANDLE_INSERT record;
    user_id bigint;
    hasura_session json;
  BEGIN
    FOR HANDLE_INSERT IN
      SELECT id, type_id FROM links l
      WHERE
          "from_id" = NEW."type_id"
      AND "type_id" = ${handleInsertTypeId}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = l."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      PERFORM insert_promise(NEW."id", HANDLE_INSERT."id", HANDLE_INSERT."type_id", null, NEW);
    END LOOP;

    IF (
      NEW."type_id" = ${handleScheduleTypeId}
    ) THEN
      INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
      INSERT INTO links ("type_id", "from_id", "to_id") VALUES (${thenTypeId}, NEW.from_id, PROMISE);
    END IF;

    hasura_session := current_setting('hasura.user', 't');
    user_id := hasura_session::json->>'x-hasura-user-id';

    FOR SELECTOR IN
      SELECT s.selector_id, h.id as handle_operation_id, h.type_id as handle_operation_type_id, s.query_id
      FROM selectors s, links h
      WHERE
          s.item_id = NEW."id"
      AND s.selector_id = h.from_id
      AND h.type_id = ${handleInsertTypeId}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = h."to_id" AND supports.
      id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      IF SELECTOR.query_id = 0 OR bool_exp_execute(NEW."id", SELECTOR.query_id, user_id) THEN
        PERFORM insert_promise(NEW."id", SELECTOR.handle_operation_id, SELECTOR.handle_operation_type_id, null, NEW, SELECTOR.selector_id);
      END IF;
    END LOOP;
    RETURN NEW;
  END; $$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER z_${LINKS_TABLE_NAME}__promise__insert__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__insert__function();`);
  
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__promise__update__function() RETURNS TRIGGER AS $$ 
  DECLARE 
    PROMISE bigint;
    SELECTOR record;
    HANDLE_UPDATE record;
    user_id bigint;
    hasura_session json;
  BEGIN
    FOR HANDLE_UPDATE IN
      SELECT id, type_id FROM links l
      WHERE
          "from_id" = NEW."type_id"
      AND "type_id" = ${handleUpdateTypeId} 
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = l."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      PERFORM insert_promise(NEW."id", HANDLE_UPDATE."id", HANDLE_UPDATE."type_id", OLD, NEW);
    END LOOP;

    IF (
      NEW."type_id" = ${handleScheduleTypeId}
    ) THEN
      INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
      INSERT INTO links ("type_id", "from_id", "to_id") VALUES (${thenTypeId}, NEW.from_id, PROMISE);
    END IF;

    hasura_session := current_setting('hasura.user', 't');
    user_id := hasura_session::json->>'x-hasura-user-id';

    FOR SELECTOR IN
      SELECT s.selector_id, h.id as handle_operation_id, h.type_id as handle_operation_type_id, s.query_id
      FROM selectors s, links h
      WHERE
          s.item_id = NEW."id"
      AND s.selector_id = h.from_id
      AND h.type_id = ${handleUpdateTypeId}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = h."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      IF SELECTOR.query_id = 0 OR bool_exp_execute(NEW."id", SELECTOR.query_id, user_id) THEN
        PERFORM insert_promise(NEW."id", SELECTOR.handle_operation_id, SELECTOR.handle_operation_type_id, OLD, NEW, SELECTOR.selector_id);
      END IF;
    END LOOP;
    RETURN NEW;
  END; $$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER z_${LINKS_TABLE_NAME}__promise__update__trigger AFTER UPDATE ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__update__function();`);

  const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__promise__delete__function() RETURNS TRIGGER AS $trigger$ 
  DECLARE
    PROMISE bigint;
    SELECTOR record;
    HANDLE_DELETE record;
    user_id bigint;
    hasura_session json;
    handler_id bigint;
    isolation_provider_image_name text;
    code text;
  BEGIN
    FOR HANDLE_DELETE IN
      SELECT id, type_id FROM links l
      WHERE
          "from_id" = OLD."type_id"
      AND "type_id" = ${handleDeleteTypeId} 
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = l."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      PERFORM insert_promise(OLD."id", HANDLE_DELETE."id", HANDLE_DELETE."type_id", OLD);
    END LOOP;

    hasura_session := current_setting('hasura.user', 't');
    user_id := hasura_session::json->>'x-hasura-user-id';
    
    FOR SELECTOR IN
      SELECT s.selector_id, h.id as handle_operation_id, h.type_id as handle_operation_type_id, s.query_id
      FROM selectors s, links h
      WHERE
          s.item_id = OLD."id"
      AND s.selector_id = h.from_id
      AND h.type_id = ${handleDeleteTypeId}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = h."to_id" AND supports.
      id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${dockerIsolationProviderTypeId})
    LOOP
      IF SELECTOR.query_id = 0 OR bool_exp_execute(OLD."id", SELECTOR.query_id, user_id) THEN
        PERFORM insert_promise(OLD."id", SELECTOR.handle_operation_id, SELECTOR.handle_operation_type_id, OLD, null, SELECTOR.selector_id);
      END IF;
    END LOOP;
    RETURN OLD;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__promise__delete__trigger BEFORE DELETE ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__delete__function();`);

  await (promiseTriggersUp({
    schemaName: 'public',
    tableName: 'strings',
    valueType: 'TEXT',
    customColumnsSql: 'value text',
    linkRelation: 'string',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (promiseTriggersUp({
    schemaName: 'public',
    tableName: 'numbers',
    valueType: 'float8',
    customColumnsSql: 'value bigint',
    linkRelation: 'number',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (promiseTriggersUp({
    schemaName: 'public',
    tableName: 'objects',
    valueType: 'jsonb',
    customColumnsSql: 'value jsonb',
    linkRelation: 'object',
    linksTableName: 'links',
    api,
    deep,
  })());
};

export const down = async () => {
  log('down');
  await (promiseTriggersDown({
    schemaName: 'public',
    tableName: 'strings',
    valueType: 'TEXT',
    customColumnsSql: 'value text',
    linkRelation: 'string',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (promiseTriggersDown({
    schemaName: 'public',
    tableName: 'numbers',
    valueType: 'float8',
    customColumnsSql: 'value bigint',
    linkRelation: 'number',
    linksTableName: 'links',
    api,
    deep,
  })());
  await (promiseTriggersDown({
    schemaName: 'public',
    tableName: 'objects',
    valueType: 'jsonb',
    customColumnsSql: 'value jsonb',
    linkRelation: 'object',
    linksTableName: 'links',
    api,
    deep,
  })());

  await api.sql(sql`DROP TRIGGER IF EXISTS z_${LINKS_TABLE_NAME}__promise__insert__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__promise__insert__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__promise__update__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__promise__update__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__promise__delete__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__promise__delete__function CASCADE;`);

  await api.sql(sql`DROP FUNCTION IF EXISTS get_handle_operation_details CASCADE;`);

  await api.sql(sql`DROP FUNCTION IF EXISTS insert_promise CASCADE;`);

  // promise_links
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: 'public',
        name: 'promise_links',
      },
      cascade: true,
    },
  });
  await api.sql(sql`DROP TABLE IF EXISTS "public"."promise_links" CASCADE;`);

  // drop values_operation_type in sql
  await api.sql(sql`DROP TYPE IF EXISTS values_operation_type CASCADE;`);
};
