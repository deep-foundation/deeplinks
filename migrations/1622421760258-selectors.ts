import { generateApolloClient } from '@deep-foundation/hasura/client';
import { sql } from '@deep-foundation/hasura/sql';
import Debug from 'debug';
import { DeepClient } from '../imports/client';
import { api, SCHEMA } from './1616701513782-links';
import { MP_TABLE_NAME } from './1621815803572-materialized-path';
import { BOOL_EXP_TABLE_NAME } from './1622421760250-values';
import { itemReplaceSymbol, userReplaceSymbol } from '../imports/bool_exp';

const debug = Debug('deeplinks:migrations:selectors');

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
  debug('up');
  debug('view');
  await api.sql(sql`
    CREATE VIEW ${SELECTORS_TABLE_NAME} AS
    SELECT DISTINCT mp."item_id" as "item_id", selector."id" as "selector_id", (
      SELECT "to_id" FROM ${TABLE_NAME} WHERE
      "type_id" = ${await deep.id('@deep-foundation/core', 'SelectorFilter')} AND
      "from_id" = selector."id"
    ) as "bool_exp_id"
    FROM
    ${MP_TABLE_NAME} as mp,
    ${TABLE_NAME} as includeLink,
    ${TABLE_NAME} as treeLink,
    ${TABLE_NAME} as selector
    WHERE
    -- Ищем includeLink
    -- Для каждого include по селектору? нееет
    includeLink."from_id" = selector."id" AND
    includeLink."type_id" = ${await deep.id('@deep-foundation/core', 'Include')} AND
    -- Ищем все пометки НИЖЕ цели includeTo связи
    -- Как убрать дубликаты?
    mp."path_item_id" = includeLink."to_id" AND
    (
      EXISTS (
        SELECT * FROM links WHERE
        treeLink."type_id" = ${await deep.id('@deep-foundation/core', 'SelectorTree')} AND
        treeLink."from_id" = includeLink."id" AND
        treeLink."to_id" = mp."group_id"
        LIMIT 1
      ) OR NOT EXISTS (
        SELECT * FROM links WHERE
        "type_id" = ${await deep.id('@deep-foundation/core', 'SelectorTree')} AND
        "from_id" = includeLink."id"
        LIMIT 1
      )
    ) AND
    selector."type_id" = ${await deep.id('@deep-foundation/core', 'Selector')} AND
    NOT EXISTS (
      SELECT mp2.*
      FROM
      ${TABLE_NAME} as si_sr_se,
      ${TABLE_NAME} as si_sr_se_t,
      ${MP_TABLE_NAME} as mp2
      WHERE
      si_sr_se."type_id" = ${await deep.id('@deep-foundation/core', 'Exclude')} AND
      si_sr_se."from_id" = selector."id" AND
      si_sr_se_t."type_id" = ${await deep.id('@deep-foundation/core', 'SelectorTree')} AND
      si_sr_se_t."from_id" = si_sr_se."id" AND
      si_sr_se_t."to_id" = mp2."group_id" AND
      si_sr_se."to_id" = mp2."path_item_id" AND
      mp."item_id" = mp2."item_id"
    );
  `);
  await api.sql(sql`
    CREATE OR REPLACE FUNCTION bool_exp_execute(target_link_id bigint, bool_exp_link_id bigint, user_id bigint) RETURNS BOOL AS $trigger$ DECLARE
      boolExp RECORD;
      sqlResult INT;
    BEGIN
      SELECT be.* into boolExp
      FROM "${BOOL_EXP_TABLE_NAME}" as be
      WHERE be.link_id=bool_exp_link_id;
      IF boolExp IS NOT NULL THEN
        EXECUTE (SELECT REPLACE(REPLACE(boolExp.value, ${itemReplaceSymbol}::text, target_link_id::text), ${userReplaceSymbol}::text, user_id::text)) INTO sqlResult;
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
  debug('down');
  debug('view');
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
      name: BOOL_EXP_COMPUTED_FIELD,
      cascade: false,
    },
  });
  await api.sql(sql`
    DROP FUNCTION IF EXISTS bool_exp_execute CASCADE;
  `);
};