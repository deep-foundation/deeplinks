import Debug from 'debug';

import Cors from 'cors';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { corsMiddleware } from '@deep-foundation/hasura/cors-middleware';
import { HasuraApi } from "@deep-foundation/hasura/api";
import { sql } from '@deep-foundation/hasura/sql';
import { generateMutation, generateQuery, generateSerial, insertMutation } from '../gql';
import { gql } from 'apollo-boost';
import vm from 'vm';

import { generatePermissionWhere, permissions } from '../permission';
import { GLOBAL_ID_TABLE_VALUE, GLOBAL_ID_TABLE_COLUMN, DENIED_IDS, ALLOWED_IDS } from '../global-ids';
import { reject, resolve } from '../promise';

const SCHEMA = 'public';

const debug = Debug('deepcase:eh');

export const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const cors = Cors({ methods: ['GET', 'HEAD', 'POST'] });
export default async (req, res) => {
  await corsMiddleware(req, res, cors);
  try {
    const event = req?.body?.event;
    const operation = event?.op;
    if (operation === 'INSERT' || operation === 'UPDATE' || operation === 'DELETE') {
      const oldRow = event?.data?.old;
      const newRow = event?.data?.new;
      const current = operation === 'DELETE' ? oldRow : newRow;
      const typeId = current.type_id;

      try {
        // type |== type: handle ==> INSERT symbol (ONLY)
        // const handleStringResult = await client.query({ query: gql`query SELECT_STRING_HANDLE($typeId: bigint) { string(where: {
        //   link: {
        //     type_id: { _eq: 20 },
        //     to_id: { _eq: 16 },
        //     from_id: { _eq: $typeId }
        //   },
        // }) {
        //   id
        //   value
        // } }`, variables: {
        //   typeId,
        // }});
        // const handleStringValue = handleStringResult?.data?.string?.[0]?.value;
        // if (handleStringValue) {
        //   try { 
        //     vm.runInNewContext(handleStringValue, { console, Error, oldRow, newRow });
        //   } catch(error) {
        //     debug(error);
        //   }
        // }

        // tables
        if (typeId === 6) {
          const results = await client.query({ query: gql`query SELECT_TABLE_STRUCTURE($tableId: bigint) {
            links(where: {id: {_eq: $tableId}}) {
              id
              values: out_aggregate(where: {type_id: {_eq: ${GLOBAL_ID_TABLE_VALUE}}}) {
                aggregate {
                  count
                }
              }
              columns: out(where: {type_id: {_eq: ${GLOBAL_ID_TABLE_COLUMN}}}) {
                id column_id: to_id value
              }
            }
          }`, variables: {
            tableId: current.from_id,
          }});
          const table = results?.data?.links?.[0];
          const tableName = 'table'+table?.id;
          const valuesCount = table?.values?.aggregate?.count;
          const columns = (table?.columns || []).map(c => ({ name: `${c?.value?.value || 'value'}`, type: 'TEXT' }));

          debug('table', { tableName, columns, valuesCount });

          if (operation === 'INSERT' && valuesCount === 1) {
            const createTable = await api.sql(sql`
              CREATE TABLE ${SCHEMA}."${tableName}" (id bigint PRIMARY KEY, link_id bigint NOT NULL, ${columns.map(c => `${c.name} ${c.type}`).join(',')});
              CREATE SEQUENCE ${tableName}_id_seq
              AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
              ALTER SEQUENCE ${tableName}_id_seq OWNED BY ${SCHEMA}."${tableName}".id;
              ALTER TABLE ONLY ${SCHEMA}."${tableName}" ALTER COLUMN id SET DEFAULT nextval('${tableName}_id_seq'::regclass);
            `);
            const error = createTable?.data?.internal?.error;
            if (error) console.log(error);
            await api.sql(sql`
              INSERT INTO "links__tables" (name) VALUES ('${tableName}');
            `);
            await api.query({
              type: 'track_table',
              args: {
                schema: SCHEMA,
                name: tableName,
              },
            });
            await api.query({
              type: 'create_object_relationship',
              args: {
                table: tableName,
                name: 'link',
                using: {
                  manual_configuration: {
                    remote_table: {
                      schema: SCHEMA,
                      name: 'links',
                    },
                    column_mapping: {
                      link_id: 'id',
                    },
                  },
                },
              },
            });
            await api.query({
              type: 'create_array_relationship',
              args: {
                table: 'links',
                name: tableName,
                using: {
                  manual_configuration: {
                    remote_table: {
                      schema: SCHEMA,
                      name: tableName,
                    },
                    column_mapping: {
                      id: 'link_id',
                    },
                  },
                },
              },
            });
            await permissions(api, tableName, {
              select: {},
              insert: {}, // generatePermissionWhere(16),
              update: {}, // generatePermissionWhere(17),
              delete: {},
            });
          } else if (operation === 'DELETE' && !valuesCount) {
            await api.sql(sql`
              DELETE FROM "links__tables" WHERE name='${tableName}';
            `);
            await api.query({
              type: 'untrack_table',
              args: {
                table: {
                  schema: SCHEMA,
                  name: tableName,
                },
                cascade: true,
              },
            });
            await api.sql(sql`
              DROP TABLE "${tableName}" CASCADE;
            `);
          }
        }
        if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
          debug('resolve', current.id);
          await resolve({ id: current.id, client });
        }
        return res.status(200).json({});
      } catch(error) {
        debug('error', error);
        if (operation === 'INSERT' && !DENIED_IDS.includes(current.type_id) && ALLOWED_IDS.includes(current.type_id)) {
          debug('reject', current.id);
          await reject({ id: current.id, client });
        }
      }

      return res.status(500).json({ error: 'notexplained' });
    }
    return res.status(500).json({ error: 'operation can be only INSERT or UPDATE' });
  } catch(error) {
    return res.status(500).json({ error: error.toString() });
  }
};