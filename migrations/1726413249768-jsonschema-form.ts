import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { installPackage } from './1678940577209-deepcase.js';
import { containWithin, packageExists, sharePermissions } from './1664940577200-tsx.js';

const debug = Debug('deeplinks:migrations:jsonschema-form');
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
  const packageName = '@deep-foundation/jsonschema-form';
  if (!await packageExists(packageName)) {
    const adminId = await root.id('deep', 'admin');
    const admin = await root.login({ linkId: adminId });
    const deep = new DeepClient({ deep: root, ...admin });

    await installPackage(deep, '@deep-foundation/jsonschema-form');
    const packageId = await root.id('@deep-foundation/jsonschema-form');
    await sharePermissions(adminId, packageId);
    await containWithin(adminId, packageId);
  }
};

export const down = async () => {
  log('down');
};