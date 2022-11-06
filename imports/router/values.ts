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
      let linkId;
      let linkRow;
      let oldValueRow;
      let newValueRow;
      let newRow;
      let oldRow;
      try {
        oldValueRow = event?.data?.old;
        newValueRow = event?.data?.new;

        linkId = newValueRow?.link_id ?? oldValueRow?.link_id;
        linkRow = (await deep.select({
          id: { _eq: linkId },
        }, {
          returning: `id from_id type_id to_id`,
        }))?.data?.[0];

        // get oldLinkRow and newLinkRow from promise_links table
        // await api.sql(sql`CREATE TABLE IF NOT EXISTS public.promise_links (
        //   id bigserial PRIMARY KEY,
        //   promise_id bigint NOT NULL,
        //   old_link_id bigint,
        //   old_link_type_id bigint,
        //   old_link_from_id bigint,
        //   old_link_to_id bigint,
        //   new_link_id bigint,
        //   new_link_type_id bigint,
        //   new_link_from_id bigint,
        //   new_link_to_id bigint,
        //   handle_operation_id bigint NOT NULL
        // );`);
        const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
        /*
        const queryResult = (await deep.select({
          handle_operation_id: { _eq: handleUpdateTypeId },
        }, {
          returning: `
            id
            promise_id
            old_link_id
            old_link_type_id
            old_link_from_id
            old_link_to_id
            new_link_id
            new_link_type_id
            new_link_from_id
            new_link_to_id
            handle_operation_id
          `,
        }))?.data?.[0];
        */
        // rewrite this query using apollo client
        const queryResult = (await client.query({
          query: gql`
            query {
              promise_links(where: {
                handle_operation: { type_id: { _eq: ${handleUpdateTypeId} } }
                old_link_id: {_eq: ${linkId}},
                new_link_id: {_eq: ${linkId}},
                values_operation: { _eq: "${operation}" }
              }) {
                id
                promise_id
                old_link_id
                old_link_type_id
                old_link_from_id
                old_link_to_id
                new_link_id
                new_link_type_id
                new_link_from_id
                new_link_to_id
                handle_operation_id
              }
            }
          `,
        }))?.data?.promise_links?.[0];
        const oldLinkRow = {
          id: queryResult?.old_link_id,
          type_id: queryResult?.old_link_type_id,
          from_id: queryResult?.old_link_from_id,
          to_id: queryResult?.old_link_to_id,
        };
        const newLinkRow = {
          id: queryResult?.new_link_id,
          type_id: queryResult?.new_link_type_id,
          from_id: queryResult?.new_link_from_id,
          to_id: queryResult?.new_link_to_id,
        };
        log(`oldLinkRow: ${JSON.stringify(oldLinkRow)}`);
        log(`newLinkRow: ${JSON.stringify(newLinkRow)}`);

        oldRow = { ...linkRow, value: oldValueRow };
        newRow = { ...linkRow, value: newValueRow };

        if (!linkRow) {
          if(newValueRow?.link_id) {
            throw new Error('Value insert is handled before the link is added.'); 
          } else { // if(oldValueRow?.link_id) {
            throw new Error('Value deletion is handled after its link is deleted.'); 
          }
        }

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
            }, { table: 'bool_exp' as any });
        }
        if(newValueRow && newRow.type_id === await deep.id('@deep-foundation/core','Query')) {
            // generate new bool_exp sql version
            await boolExpToSQL(newRow.id, newRow?.value?.value);
        }
      
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
    }
    return res.status(500).json({ error: 'operation can be only INSERT or UPDATE' });
  } catch(e) {
    return res.status(500).json({ error: e.toString() });
  }
};