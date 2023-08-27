import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { packageExists, sharePermissions } from './1664940577200-tsx.js';

const debug = Debug('deeplinks:migrations:deepcase');
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

export const installPackage = async (deep, packageName) => {
  const adminId = await deep.id('deep', 'admin');
  
  log('adminId', adminId);
  const packageQueryTypeId = await deep.id('@deep-foundation/core', 'PackageQuery');
  log('packageQueryTypeId', packageQueryTypeId);
  const installTypeId = await deep.id('@deep-foundation/npm-packager', 'Install');
  log('installTypeId', installTypeId);

  const { data: [{ id: installId = undefined } = {}] = []} = {} = await deep.insert({
    from_id: adminId,
    type_id: installTypeId,
    to: {
      data: {
        type_id: packageQueryTypeId,
        string: { data: { value: packageName } }
      }
    }
  });

  await deep.await(installId);
  
  const packageId = await deep.id(packageName);
  log(`${packageName} package is installed as ${packageId} link.`)
  return packageId;
}

export const up = async () => {
  log('up');
  const packageName = '@deep-foundation/deepcase';
  if (!await packageExists(packageName)) {
    const adminId = await root.id('deep', 'admin');

    const admin = await root.login({ linkId: adminId });
    const deep = new DeepClient({ deep: root, ...admin });
  
    log('adminId', adminId);
    const packageId = await installPackage(deep, packageName);
    await sharePermissions(adminId, packageId);
  
    const usersCanInsertSafeLinks = await deep.id('deep', 'admin', 'usersCanInsertSafeLinks');
    const usersCanUpdateSafeLinks = await deep.id('deep', 'admin', 'usersCanUpdateSafeLinks');
    const usersCanDeleteSafeLinks = await deep.id('deep', 'admin', 'usersCanDeleteSafeLinks');
  
    const { data: rules } = await deep.select({
      'up': {
        'parent_id': { _in: [usersCanInsertSafeLinks, usersCanUpdateSafeLinks, usersCanDeleteSafeLinks] },
      }
    });
    deep.minilinks.apply([...rules]);
    const insertSelector = deep.minilinks.byId[usersCanInsertSafeLinks]?.outByType?.[deep.idLocal('@deep-foundation/core', 'RuleObject')]?.[0]?.to?.id;
    const updateSelector = deep.minilinks.byId[usersCanUpdateSafeLinks]?.outByType?.[deep.idLocal('@deep-foundation/core', 'RuleObject')]?.[0]?.to?.id;
    const deleteSelector = deep.minilinks.byId[usersCanDeleteSafeLinks]?.outByType?.[deep.idLocal('@deep-foundation/core', 'RuleObject')]?.[0]?.to?.id;
    await deep.insert([
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        from_id: insertSelector,
        to_id: await deep.id(packageName, 'Traveler'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        from_id: updateSelector,
        to_id: await deep.id(packageName, 'Traveler'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
        from_id: deleteSelector,
        to_id: await deep.id(packageName, 'Traveler'),
        out: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
          to_id: await deep.id('@deep-foundation/core', 'containTree'),
        } },
      },
    ]);
  }
};

export const down = async () => {
  log('down');
};