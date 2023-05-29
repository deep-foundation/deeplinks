import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';
import { itemReplaceSymbol, userReplaceSymbol } from '../imports/bool_exp_to_sql.js';
import { DeepClient, _ids } from '../imports/client.js';
import { api, SCHEMA } from './1616701513782-links.js';
import { MP_TABLE_NAME } from './1621815803572-materialized-path.js';
import { BOOL_EXP_TABLE_NAME } from './1622421760250-values.js';

const debug = Debug('deeplinks:migrations:selectors');
const log = debug.extend('log');
const error = debug.extend('error');

export const SELECTORS_TABLE_NAME = 'selectors';
export const TABLE_NAME = 'links';
export const CACHE = 'selectors_cache';
export const BOOL_EXP_COMPUTED_FIELD = `${TABLE_NAME}__exec_bool_exp__function`;

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
  log('view');
  await api.sql(sql`
    CREATE VIEW ${SELECTORS_TABLE_NAME} AS
    SELECT 
      mp_include."item_id" as "item_id",
      cache_include."selector_id" as "selector_id",
      cache_include."selector_include_id" as "selector_include_id",
      cache_include."selector_filter_bool_exp_id" as "query_id"
    FROM
      ${MP_TABLE_NAME} as mp_include,
      ${CACHE} as cache_include
    WHERE
      cache_include."selector_include_id" != 0 AND
      mp_include."path_item_id" = cache_include."link_id" AND
      mp_include."group_id" = cache_include."tree_id" AND
      NOT EXISTS (
        SELECT mp_exclude."id"
        FROM
        ${CACHE} as cache_exclude,
        ${MP_TABLE_NAME} as mp_exclude
        WHERE (
          cache_exclude."selector_exclude_id" != 0 AND
          cache_exclude."selector_id" = cache_include."selector_id" AND
          mp_exclude."path_item_id" = cache_exclude."link_id" AND
          mp_exclude."item_id" = mp_include."item_id" AND
          mp_exclude."group_id" = cache_exclude."tree_id"
        )
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
          user_id := ${_ids?.['@deep-foundation/core']?.Any};
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
      name: 'query',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            query_id: 'id',
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