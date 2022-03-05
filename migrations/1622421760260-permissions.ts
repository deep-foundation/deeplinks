import { sql } from '@deep-foundation/hasura/sql';
import Debug from 'debug';
import { generateDown, generateUp } from '../imports/type-table';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { MP_TABLE_NAME } from './1621815803572-materialized-path';
import { permissions } from '../imports/permission';
import { DeepClient, GLOBAL_ID_ANY } from '../imports/client';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { SELECTORS_TABLE_NAME } from './1622421760258-selectors';
import { CAN_TABLE_NAME } from './1622421760259-can';
import { BOOL_EXP_TABLE_NAME } from './1622421760250-values';

const debug = Debug('deeplinks:migrations:permissions');
const log = debug.extend('log');
const error = debug.extend('error');

export const TABLE_NAME = 'links';
export const REPLACE_PATTERN_ID = '777777777777';

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
  log('hasura permissions');
  const linksPermissions = async (self, subjectId: any = 'X-Hasura-User-Id', role: string) => ({
    role,
    select: {
      _or: [
        {
          can_object: {
            action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowSelect') },
            subject_id: { _eq: subjectId },
          },
        },
        {
          _exists: {
            _table: 'links',
            _where: {
              type_id: { _eq: await deep.id('@deep-foundation/core', 'Contain') },
              from_id: { _eq: await deep.id('@deep-foundation/core', 'system') },
              string: { value: { _eq: 'admin' } },
              to_id: { _eq: subjectId },
            },
          },
        },
      ],
    },
    insert: {
      type: {},
      _or: [
        {
          type: {
            can_object: {
              action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowInsert') },
              subject_id: { _eq: subjectId },
            },
          },
        },
        {
          _exists: {
            _table: 'links',
            _where: {
              type_id: { _eq: await deep.id('@deep-foundation/core', 'Contain') },
              from_id: { _eq: await deep.id('@deep-foundation/core', 'system') },
              string: { value: { _eq: 'admin' } },
              to_id: { _eq: subjectId },
            },
          },
        },
      ]
    },
    update: {
      _or: [
        {
          type: {
            can_object: {
              action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowUpdate') },
              subject_id: { _eq: subjectId },
            },
          },
        },
        {
          _exists: {
            _table: 'links',
            _where: {
              type_id: { _eq: await deep.id('@deep-foundation/core', 'Contain') },
              from_id: { _eq: await deep.id('@deep-foundation/core', 'system') },
              string: { value: { _eq: 'admin' } },
              to_id: { _eq: subjectId },
            },
          },
        },
      ]
    },
    delete: {
      _or: [
        {
          type: {
            can_object: {
              action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowDelete') },
              subject_id: { _eq: subjectId },
              _or: [
                { subject_id: { _eq: subjectId } },
              ],
            },
          },
        },
        {
          _exists: {
            _table: 'links',
            _where: {
              type_id: { _eq: await deep.id('@deep-foundation/core', 'Contain') },
              from_id: { _eq: await deep.id('@deep-foundation/core', 'system') },
              string: { value: { _eq: 'admin' } },
              to_id: { _eq: subjectId },
            },
          },
        },
      ]
    },

    columns: ['id','from_id','to_id','type_id'],
    computed_fields: ['value'],
  });
  await permissions(api, MP_TABLE_NAME, {
    role: 'link',
  
    select: {},
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, MP_TABLE_NAME, {
    role: 'undefined',
  
    select: {},
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, CAN_TABLE_NAME, {
    role: 'link',
  
    select: {},
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, CAN_TABLE_NAME, {
    role: 'undefined',
  
    select: {},
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, SELECTORS_TABLE_NAME, {
    role: 'link',
  
    select: {},
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, SELECTORS_TABLE_NAME, {
    role: 'undefined',
  
    select: {},
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await (async () => {
    await permissions(api, LINKS_TABLE_NAME, (await linksPermissions(['$','id'], 'X-Hasura-User-Id', 'link')));
    const valuesPermissions = {
      ...(await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')),
      select: {
        link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
      },
      insert: {
        link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).insert,
      },
      update: {
        link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).update,
      },
      delete: {
        link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).delete,
      },
      
      columns: ['id','link_id','value'],
      computed_fields: [],
    };
    await permissions(api, 'strings', valuesPermissions);
    await permissions(api, 'numbers', valuesPermissions);
    await permissions(api, 'objects', valuesPermissions);
  })();
  await (async () => {
    await permissions(api, LINKS_TABLE_NAME, (await linksPermissions(['$','id'], GLOBAL_ID_ANY, 'undefined')));
    const valuesPermissions = {
      ...(await linksPermissions(['$','link_id'], GLOBAL_ID_ANY, 'undefined')),
      select: {
        link: (await linksPermissions(['$','link_id'], GLOBAL_ID_ANY, 'undefined')).select,
      },
      insert: {
        link: (await linksPermissions(['$','link_id'], GLOBAL_ID_ANY, 'undefined')).insert,
      },
      update: {
        link: (await linksPermissions(['$','link_id'], GLOBAL_ID_ANY, 'undefined')).update,
      },
      delete: {
        link: (await linksPermissions(['$','link_id'], GLOBAL_ID_ANY, 'undefined')).delete,
      },

      columns: ['id','link_id','value'],
      computed_fields: [],
    };
    await permissions(api, 'strings', valuesPermissions);
    await permissions(api, 'numbers', valuesPermissions);
    await permissions(api, 'objects', valuesPermissions);
  })();
  log('postgresql triggers');
  log('insert');
  await api.sql(sql`
    CREATE OR REPLACE FUNCTION public.${TABLE_NAME}__permissions__insert_links__function()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
      DECLARE
        boolExp RECORD;
        typeLink RECORD;
        fromLink RECORD;
        toLink RECORD;
        sqlResult INT;
      BEGIN
        IF (NEW."from_id" != NEW."to_id" AND (NEW."from_id" = 0 OR NEW."to_id" = 0)) THEN
          RAISE EXCEPTION 'Particular links is not allowed id: %, from: %, to: %, type: %.', NEW."id", NEW."from_id", NEW."to_id", NEW."type_id";
        END IF;

        SELECT t.* into typeLink
        FROM "${TABLE_NAME}" as t
        WHERE t."id" = NEW."type_id";

        SELECT t.* into fromLink
        FROM "${TABLE_NAME}" as t
        WHERE t."id" = NEW."from_id";

        SELECT t.* into toLink
        FROM "${TABLE_NAME}" as t
        WHERE t."id" = NEW."to_id";

        IF (NEW."from_id" != 0 AND NEW."to_id" != 0) THEN
          IF (typeLink."from_id" != ${GLOBAL_ID_ANY} AND typeLink."from_id" != fromLink."type_id") THEN
            RAISE EXCEPTION 'Type conflict link: { id: %, type: %, from: %, to: % } expected type: { type: %, from: %, to: % } received type: { type: %, from: %, to: % }',
              NEW."id", NEW."type_id", NEW."from_id", NEW."to_id",
              typeLink."id", typeLink."from_id", typeLink."to_id",
              typeLink."id", fromLink."type_id", toLink."type_id"
            ;
          END IF;
          IF (typeLink."to_id" != ${GLOBAL_ID_ANY} AND typeLink."to_id" != toLink."type_id") THEN
            RAISE EXCEPTION 'Type conflict link: { id: %, type: %, from: %, to: % } expected type: { type: %, from: %, to: % } received type: { type: %, from: %, to: % }',
              NEW."id", NEW."type_id", NEW."from_id", NEW."to_id",
              typeLink."id", typeLink."from_id", typeLink."to_id",
              typeLink."id", fromLink."type_id", toLink."type_id"
            ;
          END IF;
        END IF;

        SELECT be.* into boolExp
        FROM "${TABLE_NAME}" as allow, "${BOOL_EXP_TABLE_NAME}" as be
        WHERE allow.type_id=19 AND allow.from_id=NEW.type_id AND allow.to_id=16 AND be.link_id=allow.id;
        IF boolExp IS NOT NULL THEN
          EXECUTE (SELECT REPLACE(boolExp.sql, '${REPLACE_PATTERN_ID}', NEW.id::text)) INTO sqlResult;
          IF sqlResult = 0 THEN
            RAISE EXCEPTION 'dc dg mp reject insert because bool_exp: % gql: %', boolExp.id, boolExp.gql;
          END IF;
        END IF;
        RETURN NEW;
      END;
    $function$;
    CREATE TRIGGER ${TABLE_NAME}__permissions__insert_links__trigger AFTER INSERT ON "${TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${TABLE_NAME}__permissions__insert_links__function();
  `);
  log('delete');
  await api.sql(sql`
    CREATE OR REPLACE FUNCTION public.${TABLE_NAME}__permissions__delete_links__function()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
      DECLARE
        boolExp RECORD;
        sqlResult INT;
      BEGIN
        SELECT be.* into boolExp
        FROM "${TABLE_NAME}" as allow, "${BOOL_EXP_TABLE_NAME}" as be
        WHERE allow.type_id=19 AND allow.from_id=OLD.type_id AND allow.to_id=18 AND be.link_id=allow.id;
        IF boolExp IS NOT NULL THEN
          EXECUTE (SELECT REPLACE(boolExp.sql, '${REPLACE_PATTERN_ID}', OLD.id::text)) INTO sqlResult;
          IF sqlResult = 0 THEN
            RAISE EXCEPTION 'dc dg mp reject delete because bool_exp: % gql: %', boolExp.id, boolExp.gql;
          END IF;
        END IF;
        RETURN OLD;
      END;
    $function$;
    CREATE TRIGGER ${TABLE_NAME}__permissions__delete_links__trigger BEFORE DELETE ON "${TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${TABLE_NAME}__permissions__delete_links__function();
  `);
};

export const down = async () => {
  log('down');
  log('insert');
  await api.sql(sql`
    DROP TRIGGER IF EXISTS ${TABLE_NAME}__permissions__insert_links__trigger ON ${TABLE_NAME} CASCADE;
    DROP FUNCTION IF EXISTS ${TABLE_NAME}__permissions__insert_links__function() CASCADE;
  `);
  log('delete');
  await api.sql(sql`
    DROP TRIGGER IF EXISTS ${TABLE_NAME}__permissions__delete_links__trigger ON ${TABLE_NAME} CASCADE;
    DROP FUNCTION IF EXISTS ${TABLE_NAME}__permissions__delete_links__function() CASCADE;
  `);
};