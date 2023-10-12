import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { permissions } from '../imports/permission.js';
import { api, SCHEMA } from './1616701513782-links.js';
import { linksPermissions } from './1622421760260-permissions.js';

const debug = Debug('deeplinks:migrations:handlers');
const log = debug.extend('log');
const error = debug.extend('error');

export const HANDLERS_TABLE_NAME = 'handlers';
export const TABLE_NAME = 'links';

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export const up = async () => {
  log('up');
  log('view');
  
  await api.sql(sql`
    CREATE VIEW ${HANDLERS_TABLE_NAME} AS
    SELECT DISTINCT
      coalesce((SELECT gl.from_id as id FROM links gl WHERE (gl.type_id = ${await deep.id('@deep-foundation/core', 'GeneratedFrom')}) AND (gl.from_id = handling_link.id OR gl.to_id = handling_link.id) LIMIT 1), handling_link.id) AS dist_id,
      coalesce((SELECT gl.to_id as id FROM links gl WHERE (gl.type_id = ${await deep.id('@deep-foundation/core', 'GeneratedFrom')}) AND (gl.from_id = handling_link.id OR gl.to_id = handling_link.id) LIMIT 1), handling_link.id) AS src_id,
      handler_link.id AS handler_id,
      supports_link.from_id AS isolation_provider_id,
      supports_link.to_id AS execution_provider_id
    FROM links handling_link,
      links handler_link,
      links supports_link
    WHERE (
      (handler_link.type_id = ${await deep.id('@deep-foundation/core', 'Handler')})
      AND (handler_link.from_id = supports_link.id)
      AND (supports_link.type_id = ${await deep.id('@deep-foundation/core', 'Supports')})
      AND (handler_link.to_id = handling_link.id)
    );
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: HANDLERS_TABLE_NAME,
    },
  });
  const relationsFields = ['src', 'dist', 'handler', 'isolation_provider', 'execution_provider'];
  for (const field of relationsFields) {
    await api.query({
      type: 'create_object_relationship',
      args: {
        table: HANDLERS_TABLE_NAME,
        name: field,
        using: {
          manual_configuration: {
            remote_table: {
              schema: SCHEMA,
              name: TABLE_NAME,
            },
            column_mapping: {
              [`${field}_id`]: 'id',
            },
          },
        },
      },
    });
  }
  const permissionFields = ['dist'];
  const selectPermissionsLinks: any[] = [];
  for (const field of permissionFields) {
    selectPermissionsLinks.push({
      [field]: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
    });
  }
  await permissions(api, HANDLERS_TABLE_NAME, {
    role: 'link',
  
    select: {
      _and: selectPermissionsLinks,
    },
    insert: {},
    update: {},
    delete: {},
    
    columns: '*',
    computed_fields: [],
  });
  await permissions(api, HANDLERS_TABLE_NAME, {
    role: 'undefined',

    select: {
      dist_id: { _is_null: true },
    },
    insert: {},
    update: {},
    delete: {},

    columns: '*',
    computed_fields: [],
  });
};

export const down = async () => {
  log('down');
  log('view');
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: HANDLERS_TABLE_NAME,
      },
      cascade: true,
    },
  });
  await api.sql(sql`
    DROP VIEW IF EXISTS ${HANDLERS_TABLE_NAME} CASCADE;
  `);
};