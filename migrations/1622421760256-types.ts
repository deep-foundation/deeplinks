import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { generateMutation, generateSerial, insertMutation } from '../imports/gql/index.js';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
import times from 'lodash/times';
import { time } from 'console';
import { Packager, Package } from '../imports/packager.js';
import { corePckg } from '../imports/core.js';
import { DeepClient } from '../imports/client.js';
import prompt from 'prompt';

const debug = Debug('deeplinks:migrations:types');
const log = debug.extend('log');
const error = debug.extend('error');

const rootClient = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const root = new DeepClient({
  apolloClient: rootClient,
});

export const up = async () => {
  log('up');
  const packager = new Packager(root);
  const { errors, packageId, namespaceId } = await packager.import(corePckg);
  if (errors?.length) {
    log(errors);
    log(errors[0]?.graphQLErrors?.[0]?.message);
    log(errors[0]?.graphQLErrors?.[0]?.extensions?.internal);
    log(errors[0]?.graphQLErrors?.[0]?.extensions?.internal?.request);
    const error = errors[0]?.graphQLErrors?.[0]?.extensions?.internal?.error;
    throw new Error(`Import error: ${String(errors[0]?.graphQLErrors?.[0]?.message || errors?.[0])}${error?.message ? ` ${error?.message} ${error?.request?.method} ${error?.request?.host}:${error?.request?.port}${error?.request?.path}` : ''}`);
  } else {
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Package'),
      string: { data: { value: 'deep' } },
    });
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'User'),
      in: { data: [{
        from_id: await root.id('deep'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'users' } },
      }] },
    });
    // Packages
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'User'),
      in: { data: [{
        from_id: await root.id('deep', 'users'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'packages' } },
      }] },
      out: { data: [{
        to_id: await root.id('deep', 'users'),
        type_id: await root.id('@deep-foundation/core', 'Join'),
        string: { data: { value: 'packages' } },
      }] },
    });
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Contain'),
      to_id: await root.id('@deep-foundation/core'),
      from_id: await root.id('deep', 'users', 'packages'),
    });
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Join'),
      from_id: await root.id('@deep-foundation/core'),
      to_id: await root.id('deep', 'users', 'packages'),
    });
    // System
    const { data: [{ id: adminId }] } = await root.insert({
      type_id: await root.id('@deep-foundation/core', 'User'),
      in: { data: [{
        from_id: await root.id('deep', 'users'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'admin' } },
      },{
        from_id: await root.id('deep'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'admin' } },
      },{
        from_id: await root.id('deep'),
        type_id: await root.id('@deep-foundation/core', 'Join'),
      },{
        from_id: await root.id('@deep-foundation/core'),
        type_id: await root.id('@deep-foundation/core', 'Join'),
      }] },
      out: { data: [{
        to_id: await root.id('deep', 'users'),
        type_id: await root.id('@deep-foundation/core', 'Join'),
      }] },
    });
    console.log('admin', adminId);
    const adminPermission = await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Rule'),
      in: { data: [{
        from_id: await root.id('deep', 'admin'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'allowAdminRule' } },
      }] },
      out: {
        data: [
          {
            type_id: await root.id('@deep-foundation/core', 'RuleSubject'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: adminId,
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'joinTree'),
                        },
                      },
                    },
                  ]
                },
              },
            },
          },
          {
            type_id: await root.id('@deep-foundation/core', 'RuleObject'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: adminId,
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            type_id: await root.id('@deep-foundation/core', 'RuleAction'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'AllowAdmin'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });
    const promisePermission = await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Rule'),
      in: { data: [{
        from_id: await root.id('deep', 'admin'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'allowSelectBasicTypesRule' } },
      }] },
      out: {
        data: [
          {
            type_id: await root.id('@deep-foundation/core', 'RuleSubject'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('deep', 'users'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'joinTree'),
                        },
                      },
                    },
                  ]
                },
              },
            },
          },
          {
            type_id: await root.id('@deep-foundation/core', 'RuleObject'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'User'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'Then'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'Promise'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'Resolved'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'Rejected'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            type_id: await root.id('@deep-foundation/core', 'RuleAction'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'AllowSelectType'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });
  }
};

const delay = time => new Promise(res => setTimeout(res, time));

export const down = async () => {
  log('down');
  try {
    const handleScheduleId = await root.id('@deep-foundation/core', 'HandleSchedule');
    const deletedHandlers = await root.delete({ 
      type_id: handleScheduleId,
    }, { name: 'DELETE_SCHEDULE_HANDLERS' });
    await delay(10000);
  } catch(e) {
    error(e);
  }
  await root.delete({}, { name: 'DELETE_TYPE_TYPE' });
};