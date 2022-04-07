import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { up as upTable, down as downTable } from '@deep-foundation/materialized-path/table';
import { up as upRels, down as downRels } from '@deep-foundation/materialized-path/relationships';
import { Trigger } from '@deep-foundation/materialized-path/trigger';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { permissions } from '../imports/permission';
import { sql } from '@deep-foundation/hasura/sql';
import { DeepClient } from '../imports/client';
import { promiseTriggersUp, promiseTriggersDown } from '../imports/type-table';

const debug = Debug('deeplinks:migrations:promises');
const log = debug.extend('log');
const error = debug.extend('error');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
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
  const handleScheduleTypeId = await deep.id('@deep-foundation/core', 'HandleSchedule');
  const selectionTypeId = await deep.id('@deep-foundation/core', 'SelectorInclude');

  await api.sql(sql`CREATE TABLE IF NOT EXISTS public.promise_selectors (id bigserial PRIMARY KEY, promise_id bigint, item_id bigint, selector_id bigint, handle_operation_id bigint);`);
  await api.sql(sql`select create_btree_indexes_for_all_columns('public', 'promise_selectors');`);
  await api.query({
    type: 'track_table',
    args: {
      schema: 'public',
      name: 'promise_selectors',
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: 'promise_selectors',
      name: 'handle_operation',
      type: 'one_to_one',
      using: {
        manual_configuration: {
          remote_table: {
            schema: 'public',
            name: 'links',
          },
          column_mapping: {
            handle_operation_id: 'id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.sql(sql`CREATE TABLE IF NOT EXISTS public.debug_output (promises bigint, new_id bigint);`);
  await api.query({
    type: 'track_table',
    args: {
      schema: 'public',
      name: 'debug_output',
    },
  });

  await api.sql(sql`CREATE OR REPLACE FUNCTION create_promises_for_inserted_link(link "links") RETURNS boolean AS $function$   
  DECLARE 
    PROMISE bigint;
    PROMISES bigint;
    SELECTOR record;
    user_id bigint;
    hasura_session json;
  BEGIN
    IF (
        EXISTS(
          SELECT 1
          FROM links
          WHERE from_id = link."type_id"
          AND type_id = ${handleInsertTypeId}
        )
    ) THEN
    INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
    INSERT INTO links ("type_id", "from_id", "to_id") VALUES (${thenTypeId}, link."id", PROMISE);
    END IF;
    IF (
      link."type_id" = ${handleScheduleTypeId}
    ) THEN
    INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
    INSERT INTO links ("type_id", "from_id", "to_id") VALUES (${thenTypeId}, link.from_id, PROMISE);
    END IF;

    hasura_session := current_setting('hasura.user', 't');
    user_id := hasura_session::json->>'x-hasura-user-id';
    
    FOR SELECTOR IN
      SELECT s.selector_id, h.id as handle_operation_id, s.bool_exp_id
      FROM selectors s, links h
      WHERE
          s.item_id = link."id"
      AND s.selector_id = h.from_id
      AND h.type_id = ${handleInsertTypeId}
    LOOP
      INSERT INTO debug_output ("promises", "new_id") VALUES (SELECTOR.bool_exp_id, link."id");
      IF SELECTOR.bool_exp_id IS NULL OR bool_exp_execute(link."id", SELECTOR.bool_exp_id, user_id) THEN
        INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
        INSERT INTO links ("type_id", "from_id", "to_id") VALUES (${thenTypeId}, link."id", PROMISE);
        INSERT INTO promise_selectors ("promise_id", "item_id", "selector_id", "handle_operation_id") VALUES (PROMISE, link."id", SELECTOR.selector_id, SELECTOR.handle_operation_id);
      END IF;
    END LOOP;
    RETURN TRUE;
  END; $function$ LANGUAGE plpgsql;`);
  
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__promise__insert__function() RETURNS TRIGGER AS $trigger$ 
  DECLARE 
  BEGIN
    PERFORM create_promises_for_inserted_link(NEW);
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER z_${LINKS_TABLE_NAME}__promise__insert__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__insert__function();`);

  const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__promise__delete__function() RETURNS TRIGGER AS $trigger$ DECLARE PROMISE bigint; 
  BEGIN
    IF (
        EXISTS(
          SELECT 1
          FROM links
          WHERE from_id = OLD."type_id"
          AND type_id = ${handleDeleteTypeId}
        )
      --OR
      --  EXISTS(
      --    SELECT 1
      --    FROM
      --      links as selection,
      --      links as handleInsert
      --    WHERE 
      --          selection.to_id = OLD."id"
      --      AND type_id = ${selectionTypeId}
      --      AND selection.from_id = handleInsert.from_id
      --      AND handleInsert.type_id = ${handleDeleteTypeId}
      --  )
    ) THEN
    INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
    INSERT INTO links ("type_id", "from_id", "to_id") VALUES (${thenTypeId},OLD."id", PROMISE);
    END IF;
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
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__promise__delete__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__promise__delete__function CASCADE;`);

  await api.sql(sql`DROP FUNCTION IF EXISTS create_promises_for_inserted_link CASCADE;`);
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: 'public',
        name: 'debug_output',
      },
      cascade: true,
    },
  });
  await api.sql(sql`DROP TABLE IF EXISTS "public"."debug_output" CASCADE;`);
  await api.query({
    type: 'drop_relationship',
    args: {
      table: 'promise_selectors',
      relationship: 'handle_operation',
    },
  });
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: 'public',
        name: 'promise_selectors',
      },
      cascade: true,
    },
  });
  await api.sql(sql`DROP TABLE IF EXISTS "public"."promise_selectors" CASCADE;`);
};
