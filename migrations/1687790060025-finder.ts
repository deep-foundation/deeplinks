import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import pckg from '@deep-foundation/finder/deep.json' assert { type: 'json'};
import { importPackage, sharePermissions } from './1664940577200-tsx.js';

const debug = Debug('deeplinks:migrations:finder');
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
  console.log('pckg', JSON.stringify(pckg, null, 2));
  const importResult = await importPackage(pckg);
  console.log('importResult', JSON.stringify(importResult, null, 2));
  log(importResult);
  const packageId = importResult?.packageId;
  console.log('packageId', packageId);
  if (packageId) {
    await sharePermissions(await root.id('deep', 'admin'), packageId);
  }
};

export const down = async () => {
  log('down');
};