import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { DeepClient } from '../imports/client';

const debug = Debug('deeplinks:migrations:migratios-end');
const log = debug.extend('log');
const error = debug.extend('error');

const apolloClient = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

export const awaitAllLinks = async () => {
  const result = await deep.select({ });
  for (const link of result.data) {
    // console.log("awating link", link);
    await deep.await(link.id);
    // console.log("done awaiting link", link);
  }
}

export const up = async () => {
  log('up');

  await awaitAllLinks();
  await awaitAllLinks();
  
  await deep.insert({ type_id: await deep.id("@deep-foundation/core", "MigrationsEnd") });
};

export const down = async () => {
  log('down');
};