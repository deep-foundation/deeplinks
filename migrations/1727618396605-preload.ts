import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { installPackage } from './1678940577209-deepcase.js';
import { containWithin, packageExists, sharePermissions } from './1664940577200-tsx.js';

const debug = Debug('deeplinks:migrations:preload');
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
  const packageName = '@deep-foundation/preload';
  if (!await packageExists(packageName)) {
    const adminId = await root.id('deep', 'admin');
    const admin = await root.login({ linkId: adminId });
    const deep = new DeepClient({ deep: root, ...admin });

    await installPackage(deep, '@deep-foundation/preload');
    const packageId = await root.id('@deep-foundation/preload');
    await sharePermissions(adminId, packageId);
    await containWithin(adminId, packageId);

    const Pckg = await deep.id('@deep-foundation/core', 'Package');
    const Preload = await deep.id('@deep-foundation/preload', 'Preload');
    const { data: packages } = await deep.select({ type_id: Pckg });
    await deep.insert(packages.map(p => ({ type_id: Preload, from_id: p.id, to_id: p.id })));
  }
};

export const down = async () => {
  log('down');
};