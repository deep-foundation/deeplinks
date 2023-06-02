import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { api, SCHEMA } from './1616701513782-links.js';

const debug = Debug('deeplinks:migrations:selectors');
const log = debug.extend('log');
const error = debug.extend('error');

export const TABLE_NAME = 'selectors_cache';
export const LINKS_TABLE_NAME = 'links';
export const MP_TABLE_NAME = 'mp';

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
  log('selectors-cache table');
  await api.sql(sql`
    CREATE TABLE ${SCHEMA}."${TABLE_NAME}" (
      id bigint PRIMARY KEY,
      link_id bigint DEFAULT 0,
      tree_id bigint DEFAULT 0,
      selector_include_id bigint DEFAULT 0,
      selector_exclude_id bigint DEFAULT 0,
      selector_tree_id bigint DEFAULT 0,
      selector_filter_bool_exp_id bigint DEFAULT 0,
      selector_id bigint DEFAULT 0,
      rule_id bigint DEFAULT 0,
      rule_object_id bigint DEFAULT 0,
      rule_subject_id bigint DEFAULT 0,
      rule_action_id bigint DEFAULT 0
    );
    CREATE SEQUENCE ${TABLE_NAME}_id_seq
    AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${TABLE_NAME}_id_seq OWNED BY ${SCHEMA}."${TABLE_NAME}".id;
    ALTER TABLE ONLY ${SCHEMA}."${TABLE_NAME}" ALTER COLUMN id SET DEFAULT nextval('${TABLE_NAME}_id_seq'::regclass);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__id_hash ON ${TABLE_NAME} USING hash (id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__link_id_hash ON ${TABLE_NAME} USING hash (link_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__link_id_btree ON ${TABLE_NAME} USING btree (link_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__tree_id_hash ON ${TABLE_NAME} USING hash (tree_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__tree_id_btree ON ${TABLE_NAME} USING btree (tree_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_include_id_hash ON ${TABLE_NAME} USING hash (selector_include_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_include_id_btree ON ${TABLE_NAME} USING btree (selector_include_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_exclude_id_hash ON ${TABLE_NAME} USING hash (selector_exclude_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_exclude_id_btree ON ${TABLE_NAME} USING btree (selector_exclude_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_tree_id_hash ON ${TABLE_NAME} USING hash (selector_tree_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_tree_id_btree ON ${TABLE_NAME} USING btree (selector_tree_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_filter_bool_exp_id_hash ON ${TABLE_NAME} USING hash (selector_filter_bool_exp_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_filter_bool_exp_id_btree ON ${TABLE_NAME} USING btree (selector_filter_bool_exp_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_id_hash ON ${TABLE_NAME} USING hash (selector_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__selector_id_btree ON ${TABLE_NAME} USING btree (selector_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__rule_id_hash ON ${TABLE_NAME} USING hash (rule_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__rule_id_btree ON ${TABLE_NAME} USING btree (rule_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__rule_object_id_hash ON ${TABLE_NAME} USING hash (rule_object_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__rule_object_id_btree ON ${TABLE_NAME} USING btree (rule_object_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__rule_subject_id_hash ON ${TABLE_NAME} USING hash (rule_subject_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__rule_subject_id_btree ON ${TABLE_NAME} USING btree (rule_subject_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__rule_action_id_hash ON ${TABLE_NAME} USING hash (rule_action_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__rule_action_id_btree ON ${TABLE_NAME} USING btree (rule_action_id);
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: `${TABLE_NAME}`,
    },
  });
  log('selectors-cache trigger');
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${TABLE_NAME}__insert__function() RETURNS TRIGGER AS $trigger$
    DECLARE
      selectorTree RECORD;
      selectorCursor RECORD;
      selectorFilter RECORD;
      boolExpId bigint = 0;
      selectorId bigint;
      ruleAction RECORD;
      ruleObject RECORD;
      caches RECORD;
      ruleSubject RECORD;
      insertedIncludeId bigint = 0;
      insertedExcludeId bigint = 0;
    BEGIN
      IF (NEW."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorTree')}) THEN
        selectorTree := NEW;

        SELECT t.* into selectorCursor
        FROM "${LINKS_TABLE_NAME}" as t
        WHERE (
          t."id" = selectorTree."from_id"
        );

        IF (selectorCursor IS NOT NULL) THEN
          SELECT t.* into selectorFilter
          FROM "${LINKS_TABLE_NAME}" as t
          WHERE (
            t."from_id" = selectorCursor."from_id" AND
            t."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorFilter')}
          );
          IF selectorFilter IS NOT NULL THEN
            boolExpId := selectorFilter."to_id";
          END IF;

          SELECT t.* into ruleAction
          FROM "${LINKS_TABLE_NAME}" as t
          WHERE (
            t."to_id" = selectorCursor."from_id" AND
            t."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleAction')}
          );

          SELECT t.* into ruleObject
          FROM "${LINKS_TABLE_NAME}" as t
          WHERE (
            t."to_id" = selectorCursor."from_id" AND
            t."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleObject')}
          );

          SELECT t.* into ruleSubject
          FROM "${LINKS_TABLE_NAME}" as t
          WHERE (
            t."to_id" = selectorCursor."from_id" AND
            t."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleSubject')}
          );

          IF (selectorCursor."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorInclude')}) THEN
            INSERT INTO "${TABLE_NAME}" ("link_id", "tree_id", "selector_include_id", "selector_tree_id", "selector_id", "selector_filter_bool_exp_id") VALUES (selectorCursor."to_id", selectorTree."to_id", selectorCursor."id", selectorTree."id", selectorCursor."from_id", boolExpId) RETURNING "id" into insertedIncludeId;
          END IF;
          IF (selectorCursor."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorExclude')}) THEN
            INSERT INTO "${TABLE_NAME}" ("link_id", "tree_id", "selector_exclude_id", "selector_tree_id", "selector_id", "selector_filter_bool_exp_id") VALUES (selectorCursor."to_id", selectorTree."to_id", selectorCursor."id", selectorTree."id", selectorCursor."from_id", boolExpId) RETURNING "id" into insertedExcludeId;
          END IF;

          IF (ruleAction IS NOT NULL) THEN
            FOR caches
            IN (
              SELECT cache.*
              FROM "${TABLE_NAME}" as cache
              WHERE cache."id" IN (insertedIncludeId, insertedExcludeId) AND (
                cache."selector_include_id" != 0 OR cache."selector_exclude_id" != 0
              )
            )
            LOOP
              INSERT INTO "${TABLE_NAME}" ("link_id", "tree_id", "selector_include_id", "selector_exclude_id", "selector_tree_id", "selector_id", "selector_filter_bool_exp_id", "rule_id", "rule_action_id") VALUES (caches."link_id", caches."tree_id", caches."selector_include_id", caches."selector_exclude_id", caches."selector_tree_id", caches."selector_id", caches."selector_filter_bool_exp_id", ruleAction."from_id", ruleAction."id");
            END LOOP;
          END IF;
          IF (ruleObject IS NOT NULL) THEN
            FOR caches
            IN (
              SELECT cache.*
              FROM "${TABLE_NAME}" as cache
              WHERE cache."id" IN (insertedIncludeId, insertedExcludeId) AND (
                cache."selector_include_id" != 0 OR cache."selector_exclude_id" != 0
              )
            )
            LOOP
              INSERT INTO "${TABLE_NAME}" ("link_id", "tree_id", "selector_include_id", "selector_exclude_id", "selector_tree_id", "selector_id", "selector_filter_bool_exp_id", "rule_id", "rule_object_id") VALUES (caches."link_id", caches."tree_id", caches."selector_include_id", caches."selector_exclude_id", caches."selector_tree_id", caches."selector_id", caches."selector_filter_bool_exp_id", ruleObject."from_id", ruleObject."id");
            END LOOP;
          END IF;
          IF (ruleSubject IS NOT NULL) THEN
            FOR caches
            IN (
              SELECT cache.*
              FROM "${TABLE_NAME}" as cache
              WHERE cache."id" IN (insertedIncludeId, insertedExcludeId) AND (
                cache."selector_include_id" != 0 OR cache."selector_exclude_id" != 0
              )
            )
            LOOP
              INSERT INTO "${TABLE_NAME}" ("link_id", "tree_id", "selector_include_id", "selector_exclude_id", "selector_tree_id", "selector_id", "selector_filter_bool_exp_id", "rule_id", "rule_subject_id") VALUES (caches."link_id", caches."tree_id", caches."selector_include_id", caches."selector_exclude_id", caches."selector_tree_id", caches."selector_id", caches."selector_filter_bool_exp_id", ruleSubject."from_id", ruleSubject."id");
            END LOOP;
          END IF;
        END IF;
      END IF;

      IF (NEW."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorFilter')}) THEN
        UPDATE "${TABLE_NAME}" SET "selector_filter_bool_exp_id" = NEW."to_id" WHERE "selector_id" = NEW."from_id";
      END IF;

      IF (NEW."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorInclude')}) THEN 
        FOR caches IN ( 
          SELECT DISTINCT ON(cache."selector_tree_id", cache."selector_id", cache."rule_id", cache."rule_object_id", cache."rule_subject_id", cache."rule_action_id")
                 cache.*
          FROM "${TABLE_NAME}" as cache
          WHERE cache."selector_id" = NEW."from_id"
        ) 
        LOOP 
          INSERT INTO "${TABLE_NAME}" (
            "link_id",
            "selector_include_id",
            "selector_filter_bool_exp_id",
            "selector_tree_id",
            "selector_id",
            "rule_id", 
            "rule_object_id",
            "rule_subject_id",
            "rule_action_id"
          ) VALUES (
            NEW."to_id",
            NEW."id",
            caches."selector_filter_bool_exp_id",
            caches."selector_tree_id",
            caches."selector_id",
            caches."rule_id",
            caches."rule_object_id",
            caches."rule_subject_id",
            caches."rule_action_id"
          );
        END LOOP;
        -- TODO: Insert selector include cache row if nothing to multiply (first creation of selector and selector include)
      END IF;

      IF (NEW."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleAction')}) THEN
        FOR caches
        IN (
          SELECT cache.*
          FROM "${TABLE_NAME}" as cache
          WHERE cache."selector_id" = NEW."to_id" AND cache."rule_id" = 0 AND (
            cache."selector_include_id" != 0 OR cache."selector_exclude_id" != 0
          )
        )
        LOOP
          INSERT INTO "${TABLE_NAME}" ("link_id", "tree_id", "selector_include_id", "selector_exclude_id", "selector_tree_id", "selector_id", "selector_filter_bool_exp_id", "rule_id", "rule_action_id") VALUES (caches."link_id", caches."tree_id", caches."selector_include_id", caches."selector_exclude_id", caches."selector_tree_id", caches."selector_id", caches."selector_filter_bool_exp_id", NEW."from_id", NEW."id");
        END LOOP;
      END IF;
      IF (NEW."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleObject')}) THEN
        FOR caches
        IN (
          SELECT cache.*
          FROM "${TABLE_NAME}" as cache
          WHERE cache."selector_id" = NEW."to_id" AND cache."rule_id" = 0 AND (
            cache."selector_include_id" != 0 OR cache."selector_exclude_id" != 0
          )
        )
        LOOP
          INSERT INTO "${TABLE_NAME}" ("link_id", "tree_id", "selector_include_id", "selector_exclude_id", "selector_tree_id", "selector_id", "selector_filter_bool_exp_id", "rule_id", "rule_object_id") VALUES (caches."link_id", caches."tree_id", caches."selector_include_id", caches."selector_exclude_id", caches."selector_tree_id", caches."selector_id", caches."selector_filter_bool_exp_id", NEW."from_id", NEW."id");
        END LOOP;
      END IF;
      IF (NEW."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleSubject')}) THEN
        FOR caches
        IN (
          SELECT cache.*
          FROM "${TABLE_NAME}" as cache
          WHERE cache."selector_id" = NEW."to_id" AND cache."rule_id" = 0 AND (
            cache."selector_include_id" != 0 OR cache."selector_exclude_id" != 0
          )
        )
        LOOP
          INSERT INTO "${TABLE_NAME}" ("link_id", "tree_id", "selector_include_id", "selector_exclude_id", "selector_tree_id", "selector_id", "selector_filter_bool_exp_id", "rule_id", "rule_subject_id") VALUES (caches."link_id", caches."tree_id", caches."selector_include_id", caches."selector_exclude_id", caches."selector_tree_id", caches."selector_id", caches."selector_filter_bool_exp_id", NEW."from_id", NEW."id");
        END LOOP;
      END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${TABLE_NAME}__insert__trigger AFTER INSERT ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${TABLE_NAME}__insert__function();`);

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${TABLE_NAME}__delete__function() RETURNS TRIGGER AS $trigger$
    BEGIN
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'Selector')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "selector_id" = OLD."id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorInclude')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "selector_include_id" = OLD."id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorExclude')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "selector_exclude_id" = OLD."id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorTree')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "selector_tree_id" = OLD."id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'Tree')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "tree_id" = OLD."id";
      END IF;
      DELETE FROM ${TABLE_NAME} WHERE "link_id" = OLD."id";
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'SelectorFilter')}) THEN
        UPDATE "${TABLE_NAME}" SET "selector_filter_bool_exp_id" = 0 WHERE "selector_id" = OLD."from_id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'Query')}) THEN
        UPDATE "${TABLE_NAME}" SET "selector_filter_bool_exp_id" = 0 WHERE "selector_filter_bool_exp_id" = OLD."id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'Rule')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "rule_id" = OLD."id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleAction')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "rule_action_id" = OLD."id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleObject')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "rule_object_id" = OLD."id";
      END IF;
      IF (OLD."type_id" = ${deep.idLocal('@deep-foundation/core', 'RuleSubject')}) THEN
        DELETE FROM ${TABLE_NAME} WHERE "rule_subject_id" = OLD."id";
      END IF;
    RETURN OLD;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${TABLE_NAME}__delete__trigger AFTER DELETE ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${TABLE_NAME}__delete__function();`);
};

export const down = async () => {
  log('down');
  log('selectors-cache trigger');
  await api.sql(sql`
    DROP TRIGGER IF EXISTS ${TABLE_NAME}__insert__trigger ON ${LINKS_TABLE_NAME} CASCADE;
    DROP FUNCTION IF EXISTS ${TABLE_NAME}__insert__function() CASCADE;
  `);
  await api.sql(sql`
    DROP TRIGGER IF EXISTS ${TABLE_NAME}__delete__trigger ON ${LINKS_TABLE_NAME} CASCADE;
    DROP FUNCTION IF EXISTS ${TABLE_NAME}__delete__function() CASCADE;
  `);
  log('selectors-cache table');
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: TABLE_NAME,
      },
      cascade: true,
    },
  });
  await api.sql(sql`
    DROP TABLE ${TABLE_NAME} CASCADE;
  `);
};