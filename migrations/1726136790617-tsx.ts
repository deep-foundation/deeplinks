import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import tsxPckg from '@deep-foundation/tsx/deep.json' assert { type: 'json'};
import { Packager } from '../imports/packager.js';

const debug = Debug('deeplinks:migrations:tsx');
const log = debug.extend('log');
const error = debug.extend('error');

const rootClient = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

var dc = '@deep-foundation/core';

const deep = new DeepClient({
  apolloClient: rootClient,
});

export const demoRules = ['usersCanSeeAll', 'usersCanInsertSafeLinks', 'usersCanUpdateSafeLinks', 'usersCanDeleteSafeLinks'];

export const up = async () => {
  log('up');
  const TSX = await deep.id('@deep-foundation/tsx', 'TSX');

  const { data: rules } = await deep.select({ from_id: await deep.id('deep', 'admin'), type_id: deep.idLocal(dc, 'Contain'), string: { value: { _in: demoRules } } }, { apply: 'rules' })

  const { data: selectors } = await rules.travel().to().out({ type_id: deep.idLocal(dc, 'RuleObject') }).to().select();

  await deep.insert(selectors.map(s => ({
    from_id: s.id,
    type_id: deep.idLocal('@deep-foundation/core', 'SelectorInclude'),
    to_id: TSX,
    out: {
      type_id: deep.idLocal('@deep-foundation/core', 'SelectorTree'),
      to_id: deep.idLocal('@deep-foundation/core', 'typesTree'),
    },
  })));
};

export const down = async () => {
  log('down');
};