import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';
import { DeepClient, _ids } from '../imports/client.js';
import { permissions } from '../imports/permission.js';
import { api, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
import { MP_TABLE_NAME, TREE_TABLE_NAME } from './1621815803572-materialized-path.js';
import { SELECTORS_TABLE_NAME } from './1622421760258-selectors.js';
import { CAN_TABLE_NAME } from './1622421760259-can.js';

const debug = Debug('deeplinks:migrations:permissions');
const log = debug.extend('log');
const error = debug.extend('error');

export const TABLE_NAME = 'links';
export const REPLACE_PATTERN_ID = '777777777777';

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export const isAdminBoolExp = async (subjectId = 'X-Hasura-User-Id') => ({
  "_table": {
    "schema": "public",
    "name": "can"
  },
  _where: {
    object_id: { _eq: subjectId },
    subject_id: { _eq: subjectId },
    action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowAdmin') },
  },
});

export const linksPermissions = async (self, subjectId: any = 'X-Hasura-User-Id', role: string) => ({
  role,
  select: {
    _or: [
      {
        type: {
          can_object: {
            action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowSelectType') },
            subject_id: { _eq: subjectId },
          },
        }
      },
      {
        can_object: {
          action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowSelect') },
          subject_id: { _eq: subjectId },
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
            action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowInsertType') },
            subject_id: { _eq: subjectId },
          },
        },
      },
    ]
  },
  update: {
    _or: [
      {
        can_object: {
          action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowUpdate') },
          subject_id: { _eq: subjectId },
        },
      },
      {
        type: {
          can_object: {
            action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowUpdateType') },
            subject_id: { _eq: subjectId },
          },
        },
      },
    ]
  },
  delete: {
    _or: [
      {
        can_object: {
          action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowDelete') },
          subject_id: { _eq: subjectId },
        },
      },
      {
        type: {
          can_object: {
            action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowDeleteType') },
            subject_id: { _eq: subjectId },
          },
        },
      },
    ]
  },

  columns: ['id','from_id','to_id','type_id'],
  computed_fields: ['value'],
});

export const up = async () => {
  log('up');
  log('hasura permissions');

  // const isAdminBoolExp = { _by_item: {
  //   group_id: { _eq: await deep.id('@deep-foundation/core', 'joinTree') },
  //   path_item: {
  //     to: {
  //       type_id: { _eq: await deep.id('@deep-foundation/core', 'Contain') },
  //       from_id: { _eq: await deep.id('deep') },
  //       string: { value: { _eq: "admin" } },
  //     }
  //   }
  // } };
  // const isAdminBoolExp = async (subjectId = 'X-Hasura-User-Id') => ({
  //   object_id: { _eq: subjectId },
  //   subject_id: { _eq: subjectId },
  //   action_id: { _eq: await deep.id('@deep-foundation/core', 'AllowAdmin') },
  // });
  await permissions(api, MP_TABLE_NAME, {
    role: 'link',

    select: {
      _and: [
        {
          item: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
        },
        {
          path_item: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
        },
      ]
    },
    insert: {
      id: { _is_null: true }
    },
    update: {
      id: { _is_null: true }
    },
    delete: {
      id: { _is_null: true }
    },

    columns: '*',
    computed_fields: [],
  });
  await permissions(api, MP_TABLE_NAME, {
    role: 'undefined',

    select: {
      id: { _is_null: true },
    },
    insert: {
      id: { _is_null: true }
    },
    update: {
      id: { _is_null: true }
    },
    delete: {
      id: { _is_null: true }
    },

    columns: '*',
    computed_fields: [],
  });
  await permissions(api, TREE_TABLE_NAME, {
    role: 'link',

    select: {
      _and: [
        {
          link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
        },
        {
          parent: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
        },
      ]
    },
    insert: {
      id: { _is_null: true }
    },
    update: {
      id: { _is_null: true }
    },
    delete: {
      id: { _is_null: true }
    },

    columns: '*',
    computed_fields: [],
  });
  await permissions(api, TREE_TABLE_NAME, {
    role: 'undefined',

    select: {
      id: { _is_null: true },
    },
    insert: {
      id: { _is_null: true }
    },
    update: {
      id: { _is_null: true }
    },
    delete: {
      id: { _is_null: true }
    },

    columns: '*',
    computed_fields: [],
  });
  await permissions(api, CAN_TABLE_NAME, {
    role: 'link',

    select: {
      // _and: [
      //   {
      //     subject: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
      //   },
      //   {
      //     object: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
      //   },
      //   {
      //     action: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
      //   },
      //   {
      //     rule: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
      //   },
      // ]
    },
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, CAN_TABLE_NAME, {
    role: 'undefined',
  
    select: {
      object_id: { _is_null: true },
      subject_id: { _is_null: true },
      action_id: { _is_null: true },
      rule_id: { _is_null: true },
    },
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, SELECTORS_TABLE_NAME, {
    role: 'link',
  
    select: {
      _and: [
        {
          selector: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
        },
        {
          item: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
        },
      ]
    },
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, SELECTORS_TABLE_NAME, {
    role: 'undefined',
  
    select: {
      selector_id: { _is_null: true },
      item_id: { _is_null: true },
    },
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
    await permissions(api, LINKS_TABLE_NAME, (await linksPermissions(['$','id'], _ids?.['@deep-foundation/core']?.Any, 'undefined')));
    const valuesPermissions = {
      ...(await linksPermissions(['$','link_id'], _ids?.['@deep-foundation/core']?.Any, 'undefined')),
      select: {
        link: (await linksPermissions(['$','link_id'], _ids?.['@deep-foundation/core']?.Any, 'undefined')).select,
      },
      insert: {
        link: (await linksPermissions(['$','link_id'], _ids?.['@deep-foundation/core']?.Any, 'undefined')).insert,
      },
      update: {
        link: (await linksPermissions(['$','link_id'], _ids?.['@deep-foundation/core']?.Any, 'undefined')).update,
      },
      delete: {
        link: (await linksPermissions(['$','link_id'], _ids?.['@deep-foundation/core']?.Any, 'undefined')).delete,
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
        sqlResult BOOL;
        session_variables json;
        user_id bigint;
        userRole TEXT;
        foundedBoolExpError RECORD;
        foundedNotErroredBoolExp BOOL = FALSE;
      BEGIN
        session_variables := current_setting('hasura.user', 't');
        IF session_variables IS NULL THEN
          session_variables := ('{ "x-hasura-role": "link", "x-hasura-user-id": "${await deep.id('@deep-foundation/core', 'Any')}" }')::json;
        END IF;
        user_id := (session_variables::json->>'x-hasura-user-id')::bigint;
        userRole := (session_variables::json->>'x-hasura-role')::text;

        IF (NEW."from_id" != NEW."to_id" AND (NEW."from_id" = 0 OR NEW."to_id" = 0)) THEN
          RAISE EXCEPTION 'Particular links is not allowed id: %, from: %, to: %, type: %.', NEW."id", NEW."from_id", NEW."to_id", NEW."type_id";
        END IF;

        SELECT t.* into typeLink
        FROM "${TABLE_NAME}" as t
        WHERE t."id" = NEW."type_id";

        IF (typeLink IS NULL AND NOT (NEW."type_id" = 0 AND userRole = 'admin')) THEN
          RAISE EXCEPTION 'Type % not founded.', NEW."type_id";
        END IF;

        SELECT t.* into fromLink
        FROM "${TABLE_NAME}" as t
        WHERE t."id" = NEW."from_id";

        SELECT t.* into toLink
        FROM "${TABLE_NAME}" as t
        WHERE t."id" = NEW."to_id";

        IF (NEW."from_id" != 0 AND NEW."to_id" != 0) THEN
          IF (typeLink."from_id" != ${_ids?.['@deep-foundation/core']?.Any} AND typeLink."from_id" != fromLink."type_id") THEN
            RAISE EXCEPTION 'Type conflict link: { id: %, type: %, from: %, to: % } expected type: { type: %, from: %, to: % } received type: { type: %, from: %, to: % }',
              NEW."id", NEW."type_id", NEW."from_id", NEW."to_id",
              typeLink."id", typeLink."from_id", typeLink."to_id",
              typeLink."id", fromLink."type_id", toLink."type_id"
            ;
          END IF;
          IF (typeLink."to_id" != ${_ids?.['@deep-foundation/core']?.Any} AND typeLink."to_id" != toLink."type_id") THEN
            RAISE EXCEPTION 'Type conflict link: { id: %, type: %, from: %, to: % } expected type: { type: %, from: %, to: % } received type: { type: %, from: %, to: % }',
              NEW."id", NEW."type_id", NEW."from_id", NEW."to_id",
              typeLink."id", typeLink."from_id", typeLink."to_id",
              typeLink."id", fromLink."type_id", toLink."type_id"
            ;
          END IF;
        END IF;

        IF user_id IS NOT NULL AND userRole = 'link' THEN
          FOR boolExp
          IN (
            SELECT sr.*
            FROM
            "${CAN_TABLE_NAME}" as can,
            "${TABLE_NAME}" as ro,
            "${SELECTORS_TABLE_NAME}" as sr
            WHERE
            can."object_id" = NEW."type_id" AND
            can."subject_id" = user_id AND
            can."action_id" = ${await deep.id('@deep-foundation/core', 'AllowInsertType')} AND
            ro."type_id" = ${await deep.id('@deep-foundation/core', 'RuleObject')} AND
            ro."from_id" = can."rule_id" AND
            sr."selector_id" = ro."to_id" AND
            sr."item_id" = NEW."type_id" AND
            sr."query_id" != 0
          )
          LOOP
            SELECT INTO sqlResult bool_exp_execute(NEW.id, boolExp."query_id", user_id);
            IF (sqlResult = FALSE) THEN
              foundedBoolExpError := boolExp;
            END IF;
            IF (sqlResult IS NULL) THEN
              RAISE EXCEPTION 'insert % rejected because selector_id: % query_id: % user_id: % return null', json_agg(NEW), boolExp."selector_id", boolExp."query_id", user_id;
            END IF;
            IF (sqlResult = TRUE) THEN
              foundedNotErroredBoolExp := TRUE;
            END IF;
          END LOOP;
        END IF;

        IF foundedBoolExpError IS NOT NULL AND foundedNotErroredBoolExp = FALSE THEN
          RAISE EXCEPTION 'insert % rejected because selector_id: % query_id: % user_id: % return false', json_agg(NEW), foundedBoolExpError."selector_id", foundedBoolExpError."query_id", user_id;
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
        sqlResult BOOL;
        session_variables json;
        user_id bigint;
        userRole TEXT;
        foundedBoolExpError RECORD;
        foundedNotErroredBoolExp BOOL = FALSE;
      BEGIN

      session_variables := current_setting('hasura.user', 't');
      IF session_variables IS NULL THEN
        session_variables := ('{ "x-hasura-role": "link", "x-hasura-user-id": "${await deep.id('@deep-foundation/core', 'Any')}" }')::json;
      END IF;
      user_id := (session_variables::json->>'x-hasura-user-id')::bigint;
      userRole := (session_variables::json->>'x-hasura-role')::text;

      IF user_id IS NOT NULL AND userRole = 'link' THEN
        FOR boolExp
        IN (
          SELECT sr.*
          FROM
          "${CAN_TABLE_NAME}" as can,
          "${TABLE_NAME}" as ro,
          "${SELECTORS_TABLE_NAME}" as sr
          WHERE
          can."object_id" = OLD."type_id" AND
          can."subject_id" = user_id AND
          can."action_id" = ${await deep.id('@deep-foundation/core', 'AllowDeleteType')} AND
          ro."type_id" = ${await deep.id('@deep-foundation/core', 'RuleObject')} AND
          ro."from_id" = can."rule_id" AND
          sr."selector_id" = ro."to_id" AND
          sr."item_id" = OLD."type_id" AND
          sr."query_id" IS NOT NULL AND
          sr."query_id" != 0
        )
        LOOP
          SELECT INTO sqlResult bool_exp_execute(OLD.id, boolExp."query_id", user_id);
          IF (sqlResult = FALSE) THEN
            foundedBoolExpError := boolExp;
          END IF;
          IF (sqlResult IS NULL) THEN
            RAISE EXCEPTION 'delete % rejected because selector_id: % query_id: % user_id: % return null', json_agg(OLD), boolExp."selector_id", boolExp."query_id", user_id;
          END IF;
          IF (sqlResult = TRUE) THEN
            foundedNotErroredBoolExp := TRUE;
          END IF;
        END LOOP;
      END IF;

      IF foundedBoolExpError IS NOT NULL AND foundedNotErroredBoolExp = FALSE THEN
        RAISE EXCEPTION 'delete % rejected because selector_id: % query_id: % user_id: % return false', json_agg(OLD), foundedBoolExpError."selector_id", foundedBoolExpError."query_id", user_id;
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