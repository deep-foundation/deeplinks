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

const portHash = {};
const containerHash = {};

export default async (req, res) => {
  try {
    const event = req?.body?.event;
    const operation = event?.op;
    if (operation === 'INSERT' || operation === 'UPDATE' || operation === 'DELETE') {
      let oldValueRow = event?.data?.old;
      let newValueRow = event?.data?.new;
      let oldLinkRow;
      let newLinkRow;

      // select value into oldRow
      if(oldValueRow) {
        const queryResult = await deep.select({
          id: { _eq: oldValueRow.link_id },
        }, {
          returning: `id from_id type_id to_id`,
        });
        oldLinkRow = { ...queryResult.data?.[0], value: oldValueRow };
        if (!newValueRow) {
          newLinkRow = queryResult.data?.[0];
          // delete bool_exp trash
          await deep.delete({
            link_id: { _eq: oldValueRow.link_id },
          }, { table: 'bool_exp' });
        }
      }
      // select value into newRow
      if(newValueRow) {
        const queryResult = await deep.select({
          id: { _eq: newValueRow.link_id },
        }, {
          returning: `id from_id type_id to_id`,
        });
        newLinkRow = { ...queryResult.data?.[0], value: newValueRow };
        if (!oldValueRow) {
          oldLinkRow = queryResult.data?.[0];
        }
        if (newLinkRow.type_id === await deep.id('@deep-foundation/core','BoolExp')) {
          // generate new bool_exp sql version
          await boolExpToSQL(newLinkRow.id, newLinkRow?.value?.value);
        }
      }

      console.log('event: ', JSON.stringify(event, null, 2));
      console.log('oldRow: ', oldLinkRow);
      console.log('newRow: ', newLinkRow);

      try {
        await handleOperation('Update', oldLinkRow, newLinkRow);
        
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
