import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';
import { permissions } from '../imports/permission.js';
import waitOn from 'wait-on';
import { linksPermissions } from './1622421760260-permissions.js'
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from '../imports/client.js';

const debug = Debug('deeplinks:migrations:hasura-storage');
const log = debug.extend('log');
const error = debug.extend('error');

export const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

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
  log('sql');

await api.sql(sql`
CREATE SCHEMA IF NOT EXISTS storage;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

BEGIN;
-- functions
CREATE OR REPLACE FUNCTION storage.set_current_timestamp_updated_at ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $a$
DECLARE
  _new record;
BEGIN
  _new := new;
  _new. "updated_at" = now();
  RETURN _new;
END;
$a$;

CREATE OR REPLACE FUNCTION storage.protect_default_bucket_delete ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $a$
BEGIN
  IF OLD.ID = 'default' THEN
    RAISE EXCEPTION 'Can not delete default bucket';
  END IF;
  RETURN OLD;
END;
$a$;

CREATE OR REPLACE FUNCTION storage.protect_default_bucket_update ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $a$
BEGIN
  IF OLD.ID = 'default' AND NEW.ID <> 'default' THEN
    RAISE EXCEPTION 'Can not rename default bucket';
  END IF;
  RETURN NEW;
END;
$a$;

-- tables
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  download_expiration int NOT NULL DEFAULT 30, -- 30 seconds
  min_upload_file_size int NOT NULL DEFAULT 1,
  max_upload_file_size int NOT NULL DEFAULT 50000000,
  cache_control text DEFAULT 'max-age=3600',
  presigned_urls_enabled boolean NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS storage.files (
  id uuid DEFAULT public.gen_random_uuid () NOT NULL PRIMARY KEY,
  link_id bigint unique,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  bucket_id text NOT NULL DEFAULT 'default',
  name text,
  size int,
  mime_type text,
  etag text,
  is_uploaded boolean DEFAULT FALSE,
  uploaded_by_user_id uuid,
  uploaded_by_link_id bigint
);

-- constraints
DO $$
BEGIN
  IF NOT EXISTS(SELECT table_name
            FROM information_schema.table_constraints
            WHERE table_schema = 'storage'
              AND table_name = 'files'
              AND constraint_name = 'fk_bucket')
  THEN
    ALTER TABLE storage.files
      ADD CONSTRAINT fk_bucket FOREIGN KEY (bucket_id) REFERENCES storage.buckets (id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT table_name
            FROM information_schema.table_constraints
            WHERE table_schema = 'storage'
              AND table_name = 'files'
              AND constraint_name = 'fk_link')
  THEN
    ALTER TABLE storage.files
      ADD CONSTRAINT fk_link FOREIGN KEY (link_id) REFERENCES public.links (id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

-- triggers
DROP TRIGGER IF EXISTS set_storage_buckets_updated_at ON storage.buckets;
CREATE TRIGGER set_storage_buckets_updated_at
  BEFORE UPDATE ON storage.buckets
  FOR EACH ROW
  EXECUTE FUNCTION storage.set_current_timestamp_updated_at ();

DROP TRIGGER IF EXISTS set_storage_files_updated_at ON storage.files;
CREATE TRIGGER set_storage_files_updated_at
  BEFORE UPDATE ON storage.files
  FOR EACH ROW
  EXECUTE FUNCTION storage.set_current_timestamp_updated_at ();

DROP TRIGGER IF EXISTS check_default_bucket_delete ON storage.buckets;
CREATE TRIGGER check_default_bucket_delete
  BEFORE DELETE ON storage.buckets
  FOR EACH ROW
    EXECUTE PROCEDURE storage.protect_default_bucket_delete ();

DROP TRIGGER IF EXISTS check_default_bucket_update ON storage.buckets;
CREATE TRIGGER check_default_bucket_update
  BEFORE UPDATE ON storage.buckets
  FOR EACH ROW
    EXECUTE PROCEDURE storage.protect_default_bucket_update ();

-- data
DO $$
BEGIN
  IF NOT EXISTS(SELECT id
            FROM storage.buckets
            WHERE id = 'default')
  THEN
    INSERT INTO storage.buckets (id)
      VALUES ('default');
  END IF;
END $$;

COMMIT;

ALTER TABLE storage.buckets
    ADD CONSTRAINT download_expiration_valid_range
        CHECK (download_expiration >= 1 AND download_expiration <= 604800);

ALTER TABLE storage.files DROP CONSTRAINT IF EXISTS fk_user;

ALTER TABLE "storage"."files" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE TABLE IF NOT EXISTS storage.virus (
  id uuid DEFAULT public.gen_random_uuid () NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  file_id UUID NOT NULL REFERENCES storage.files(id),
  filename TEXT NOT NULL,
  virus TEXT NOT NULL,
  user_session JSONB NOT NULL
);

DROP TRIGGER IF EXISTS set_storage_virus_updated_at ON storage.virus;
CREATE TRIGGER set_storage_virus_updated_at
  BEFORE UPDATE ON storage.virus
  FOR EACH ROW
  EXECUTE FUNCTION storage.set_current_timestamp_updated_at ();
`);

  log('track');

  await api.query({
    type: 'track_table',
    args: {
      schema: 'storage',
      name: 'files',
    },
  });

  await api.query({
    type: 'track_table',
    args: {
      schema: 'storage',
      name: 'buckets',
    },
  });

  log('table customization');

  await api.query({
    type: 'set_table_customization',
    args: {
      table:  { name: 'files', schema: 'storage' },
      configuration: {
        custom_name: 'files',
        custom_root_fields: {
          insert: 'insertFiles',
          select_aggregate: 'filesAggregate',
          insert_one: 'insertFile',
          select_by_pk: 'file',
          select: 'files',
          delete: 'deleteFiles',
          update: 'updateFiles',
          delete_by_pk: 'deleteFile',
          update_by_pk: 'updateFile'
        },
        custom_column_names: {
          etag: 'etag',
          is_uploaded: 'isUploaded',
          uploaded_by_user_id: 'uploadedByUserId',
          uploaded_by_link_id: 'uploadedByLinkId',
          size: 'size',
          mime_type: 'mimeType',
          bucket_id: 'bucketId',
          name: 'name',
          updated_at: 'updatedAt',
          created_at: 'createdAt',
          id: 'id',
        },
      },
    },
  });
  await api.query({
    type: 'create_event_trigger',
    args: {
      name: 'files',
      table:  { name: 'files', schema: 'storage' },
      webhook: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/values`,
      update: {
        columns: '*',
        payload: '*',
      },
      replace: false,
    },
  });

  await api.query({
    type: 'set_table_customization',
    args: {
      table:  { name: 'buckets', schema: 'storage' },
      configuration: {
        custom_name: 'buckets',
        custom_root_fields: {
          insert: 'insertBuckets',
          select_aggregate: 'bucketsAggregate',
          insert_one: 'insertBucket',
          select_by_pk: 'bucket',
          select: 'buckets',
          delete: 'deleteBuckets',
          update: 'updateBuckets',
          delete_by_pk: 'deleteBucket',
          update_by_pk: 'updateBucket'
        },
        custom_column_names: {
          min_upload_file_size: 'minUploadFileSize',
          download_expiration: 'downloadExpiration',
          presigned_urls_enabled: 'presignedUrlsEnabled',
          cache_control: 'cacheControl',
          updated_at: 'updatedAt',
          created_at: 'createdAt',
          id: 'id',
          max_upload_file_size: 'maxUploadFileSize'
        },
      },
    }
  });
  
  await api.sql(sql`CREATE OR REPLACE FUNCTION files__promise__update__function() RETURNS TRIGGER AS $$ 
  DECLARE 
    PROMISE bigint;
    SELECTOR record;
    LINK links;
    HANDLE_UPDATE record;
    user_id bigint;
    hasura_session json;
  BEGIN
    SELECT l.* into LINK
    FROM links as l
    WHERE l."id" = NEW."link_id";

    FOR HANDLE_UPDATE IN
      SELECT id, type_id FROM links l
      WHERE
      l."from_id" = LINK."type_id"
      AND l."type_id" = ${deep.idLocal('@deep-foundation/core', 'HandleUpdate')}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = l."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${deep.idLocal('@deep-foundation/core', 'DockerIsolationProvider')})
    LOOP
      PERFORM insert_promise(NEW."link_id", HANDLE_UPDATE."id", HANDLE_UPDATE."type_id", LINK, LINK, null, 'UPDATE');
    END LOOP;

    hasura_session := current_setting('hasura.user', 't');
    user_id := hasura_session::json->>'x-hasura-user-id';

    FOR SELECTOR IN
      SELECT s.selector_id, h.id as handle_operation_id, h.type_id as handle_operation_type_id, s.query_id
      FROM selectors s, links h
      WHERE
          s.item_id = NEW."link_id"
      AND s.selector_id = h.from_id
      AND h.type_id = ${deep.idLocal('@deep-foundation/core', 'HandleUpdate')}
      AND EXISTS(select true from links handlers, links supports, links isolation_providers where handlers.id = h."to_id" AND supports.
     id = handlers.from_id AND supports.from_id = isolation_providers.id AND isolation_providers.type_id = ${deep.idLocal('@deep-foundation/core', 'DockerIsolationProvider')})
    LOOP
      IF SELECTOR.query_id = 0 OR bool_exp_execute(NEW."link_id", SELECTOR.query_id, user_id) THEN
        PERFORM insert_promise(NEW."link_id", SELECTOR.handle_operation_id, SELECTOR.handle_operation_type_id, LINK, LINK, SELECTOR.selector_id, 'UPDATE');
      END IF;
    END LOOP;
    RETURN NEW;
  END; $$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER z_files__promise__update__trigger AFTER UPDATE ON storage.files FOR EACH ROW EXECUTE PROCEDURE files__promise__update__function();`);

  log('relationships');
  await api.query({
    type: 'create_object_relationship',
    args: {
      name: 'bucket',
      table: { name: 'files', schema: 'storage' },
      type: 'one_to_one',
      using: {
        manual_configuration: {
          remote_table: {
            schema: 'storage',
            name: 'buckets',
          },
          column_mapping: {
            bucket_id: 'id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: { name: 'buckets', schema: 'storage' },
      name: 'files',
      using: {
        manual_configuration: {
          remote_table: {
            schema: 'storage',
            name: 'files',
          },
          column_mapping: {
            id: 'bucket_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: { name: 'files', schema: 'storage' },
      name: 'link',
      type: 'one_to_one',
      using: {
        manual_configuration: {
          remote_table: {
            schema: 'public',
            name: 'links',
          },
          column_mapping: {
            link_id: 'id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: { name: 'links', schema: 'public' },
      name: 'file',
      type: 'one_to_one',
      using: {
        manual_configuration: {
          remote_table: {
            schema: 'storage',
            name: 'files',
          },
          column_mapping: {
            id: 'link_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  // log('permissions');
  
  await permissions(api, { name: 'buckets', schema: 'storage' }, {
    role: 'link',

    select: {},
    insert: {},
    update: {},
    delete: {},

    columns: '*',
    computed_fields: [],
  });

  const filesPermissions = {
    ...(await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')),
    select: {
      link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).select,
    },
    insert: {
      link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).update,
    },
    update: {
      link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).update,
    },
    delete: {
      link: (await linksPermissions(['$','link_id'], 'X-Hasura-User-Id', 'link')).update,
    },
    
    columns: '*',
    computed_fields: [],
  };

  await permissions(api, { name: 'files', schema: 'storage' }, filesPermissions);

  log('wait untill storage restart');
  // await waitOn({ resources: [`http-get://localhost:8000/healthz`] });

};

export const down = async () => {
  log('down');

  await api.sql(sql`DROP TRIGGER IF EXISTS z_files__promise__update__trigger ON storage.files;`);
  await api.sql(sql`DROP FUNCTION IF EXISTS files__promise__delete__function CASCADE;`);

  log('relationships');

  await api.query({
    type: 'drop_relationship',
    args: {
      table: { name: 'buckets', schema: 'storage' },
      relationship: 'files',
    },
  });

  await api.query({
    type: 'drop_relationship',
    args: {
      table: { name: 'files', schema: 'storage' },
      relationship: 'bucket',
    },
  });

  log('untrack');

  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: 'storage',
        name: 'files',
      },
      cascade: true,
    },
  });

  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: 'storage',
        name: 'buckets',
      },
      cascade: true,
    },
  });

  log('sql');
  
  await api.sql(sql`
  DROP TRIGGER set_storage_virus_updated_at ON storage.virus;

  DROP TABLE IF EXISTS viruses;

  ALTER TABLE "storage"."files" DROP COLUMN IF EXISTS "metadata";

  DO $$
    BEGIN
      IF EXISTS(SELECT table_name
                  FROM information_schema.tables
                WHERE table_schema = 'auth'
                  AND table_name LIKE 'users')
        AND NOT EXISTS(SELECT table_name
                  FROM information_schema.table_constraints
                WHERE table_schema = 'storage'
                  AND table_name = 'files'
                  AND constraint_name = 'fk_user')
      THEN
        ALTER TABLE storage.files
          ADD CONSTRAINT fk_user FOREIGN KEY (uploaded_by_user_id) REFERENCES auth.users (id) ON DELETE SET NULL;
      END IF;
    END 
  $$;

  ALTER TABLE storage.buckets
    DROP CONSTRAINT download_expiration_valid_range;

  BEGIN;

  -- triggers
  DROP TRIGGER set_storage_buckets_updated_at ON storage.buckets;
  DROP TRIGGER set_storage_files_updated_at ON storage.files;
  DROP TRIGGER check_default_bucket_delete ON storage.buckets;
  DROP TRIGGER check_default_bucket_update ON storage.buckets;

  -- constraints
  ALTER TABLE storage.files
    DROP CONSTRAINT fk_bucket;


  DO $$
  BEGIN
    IF EXISTS(SELECT table_name
              FROM information_schema.table_constraints
              WHERE table_schema = 'storage'
                AND table_name = 'files'
                AND constraint_name = '
                ')
    THEN
      ALTER TABLE storage.files
        DROP CONSTRAINT fk_user;
    END IF;
  END $$;



  -- tables
  DROP TABLE storage.buckets;
  DROP TABLE storage.files;

  -- functions
  DROP FUNCTION storage.set_current_timestamp_updated_at();
  DROP FUNCTION storage.protect_default_bucket_delete();
  DROP FUNCTION storage.protect_default_bucket_update();

  COMMIT;

  DROP EXTENSION IF EXISTS citext;
  DROP SCHEMA IF EXISTS storage;
  `);
};
