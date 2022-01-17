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
// import { boolExpToSQL } from '../bool_exp';

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

      const linkId = newValueRow?.link_id ?? oldValueRow?.link_id;
      const linkRow = (await deep.select({
        id: { _eq: linkId },
      }, {
        returning: `id from_id type_id to_id`,
      }))?.data?.[0];

      // if(oldValueRow && !newValueRow) {
      //     // delete bool_exp trash
      //     await deep.delete({
      //       link_id: { _eq: oldValueRow.link_id },
      //     }, { table: 'bool_exp' });
      // }
      // if(newValueRow && linkRow.type_id === await deep.id('@deep-foundation/core','BoolExp')) {
      //     // generate new bool_exp sql version
      //     await boolExpToSQL(linkRow.id, linkRow?.value?.value);
      // }
      
      const oldRow = { ...linkRow, value: oldValueRow };
      const newRow = { ...linkRow, value: newValueRow };

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
