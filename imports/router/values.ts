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

const portHash = {};
const containerHash = {};

export default async (req, res) => {
  try {
    const event = req?.body?.event;
    const operation = event?.op;
    if (operation === 'INSERT' || operation === 'UPDATE' || operation === 'DELETE') {
      let oldRow = event?.data?.old;
      let newRow = event?.data?.new;

      // select value into oldRow
      if(oldRow) {
        const queryResult = await deep.select({
          id: { _eq: oldRow.link_id },
        }, {
          returning: `id from_id type_id to_id`,
        });
        oldRow = { ...queryResult.data?.[0], value: oldRow };
        if (!newRow) {
          newRow = queryResult.data?.[0];
        }
      }
      // select value into newRow
      if(newRow) {
        const queryResult = await deep.select({
          id: { _eq: newRow.link_id },
        }, {
          returning: `id from_id type_id to_id`,
        });
        newRow = { ...queryResult.data?.[0], value: newRow };
        if (!oldRow) {
          oldRow = queryResult.data?.[0];
        }
      }

      console.log('event: ', JSON.stringify(event, null, 2));
      console.log('oldRow: ', oldRow);
      console.log('newRow: ', newRow);

      try {
        await handleOperation('Update', oldRow, newRow);
        
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
    }
    return res.status(500).json({ error: 'operation can be only INSERT or UPDATE' });
  } catch(error) {
    return res.status(500).json({ error: error.toString() });
  }
};
