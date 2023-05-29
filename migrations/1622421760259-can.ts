import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { api, SCHEMA } from './1616701513782-links.js';
import { MP_TABLE_NAME } from './1621815803572-materialized-path.js';
import { SELECTORS_TABLE_NAME } from './1622421760258-selectors.js';

const debug = Debug('deeplinks:migrations:can');
const log = debug.extend('log');
const error = debug.extend('error');

export const CAN_TABLE_NAME = 'can';
export const TABLE_NAME = 'links';
export const CACHE = 'selectors_cache';
export const MP = 'mp';

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
    CREATE VIEW ${CAN_TABLE_NAME} AS
    SELECT DISTINCT ca."rule_id" as "rule_id", mpo_include."item_id" as "object_id", mps_include."item_id" as "subject_id", mpa_include."item_id" as "action_id"
    FROM
    ${CACHE} as ca,
    ${MP} as mpa_include,
    ${CACHE} as co,
    ${MP} as mpo_include,
    ${CACHE} as cs,
    ${MP} as mps_include
    WHERE (
      ca."rule_id" != 0 AND
      co."rule_id" != 0 AND
      cs."rule_id" != 0 AND

      ca."rule_id" = co."rule_id" AND
      ca."rule_id" = cs."rule_id" AND

      ca."rule_action_id" != 0 AND
      ca."selector_include_id" != 0 AND
      mpa_include."path_item_id" = ca."link_id" AND
      mpa_include."group_id" = ca."tree_id" AND
      NOT EXISTS (
        SELECT mpa_exclude."id"
        FROM
        ${CACHE} as cache_exclude,
        ${MP} as mpa_exclude
        WHERE (
          cache_exclude."selector_exclude_id" != 0 AND
          cache_exclude."selector_id" = ca."selector_id" AND
          mpa_exclude."path_item_id" = cache_exclude."link_id" AND
          mpa_exclude."item_id" = mpa_include."item_id" AND
          mpa_exclude."group_id" = cache_exclude."tree_id"
        )
      ) AND

      co."rule_object_id" != 0 AND
      co."selector_include_id" != 0 AND
      mpo_include."path_item_id" = co."link_id" AND
      mpo_include."group_id" = co."tree_id" AND
      NOT EXISTS (
        SELECT mpo_exclude."id"
        FROM
        ${CACHE} as cache_exclude,
        ${MP} as mpo_exclude
        WHERE (
          cache_exclude."selector_exclude_id" != 0 AND
          cache_exclude."selector_id" = co."selector_id" AND
          mpo_exclude."path_item_id" = cache_exclude."link_id" AND
          mpo_exclude."item_id" = mpo_include."item_id" AND
          mpo_exclude."group_id" = cache_exclude."tree_id"
        )
      ) AND

      cs."rule_subject_id" != 0 AND
      cs."selector_include_id" != 0 AND
      mps_include."path_item_id" = cs."link_id" AND
      mps_include."group_id" = cs."tree_id" AND
      NOT EXISTS (
        SELECT mps_exclude."id"
        FROM
        ${CACHE} as cache_exclude,
        ${MP} as mps_exclude
        WHERE (
          cache_exclude."selector_exclude_id" != 0 AND
          cache_exclude."selector_id" = cs."selector_id" AND
          mps_exclude."path_item_id" = cache_exclude."link_id" AND
          mps_exclude."item_id" = mps_include."item_id" AND
          mps_exclude."group_id" = cache_exclude."tree_id"
        )
      )
    );
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: CAN_TABLE_NAME,
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: CAN_TABLE_NAME,
      name: 'rule',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            rule_id: 'id',
          },
          insertion_order: 'before_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: CAN_TABLE_NAME,
      name: 'object',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            object_id: 'id',
          },
          insertion_order: 'before_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: CAN_TABLE_NAME,
      name: 'subject',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            subject_id: 'id',
          },
          insertion_order: 'before_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_object_relationship',
    args: {
      table: CAN_TABLE_NAME,
      name: 'action',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            action_id: 'id',
          },
          insertion_order: 'before_parent',
        },
      },
    },
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TABLE_NAME,
      name: 'can_object',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: CAN_TABLE_NAME,
          },
          column_mapping: {
            id: 'object_id',
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
      name: 'can_subject',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: CAN_TABLE_NAME,
          },
          column_mapping: {
            id: 'subject_id',
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
      name: 'can_action',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: CAN_TABLE_NAME,
          },
          column_mapping: {
            id: 'action_id',
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
      name: 'can_rule',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: CAN_TABLE_NAME,
          },
          column_mapping: {
            id: 'rule_id',
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
        name: CAN_TABLE_NAME,
      },
      cascade: true,
    },
  });
  await api.sql(sql`
    DROP VIEW IF EXISTS ${CAN_TABLE_NAME} CASCADE;
  `);
};