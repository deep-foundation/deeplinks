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
  console.time(`${i}: ${1}`);
  const { data: [{ id: ruleId }] } = await admin.insert({
    type_id: await admin.id('@deep-foundation/core', 'Rule'),
  });
  console.timeEnd(`${i}: ${1}`);
  console.time(`${i}: ${2}`);
  const { data: [{ id: selectorSubjectId }] } = await admin.insert({
    type_id: await admin.id('@deep-foundation/core', 'Selector'),
    out: { data: options.subject }
  });
  console.timeEnd(`${i}: ${2}`);
  console.time(`${i}: ${3}`);
  const { data: [{ id: selectorObjectId }] } = await admin.insert({
    type_id: await admin.id('@deep-foundation/core', 'Selector'),
    out: { data: options.object }
  });
  console.timeEnd(`${i}: ${3}`);
  console.time(`${i}: ${4}`);
  const { data: [{ id: selectorActionId }] } = await admin.insert({
    type_id: await admin.id('@deep-foundation/core', 'Selector'),
    out: { data: options.action }
  });
  console.timeEnd(`${i}: ${4}`);
  console.time(`${i}: ${5}`);
  await admin.insert({
    from_id: ruleId,
    type_id: await admin.id('@deep-foundation/core', 'RuleSubject'),
    to_id: selectorSubjectId,
  });
  console.timeEnd(`${i}: ${5}`);
  console.time(`${i}: ${6}`);
  await admin.insert({
    from_id: ruleId,
    type_id: await admin.id('@deep-foundation/core', 'RuleObject'),
    to_id: selectorObjectId,
  });
  console.timeEnd(`${i}: ${6}`);
  console.time(`${i}: ${7}`);
  await admin.insert({
    from_id: ruleId,
    type_id: await admin.id('@deep-foundation/core', 'RuleAction'),
    to_id: selectorActionId,
  });
  console.timeEnd(`${i}: ${7}`);
};

export const up = async () => {
  debug('up');

  const { linkId, token } = await deep.jwt({ linkId: await deep.id('@deep-foundation/core', 'system', 'admin') });
  const admin = new DeepClient({ deep, token, linkId });

  const users = {
    type_id: await deep.id('@deep-foundation/core', 'Include'),
    to_id: await deep.id('@deep-foundation/core', 'system', 'users'),
    out: { data: {
      type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
      to_id: await deep.id('@deep-foundation/core', 'containTree'),
    } },
  };
  console.log('visible');
  console.log('Rule id', await admin.id('@deep-foundation/core', 'Rule')),
  await insertRule(admin, {
    subject: users,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core'),
      },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
      },
    ],
  });
  console.log('updatable');
  console.log(admin.token, admin.linkId, {
    type_id: await admin.id('@deep-foundation/core', 'Rule'),
  });
  await insertRule(admin, {
    subject: users,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'Focus'),
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'Unfocus'),
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'Contain'),
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'Space'),
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'Query'),
      },
      // {
      //   type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
      //   to: { data: {
      //     type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
      //     object: { data: {
      //       _or: [
      //         {
      //           from: {
      //             _by_item: {
      //               group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
      //               path_item: {
      //                 group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
      //               }
      //             },
      //           }
      //         },
      //       ],
      //     } }
      //   } },
      // },
    ],
    action: [
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'AllowInsert'),
      },
    ],
  });
  await insertRule(admin, {
    subject: users,
    object: [
      {
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'Query'),
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
        type_id: await deep.id('@deep-foundation/core', 'Include'),
        to_id: await deep.id('@deep-foundation/core', 'AllowUpdate'),
      },
    ],
  });
  console.log('done');
  // insertRule({
  //   subject: {
  //     type_id: await deep.id('@deep-foundation/core', 'Include'),
  //     to_id: await deep.id('@deep-foundation/core', 'system', 'users'),
  //     out: { data: {
  //       type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
  //       to_id: await deep.id('@deep-foundation/core', 'containTree'),
  //     } },
  //   },
  //   object: [
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'Focus'),
  //     },
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'Unfocus'),
  //     },
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'Contain'),
  //     },
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'Any'),
  //     },
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'Space'),
  //     },
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'Query'),
  //     },
  //     // {
  //     //   type_id: await deep.id('@deep-foundation/core', 'SelectorFilter'),
  //     //   to: { data: {
  //     //     type_id: await deep.id('@deep-foundation/core', 'BoolExp'),
  //     //     object: { data: {
  //     //       _or: [
  //     //         {
  //     //           from: {
  //     //             _by_item: {
  //     //               group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
  //     //               path_item: {
  //     //                 group_id: { _eq: await deep.id('@deep-foundation/core', 'containTree') },
  //     //                 path_item_id: { _eq: '' },
  //     //               }
  //     //             },
  //     //           }
  //     //         },
  //     //       ],
  //     //     } }
  //     //   } },
  //     // },
  //   ],
  //   action: [
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'AllowSelect'),
  //     },
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'AllowInsert'),
  //     },
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'AllowUpdate'),
  //     },
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'AllowDelete'),
  //     },
  //   ],
  // });
};

export const down = async () => {
  debug('down');
};
