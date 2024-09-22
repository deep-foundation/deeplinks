import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { installPackage } from './1678940577209-deepcase.js';
import { containWithin, packageExists, sharePermissions } from './1664940577200-tsx.js';

const debug = Debug('deeplinks:migrations:jsonschema');
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

const dc = '@deep-foundation/core';
const du = '@deep-foundation/unsafe';

export const up = async () => {
  log('up');
  const packageName = '@deep-foundation/jsonschema';
  if (!await packageExists(packageName)) {
    const adminId = await root.id('deep', 'admin');
    const admin = await root.login({ linkId: adminId });
    const deep = new DeepClient({ deep: root, ...admin });

    await installPackage(deep, '@deep-foundation/jsonschema');
    const packageId = await root.id('@deep-foundation/jsonschema');
    await sharePermissions(adminId, packageId);
    await containWithin(adminId, packageId);
    await deep.insert({
      containerId: adminId,
      type_id: deep.idLocal(dc, 'Rule'),
      out: { data: [
        {
          type_id: deep.idLocal(dc, 'RuleObject'),
          to: {
            type_id: deep.idLocal(dc, 'Selector'),
            out: {
              type_id: deep.idLocal(dc, 'SelectorInclude'),
              to_id: await deep.id(packageName),
              out: {
                type_id: deep.idLocal(dc, 'SelectorTree'),
                to_id: deep.idLocal(dc, 'joinTree'),
              },
            },
          },
        },
        {
          type_id: deep.idLocal(dc, 'RuleSubject'),
          to: {
            type_id: deep.idLocal(dc, 'Selector'),
            out: {
              type_id: deep.idLocal(dc, 'SelectorInclude'),
              to_id: await deep.id(packageName),
              out: {
                type_id: deep.idLocal(dc, 'SelectorTree'),
                to_id: deep.idLocal(dc, 'joinTree'),
              },
            },
          },
        },
        {
          type_id: deep.idLocal(dc, 'RuleAction'),
          to: {
            type_id: deep.idLocal(dc, 'Selector'),
            out: {
              type_id: deep.idLocal(dc, 'SelectorInclude'),
              to_id: await deep.id(du, 'AllowUnsafe'),
              out: {
                type_id: deep.idLocal(dc, 'SelectorTree'),
                to_id: deep.idLocal(dc, 'typesTree'),
              },
            },
          },
        },
      ] },
    });
  }
};

export const down = async () => {
  log('down');
};