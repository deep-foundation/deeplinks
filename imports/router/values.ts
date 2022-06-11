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
import axios from 'axios';
import crypto from 'crypto';
import { 
  handleOperation,
  handleSelectorOperation,
} from './links';
import { boolExpToSQL } from '../bool_exp_to_sql';

const SCHEMA = 'public';

const debug = Debug('deeplinks:eh:values');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

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
      
      const oldRow = { ...linkRow, value: oldValueRow };
      const newRow = { ...linkRow, value: newValueRow };

      log('operation', operation);
      log('linkId', linkId);
      log('linkRow', linkRow);
      log('oldValueRow', oldValueRow);
      log('newValueRow', newValueRow);
      log('newRow', newRow);
      log('oldRow', oldRow);

      if(oldValueRow && !newValueRow) {
          // delete bool_exp trash
          await deep.delete({
            link_id: { _eq: oldValueRow.link_id },
          }, { table: 'bool_exp' });
      }
      if(newValueRow && newRow.type_id === await deep.id('@deep-foundation/core','BoolExp')) {
          // generate new bool_exp sql version
          await boolExpToSQL(newRow.id, newRow?.value?.value);
      }

      try {
        await handleOperation('Update', oldRow, newRow);
        await handleSelectorOperation('Update', oldRow, newRow);
        
        return res.status(200).json({});
      } catch(e) {
        log('operation', operation);
        log('linkId', linkId);
        log('linkRow', linkRow);
        log('oldValueRow', oldValueRow);
        log('newValueRow', newValueRow);
        log('newRow', newRow);
        log('oldRow', oldRow);
        error('Error', e);
        throw e;
      }

      return res.status(500).json({ error: 'notexplained' });
    }
    return res.status(500).json({ error: 'operation can be only INSERT or UPDATE' });
  } catch(e) {
    return res.status(500).json({ error: e.toString() });
  }
};