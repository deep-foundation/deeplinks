import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { up as upTable, down as downTable } from '@deep-foundation/materialized-path/table.js';
import { up as upRels, down as downRels } from '@deep-foundation/materialized-path/relationships.js';
import { Trigger } from '@deep-foundation/materialized-path/trigger.js';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
import { permissions } from '../imports/permission.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import { DeepClient } from '../imports/client.js';
import { promiseTriggersUp, promiseTriggersDown } from '../imports/type-table.js';
import { types } from 'util';

const debug = Debug('deeplinks:migrations:demo');
const log = debug.extend('log');
const error = debug.extend('error');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
});

let i = 0;
const insertRule = async (containName, admin, options: {
  subject: any;
  object: any;
  action: any;
}) => {
  i++;
  const { data: [{ id: ruleId }] } = await admin.insert({
    type_id: await admin.id('@deep-foundation/core', 'Rule'),
    in: { data: [
      {
        type_id: await admin.id('@deep-foundation/core', 'Contain'),
        from_id: await admin.id('deep', 'admin'),
        string: { data: { value: containName } },
      },
    ] },
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
  log('up');

  const { linkId, token } = await deep.jwt({ linkId: await deep.id('deep', 'admin') });
  const admin = new DeepClient({ deep, token, linkId });

  const usersWhere = {
    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    to_id: await deep.id('deep', 'users'),
    out: { data: {
      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
      to_id: await deep.id('@deep-foundation/core', 'joinTree'),
    } },
  };
  const adminWhere = {
    type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
    to_id: await deep.id('deep', 'admin'),
    out: { data: {
      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
      to_id: await deep.id('@deep-foundation/core', 'containTree'),
    } },
  };
  await insertRule('adminPackageInstallPublish', admin, {
    subject: adminWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowPackageInstall'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowPackagePublish'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowPackageInstall'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowPackagePublish'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
  await insertRule('usersCanSeeAll', admin, {
    subject: usersWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('deep'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      // {
      //   type_id: await deep.id('@deep-foundation/core', 'SelectorExclude'),
      //   to_id: await deep.id('deep', 'users'),
      //   out: { data: {
      //     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
      //     to_id: await deep.id('@deep-foundation/core', 'containTree'),
      //   } },
      // },
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
  await insertRule('usersCanLoginAdmin', admin, {
    subject: usersWhere,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('deep', 'admin'),
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
  const types = [
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
      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
      to_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
      out: { data: {
        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
        to_id: await deep.id('@deep-foundation/core', 'containTree'),
      } },
    },
    {
      type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
      to_id: await deep.id('@deep-foundation/core', 'AsyncFile'),
      out: { data: {
        type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
        to_id: await deep.id('@deep-foundation/core', 'containTree'),
      } },
    },
  ];
  await insertRule('usersCanInsertSafeLinks', admin, {
    subject: usersWhere,
    object: [
      ...types,
      // {
      //   type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
      //   to: { data: {
      //     type_id: await deep.id('@deep-foundation/core', 'Query'),
      //     object: { data: { value: {
      //       _or: [
      //         { from_id: { _eq: 0 } },
      //         { from: {
      //           _by_item: {
      //             group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
      //             path_item_id: { _eq: 'X-Deep-User-Id' },
      //           },
      //         } },
      //       ],
      //     } } }
      //   } },
      // },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
  await insertRule('usersCanUpdateSafeLinks', admin, {
    subject: usersWhere,
    object: [
      ...types,
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Query'),
          object: { data: { value: {
            _by_item: {
              group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
              path_item_id: { _eq: 'X-Deep-User-Id' },
            },
          } } }
        } },
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowUpdateType'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
  await insertRule('usersCanDeleteSafeLinks', admin, {
    subject: usersWhere,
    object: [
      ...types,
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Query'),
          object: { data: { value: {
            _by_item: {
              group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
              path_item_id: { _eq: 'X-Deep-User-Id' },
            },
          } } }
        } },
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: await deep.id('@deep-foundation/core', 'AllowDeleteType'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ],
  });
};

export const down = async () => {
  log('down');
};
