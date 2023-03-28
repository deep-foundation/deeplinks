import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { DeepClient } from '../imports/client';
import * as npmPackagerPckg from '@deep-foundation/npm-packager-ui/deep.json';
import { importPackage, sharePermissions } from './1664940577200-tsx';

const debug = Debug('deeplinks:migrations:npm-packager-ui');
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
  const importResult = await importPackage(npmPackagerPckg);
  log(importResult);
  const packageId = importResult?.packageId;
  if (packageId) {
    await sharePermissions(await root.id('deep', 'admin'), packageId);
  }
};

export const down = async () => {
  log('down');
};