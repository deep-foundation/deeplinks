import { generateApolloClient } from '@deep-foundation/hasura/client';
import { sql } from '@deep-foundation/hasura/sql';
import Debug from 'debug';
import { DeepClient } from '../imports/client';
import { api, SCHEMA } from './1616701513782-links';
import { MP_TABLE_NAME } from './1621815803572-materialized-path';
import { SELECTORS_TABLE_NAME } from './1622421760258-selectors';

const debug = Debug('deeplinks:migrations:can');
const log = debug.extend('log');
const error = debug.extend('error');

export const CAN_TABLE_NAME = 'can';
export const TABLE_NAME = 'links';

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
    CREATE VIEW ${CAN_TABLE_NAME} AS
    SELECT DISTINCT r."id" as "rule_id", sr_o."item_id" as "object_id", sr_o_ex_up."to_id" as "object_exists_up_id", sr_s."item_id" as "subject_id", sr_a."item_id" as "action_id"
    FROM
    ${TABLE_NAME} as r,
    ${TABLE_NAME} as o,
    ${SELECTORS_TABLE_NAME} as sr_o,
    ${TABLE_NAME} as sr_o_ex_up, -- ANY OR REALY IDS
    ${TABLE_NAME} as s,
    ${SELECTORS_TABLE_NAME} as sr_s,
    ${TABLE_NAME} as a,
    ${SELECTORS_TABLE_NAME} as sr_a
    WHERE
    r."type_id" = ${await deep.id('@deep-foundation/core', 'Rule')} AND
    o."type_id" = ${await deep.id('@deep-foundation/core', 'RuleObject')} AND
    o."from_id" = r."id" AND
    (o."to_id" = sr_o."selector_id" OR o."to_id" = ${await deep.id('@deep-foundation/core', 'Any')}) AND

    (
      (
        sr_o_ex_up."type_id" = ${await deep.id('@deep-foundation/core', 'SelectorExistsUp')} AND
        sr_o_ex_up."from_id" = sr_o."selector_include_id"
      ) OR (
        sr_o_ex_up."type_id" = ${await deep.id('@deep-foundation/core', 'Contain')} AND
        sr_o_ex_up."from_id" = ${await deep.id('@deep-foundation/core')} AND
        sr_o_ex_up."to_id" = ${await deep.id('@deep-foundation/core', 'Any')}
      )
    ) AND

    s."type_id" = ${await deep.id('@deep-foundation/core', 'RuleSubject')} AND
    s."from_id" = r."id" AND
    (s."to_id" = sr_s."selector_id" OR s."to_id" = ${await deep.id('@deep-foundation/core', 'Any')}) AND

    a."type_id" = ${await deep.id('@deep-foundation/core', 'RuleAction')} AND
    a."from_id" = r."id" AND
    (a."to_id" = sr_a."selector_id" OR a."to_id" = ${await deep.id('@deep-foundation/core', 'Any')})
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
    type: 'create_object_relationship',
    args: {
      table: CAN_TABLE_NAME,
      name: 'object_exists_up',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TABLE_NAME,
          },
          column_mapping: {
            object_exists_up_id: 'id',
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