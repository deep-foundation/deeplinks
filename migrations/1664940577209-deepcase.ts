import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import deepcasePckg from '@deep-foundation/deepcase/deep.json' assert { type: 'json'};
import { importPackage, sharePermissions } from './1664940577200-tsx.js';

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

export const up = async () => {
  log('up');
  const importResult = await importPackage(deepcasePckg);
  log(importResult);
  const packageId = importResult?.packageId;
  if (packageId) {
    await sharePermissions(await root.id('deep', 'admin'), packageId);
  }
  const usersCanInsertSafeLinks = await root.id('deep', 'admin', 'usersCanInsertSafeLinks');
  const usersCanUpdateSafeLinks = await root.id('deep', 'admin', 'usersCanUpdateSafeLinks');
  const usersCanDeleteSafeLinks = await root.id('deep', 'admin', 'usersCanDeleteSafeLinks');

  const { data: rules } = await root.select({
    'up': {
      'parent_id': { _in: [usersCanInsertSafeLinks, usersCanUpdateSafeLinks, usersCanDeleteSafeLinks] },
    }
  });
  root.minilinks.apply([...rules]);
  const insertSelector = root.minilinks.byId[usersCanInsertSafeLinks]?.outByType?.[root.idLocal('@deep-foundation/core', 'RuleObject')]?.[0]?.to?.id;
  const updateSelector = root.minilinks.byId[usersCanUpdateSafeLinks]?.outByType?.[root.idLocal('@deep-foundation/core', 'RuleObject')]?.[0]?.to?.id;
  const deleteSelector = root.minilinks.byId[usersCanDeleteSafeLinks]?.outByType?.[root.idLocal('@deep-foundation/core', 'RuleObject')]?.[0]?.to?.id;
  await root.insert([
    {
      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
      from_id: insertSelector,
      to_id: await root.id('@deep-foundation/deepcase', 'Traveler'),
      out: { data: {
        type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
        to_id: await root.id('@deep-foundation/core', 'containTree'),
      } },
    },
    {
      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
      from_id: updateSelector,
      to_id: await root.id('@deep-foundation/deepcase', 'Traveler'),
      out: { data: {
        type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
        to_id: await root.id('@deep-foundation/core', 'containTree'),
      } },
    },
    {
      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
      from_id: deleteSelector,
      to_id: await root.id('@deep-foundation/deepcase', 'Traveler'),
      out: { data: {
        type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
        to_id: await root.id('@deep-foundation/core', 'containTree'),
      } },
    },
  ]);
};

export const down = async () => {
  log('down');
};