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

const debug = Debug('deeplinks:migrations:demo');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
});

let i = 0;
const insertRule = async (admin, options: {
  subject: any;
  object: any;
  action: any;
}) => {
  i++;
  const { data: [{ id: ruleId }] } = await admin.insert({
    type_id: await admin.id('@deep-foundation/core', 'Rule'),
    out: { data: [
      {
        type_id: await admin.id('@deep-foundation/core', 'RuleSubject'),
        to: { data: {
          type_id: await admin.id('@deep-foundation/core', 'Selector'),
          out: { data: options.subject },
        } }
      },
      {
        type_id: await admin.id('@deep-foundation/core', 'RuleObject'),
        to: { data: {
          type_id: await admin.id('@deep-foundation/core', 'Selector'),
          out: { data: options.object },
        } }
      },
      {
        type_id: await admin.id('@deep-foundation/core', 'RuleAction'),
        to: { data: {
          type_id: await admin.id('@deep-foundation/core', 'Selector'),
          out: { data: options.action },
        } }
      },
    ] },
  });
};

export const up = async () => {
  debug('up');

  const { linkId, token } = await deep.jwt({ linkId: await deep.id('@deep-foundation/core', 'system', 'admin') });
  const admin = new DeepClient({ deep, token, linkId });

  const usersWhere = {
    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    to_id: await deep.id('@deep-foundation/core', 'system', 'users'),
    out: { data: {
      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
      to_id: await deep.id('@deep-foundation/core', 'containTree'),
    } },
  };
  const adminWhere = {
    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    to_id: await deep.id('@deep-foundation/core', 'system', 'admin'),
    out: { data: {
      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
      to_id: await deep.id('@deep-foundation/core', 'containTree'),
    } },
  };
  await insertRule(admin, {
    subject: adminWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowPackagerInstall'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowPackagerPublish'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowPackagerInstall'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowPackagerPublish'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
  await insertRule(admin, {
    subject: usersWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
        to_id: await deep.id('@deep-foundation/core', 'system', 'users'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
  await insertRule(admin, {
    subject: usersWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'system', 'admin'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      }
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowLogin'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
  await insertRule(admin, {
    subject: usersWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Active'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Focus'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Unfocus'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Contain'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Space'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Query'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
          object: { data: { value: {
            _or: [
              { to_id: { _eq: 0 } },
              { to: {
                _by_item: {
                  group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
                  path_item_id: { _eq: 'X-Deep-User-Id' },
                },
               } },
            ],
            from: {
              _by_item: {
                group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
                path_item_id: { _eq: 'X-Deep-User-Id' },
              },
            },
          } } }
        } },
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowInsert'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
  await insertRule(admin, {
    subject: usersWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Contain'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Focus'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Query'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
          object: { data: { value: {
            from: {
              _by_item: {
                group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
                path_item_id: { _eq: 'X-Deep-User-Id' },
              },
            },
          } } }
        } },
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowUpdate'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
  await insertRule(admin, {
    subject: usersWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Focus'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Active'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Query'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'Space'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
          object: { data: { value: {
            from: {
              _by_item: {
                group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
                path_item_id: { _eq: 'X-Deep-User-Id' },
              },
            },
          } } }
        } },
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowDelete'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
};

export const down = async () => {
  debug('down');
};
