import { generateApolloClient } from '@deep-foundation/hasura/client';
import { sql } from '@deep-foundation/hasura/sql';
import Debug from 'debug';
import { DeepClient, GLOBAL_ID_ANY } from '../imports/client';
import { api, SCHEMA } from './1616701513782-links';
import { MP_TABLE_NAME } from './1621815803572-materialized-path';
import { BOOL_EXP_TABLE_NAME } from './1622421760250-values';
import { itemReplaceSymbol, userReplaceSymbol } from '../imports/bool_exp_to_sql';

const debug = Debug('deeplinks:migrations:selectors');
const log = debug.extend('log');
const error = debug.extend('error');

export const SELECTORS_TABLE_NAME = 'selectors';
export const TABLE_NAME = 'links';
export const BOOL_EXP_COMPUTED_FIELD = `${TABLE_NAME}__exec_bool_exp__function`;

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
  log('view');
  await api.sql(sql`
    CREATE VIEW ${SELECTORS_TABLE_NAME} AS
    SELECT 
      mp_include."item_id" as "item_id",
      include_link."from_id" as "selector_id",
      include_link."id" as "selector_include_id",
      (
        SELECT "to_id" FROM ${TABLE_NAME} WHERE
        "type_id" = ${await deep.id('@deep-foundation/core', 'SelectorFilter')} AND
        "from_id" = include_link."from_id"
      ) as "bool_exp_id",
      mp_users."path_item_id" as "user_upper_id",
      seu."to_id" as "seu_id"
    FROM
      ${MP_TABLE_NAME} as mp_include
        LEFT JOIN ${MP_TABLE_NAME} as mp_users ON (
          mp_users."group_id" = mp_include."group_id" AND mp_users."item_id" = mp_include."item_id"
        )
      ,
      ${TABLE_NAME} as include_link
        LEFT JOIN ${TABLE_NAME} as seu ON (
          seu."type_id" = ${await deep.id('@deep-foundation/core','SelectorExistsUp')} AND
          seu."from_id" = include_link."id"
        )
      ,
      ${TABLE_NAME} as include_tree_link
    WHERE
      (include_link."type_id" = ${await deep.id('@deep-foundation/core','SelectorInclude')}) AND
      (mp_include."path_item_id" = include_link."to_id") AND
      (mp_include."group_id" = include_tree_link."to_id" AND
      include_tree_link."from_id" = include_link."id" AND
      include_tree_link."type_id" = ${await deep.id('@deep-foundation/core', 'SelectorTree')}) AND

      -- Не должно быть SEU который бы был !=User и при этом отсутствовал бы в mp_upper.
      -- Таким образом верно что item допустим если SEU нету, или SEU=User или (SEU!=User и имеется выше в mp_upper)
      -- Но если SEU нету, то LEFT JOIN не null потому что он всегда имеет значение из mp_upper
      (
        NOT EXISTS (
          SELECT *
          FROM
          ${TABLE_NAME} as SEU
          WHERE
          SEU."type_id" = ${await deep.id('@deep-foundation/core','SelectorExistsUp')} AND
          SEU."from_id" = include_link."id" AND
          SEU."to_id" != ${await deep.id('@deep-foundation/core','User')} AND 
          NOT EXISTS (
            SELECT *
            FROM
            ${MP_TABLE_NAME} as mp_upper
            WHERE
            mp_upper."group_id" = mp_include."group_id" AND
            mp_upper."item_id" = mp_include."item_id" AND
            mp_upper."path_item_id" = SEU."to_id"
          )
        )
      ) AND

      NOT EXISTS (
        SELECT mp_exclude."id"
        FROM
        ${TABLE_NAME} as exclude_link,
        ${TABLE_NAME} as exclude_tree_link,
        ${MP_TABLE_NAME} as mp_exclude
        WHERE
          (exclude_link."type_id" = ${await deep.id('@deep-foundation/core', 'SelectorExclude')}) AND
          (exclude_link."from_id" = include_link."from_id") AND
          (mp_exclude."item_id" = mp_include."item_id") AND 
          (mp_exclude."path_item_id" = exclude_link."to_id") AND 
          (mp_exclude."group_id" = exclude_tree_link."to_id" AND exclude_tree_link."from_id" = exclude_link."id" AND exclude_tree_link."type_id" = ${await deep.id('@deep-foundation/core', 'SelectorTree')})
      );
  `);
  await api.sql(sql`
    CREATE OR REPLACE FUNCTION bool_exp_execute(target_link_id bigint, bool_exp_link_id bigint, user_id bigint) RETURNS BOOL AS $trigger$ DECLARE
      boolExp RECORD;
      sqlResult INT;
      query TEXT;
    BEGIN
      SELECT be.* into boolExp
      FROM "${BOOL_EXP_TABLE_NAME}" as be
      WHERE be.link_id=bool_exp_link_id;
      IF boolExp IS NOT NULL THEN
        IF (user_id IS NULL) THEN
          user_id := ${GLOBAL_ID_ANY};
        END IF;
        SELECT REPLACE(REPLACE(boolExp.value, ${itemReplaceSymbol}::text, target_link_id::text), ${userReplaceSymbol}::text, user_id::text) INTO query;
        EXECUTE query INTO sqlResult;
        IF sqlResult = 0 THEN
          RETURN FALSE;
        END IF;
        RETURN TRUE;
      END IF;
      RETURN NULL;
    END; $trigger$ LANGUAGE plpgsql;
  `);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${BOOL_EXP_COMPUTED_FIELD}(link ${TABLE_NAME}, link_id bigint, hasura_session json) RETURNS SETOF links STABLE AS $function$ DECLARE
    RESULT BOOLEAN;
    user_id bigint;
  BEGIN
    user_id := hasura_session::json->>'x-hasura-user-id';
    SELECT INTO RESULT bool_exp_execute(link_id, link.id, user_id);
    IF RESULT THEN
      RETURN QUERY SELECT * FROM links WHERE id=link_id LIMIT 1;
    ELSE
      RETURN;
    END IF;
  END; $function$ LANGUAGE plpgsql;`);
  await api.query({
    type: 'add_computed_field',
    args: {
      table: TABLE_NAME,
      source: 'default',
      name: 'exec_bool_exp',
      definition:{
        function:{
          name: BOOL_EXP_COMPUTED_FIELD,
          schema: 'public',
        },
        table_argument: 'link',
        session_argument: 'hasura_session',
      }
    },
  });
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: SELECTORS_TABLE_NAME,
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: SELECTORS_TABLE_NAME,
      name: 'selector',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            selector_id: 'id',
          },
          insertion_order: 'before_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: SELECTORS_TABLE_NAME,
      name: 'item',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            item_id: 'id',
          },
          insertion_order: 'before_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: SELECTORS_TABLE_NAME,
      name: 'bool_exp',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            bool_exp_id: 'id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TABLE_NAME,
      name: 'selectors',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: SELECTORS_TABLE_NAME,
          },
          column_mapping: {
            id: 'item_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TABLE_NAME,
      name: 'selected',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: SELECTORS_TABLE_NAME,
          },
          column_mapping: {
            id: 'selector_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });
};

export const down = async () => {
  log('down');
  log('view');
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: SELECTORS_TABLE_NAME,
      },
      cascade: true,
    },
  });
  await api.sql(sql`
    DROP VIEW IF EXISTS ${SELECTORS_TABLE_NAME} CASCADE;
  `);
  await api.query({
    type: 'drop_computed_field',
    args: {
      table: TABLE_NAME,
      source: 'default',
      name: 'exec_bool_exp',
      cascade: false,
    },
  });
  await api.sql(sql`
    DROP FUNCTION IF EXISTS ${BOOL_EXP_COMPUTED_FIELD} CASCADE;
  `);
  await api.sql(sql`
    DROP FUNCTION IF EXISTS bool_exp_execute CASCADE;
  `);
};