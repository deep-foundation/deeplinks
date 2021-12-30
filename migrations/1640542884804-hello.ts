import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { generateMutation, generateSerial, insertMutation } from '../imports/gql';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import times from 'lodash/times';
import { time } from 'console';
import { Packager, PackagerPackage } from '../imports/packager';
import { DeepClient } from '../imports/client';

const debug = Debug('deeplinks:migrations:types');

const apolloClient = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const client = new DeepClient({ apolloClient });

const corePckg: PackagerPackage = {
  package: {
    name: "@deep-foundation/hello",
    version: '0.0.0',
  },
  data: [
    {
      id: 1,
      package: {
        dependencyId: 1,
        containValue: "Selector",
      },
    },
    {
      id: 2,
      package: {
        dependencyId: 1,
        containValue: "Rule",
      },
    },
    {
      id: 3,
      package: {
        dependencyId: 1,
        containValue: "RuleObject",
      },
    },
    {
      id: 4,
      package: {
        dependencyId: 1,
        containValue: "RuleSubject",
      },
    },
    {
      id: 5,
      package: {
        dependencyId: 1,
        containValue: "RuleAction",
      },
    },
    {
      id: 6,
      type: 1,
    },
    {
      id: 7,
      type: 1,
    },
    {
      id: 8,
      type: 1,
    },
    {
      id: 9,
      type: 2,
    },
    {
      id: 10,
      type: 3,
      from: 9,
      to: 8,
    },
    {
      id: 11,
      type: 4,
      from: 9,
      to: 6,
    },
    {
      id: 12,
      type: 5,
      from: 9,
      to: 7,
    },
  ],
  strict: false,
  errors: [],
  dependencies: {
    "1": {
      name: "@deep-foundation/core",
    },
  },
};

export const up = async () => {
  debug('up');
  const packager = new Packager(client);
  const { errors } = await packager.import(corePckg);
  if (errors.length) {
    console.log(errors);
    throw new Error('Import error');
  }
};

export const down = async () => {
  debug('down');
};