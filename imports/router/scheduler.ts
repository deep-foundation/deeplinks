import Debug from 'debug';

import { generateApolloClient } from '@deep-foundation/hasura/client';
import { HasuraApi } from "@deep-foundation/hasura/api";
// import { sql } from '@deep-foundation/hasura/sql';
import { gql } from 'apollo-boost';
import vm from 'vm';

import { permissions } from '../permission';
import { findPromiseLink, reject, resolve } from '../promise';
import { DeepClient } from '../client';
import { ALLOWED_IDS, DENIED_IDS } from '../global-ids';
import { execSync } from 'child_process';
import axios from 'axios';
import crypto from 'crypto';
import { 
  handleOperation,
} from './links';
import { boolExpToSQL } from '../bool_exp';

const SCHEMA = 'public';

const debug = Debug('deepcase:eh');

export const api = new HasuraApi({
  path: process.env.DEEPLINKS_HASURA_PATH,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const client = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export default async (req, res) => {
  try {
    const event = req?.body;
    const operation = event?.op;

    console.log(`event`, event);

    try {
      // await handleOperation('Update', oldRow, newRow);
      
      // console.log("done");

      // if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
      //   debug('resolve', current.id);
      //   await resolve({
      //     id: current.id, client,
      //     Then: await deep.id('@deep-foundation/core', 'Then'),
      //     Promise: await deep.id('@deep-foundation/core', 'Promise'),
      //     Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
      //     Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
      //   });
      // }
      return res.status(200).json({});
    } catch(error) {
      debug('error', error);
      throw error;
      // if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
      //   debug('reject', current.id);
      //   await reject({
      //     id: current.id, client,
      //     Then: await deep.id('@deep-foundation/core', 'Then'),
      //     Promise: await deep.id('@deep-foundation/core', 'Promise'),
      //     Resolved: await deep.id('@deep-foundation/core', 'Resolved'),
      //     Rejected: await deep.id('@deep-foundation/core', 'Rejected'),
      //   });
      // }
    }

    return res.status(500).json({ error: 'notexplained' });
  } catch(error) {
    return res.status(500).json({ error: error.toString() });
  }
};