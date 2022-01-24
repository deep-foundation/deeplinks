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

const insertRule = async (options: {
  subject: any;
  object: any;
  action: any;
}) => {
  await deep.insert({
    type_id: await deep.id('@deep-foundation/core', 'Rule'),
    out: { data: [
      {
        type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Selector'),
          out: { data: options.subject }
        } }
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Selector'),
          out: { data: options.object },
        } }
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Selector'),
          out: { data: options.action, }
        } }
      },
    ] },
  });
};

export const up = async () => {
  debug('up');
  // const users = {
  //   type_id: await deep.id('@deep-foundation/core', 'Include'),
  //   to_id: await deep.id('@deep-foundation/core', 'system', 'users'),
  //   out: { data: {
  //     type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
  //     to_id: await deep.id('@deep-foundation/core', 'containTree'),
  //   } },
  // };
  // await insertRule({
  //   subject: users,
  //   object: [
  //     {
  //       type_id: await deep.id('@deep-foundation/core', 'Include'),
  //       to_id: await deep.id('@deep-foundation/core', 'Focus'),
  //     },
  //     {
  //       from: {  }
  //     },
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
