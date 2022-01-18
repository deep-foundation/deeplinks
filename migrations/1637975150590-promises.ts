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

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export const up = async () => {
  debug('up');

  const promiseTypeId = await deep.id('@deep-foundation/core', 'Promise');
  const thenTypeId = await deep.id('@deep-foundation/core', 'Then');
  const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
  const selectionTypeId = await deep.id('@deep-foundation/core', 'Include');
  
  await api.sql(sql`CREATE OR REPLACE FUNCTION links__promise__insert__function() RETURNS TRIGGER AS $trigger$ DECLARE PROMISE bigint;
  BEGIN
    IF (
        EXISTS(
          SELECT 1
          FROM links
          WHERE from_id = NEW."type_id"
          AND type_id = ${handleInsertTypeId}
        )
      --OR
      --  EXISTS(
      --    SELECT 1
      --    FROM
      --      links as selection,
      --      links as handleInsert
      --    WHERE 
      --          selection.to_id = NEW."id"
      --      AND type_id = ${selectionTypeId}
      --      AND selection.from_id = handleInsert.from_id
      --      AND handleInsert.type_id = ${handleInsertTypeId}
      --  )
    ) THEN
    INSERT INTO links ("type_id") VALUES (${promiseTypeId}) RETURNING id INTO PROMISE;
    INSERT INTO links ("type_id","from_id","to_id") VALUES (${thenTypeId},NEW."id",PROMISE);
    END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER links__promise__insert__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE links__promise__insert__function();`);
  await api.sql(sql`CREATE TRIGGER links__promise__update__trigger AFTER UPDATE ON "links" FOR EACH ROW EXECUTE PROCEDURE links__promise__insert__function();`);

  const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');

  await api.sql(sql`CREATE OR REPLACE FUNCTION links__promise__delete__function() RETURNS TRIGGER AS $trigger$ DECLARE PROMISE bigint; 
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
    INSERT INTO links ("type_id","from_id","to_id") VALUES (${thenTypeId},OLD."id",PROMISE);
    END IF;
    RETURN OLD;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER links__promise__delete__trigger BEFORE DELETE ON "links" FOR EACH ROW EXECUTE PROCEDURE links__promise__delete__function();`);

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
  debug('down');
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

  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__promise__insert__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__promise__insert__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__promise__delete__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__promise__delete__function CASCADE;`);
};
