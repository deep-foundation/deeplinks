var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import Debug from 'debug';
const debug = Debug('deeplinks:migrations:links');
const log = debug.extend('log');
const error = debug.extend('error');
export const api = new HasuraApi({
    path: process.env.MIGRATIONS_HASURA_PATH,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
export const SCHEMA = 'public';
export const TABLE_NAME = 'links';
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    yield api.sql(sql `
    CREATE TABLE ${SCHEMA}."${TABLE_NAME}" (
      id bigint PRIMARY KEY,
      from_id bigint DEFAULT 0,
      to_id bigint DEFAULT 0,
      type_id bigint NOT NULL
    );
    CREATE SEQUENCE ${TABLE_NAME}_id_seq
    AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${TABLE_NAME}_id_seq OWNED BY ${SCHEMA}."${TABLE_NAME}".id;
    ALTER TABLE ONLY ${SCHEMA}."${TABLE_NAME}" ALTER COLUMN id SET DEFAULT nextval('${TABLE_NAME}_id_seq'::regclass);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__id_hash ON ${TABLE_NAME} USING hash (id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__from_id_hash ON ${TABLE_NAME} USING hash (from_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__from_id_btree ON ${TABLE_NAME} USING btree (from_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__to_id_hash ON ${TABLE_NAME} USING hash (to_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__to_id_btree ON ${TABLE_NAME} USING btree (to_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__type_id_hash ON ${TABLE_NAME} USING hash (type_id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__type_id_btree ON ${TABLE_NAME} USING btree (type_id);
  `);
    yield api.sql(sql `
    CREATE TABLE ${SCHEMA}."${TABLE_NAME}__tables" (id bigint PRIMARY KEY, name TEXT);
    CREATE SEQUENCE ${TABLE_NAME}__tables_id_seq
    AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE ${TABLE_NAME}__tables_id_seq OWNED BY ${SCHEMA}."${TABLE_NAME}__tables".id;
    ALTER TABLE ONLY ${SCHEMA}."${TABLE_NAME}__tables" ALTER COLUMN id SET DEFAULT nextval('${TABLE_NAME}__tables_id_seq'::regclass);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__tables__id_hash ON ${TABLE_NAME}__tables USING hash (id);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__tables__name_hash ON ${TABLE_NAME}__tables USING hash (name);
    CREATE INDEX IF NOT EXISTS ${TABLE_NAME}__tables__name_btree ON ${TABLE_NAME}__tables USING btree (name);
  `);
    yield api.query({
        type: 'track_table',
        args: {
            schema: SCHEMA,
            name: `${TABLE_NAME}__tables`,
        },
    });
    yield api.sql(sql `CREATE OR REPLACE FUNCTION ${TABLE_NAME}__value__function(link ${TABLE_NAME}) RETURNS jsonb STABLE AS $function$ DECLARE
    exists int; str json; num json; obj json;
  BEGIN
    SELECT json_agg(t) FROM "strings" as t INTO str WHERE t."link_id"=link."id";
    SELECT json_agg(t) FROM "numbers" as t INTO num WHERE t."link_id"=link."id";
    SELECT json_agg(t) FROM "objects" as t INTO obj WHERE t."link_id"=link."id";
    IF (str IS NOT NULL) THEN RETURN (str->0); END IF;
    IF (num IS NOT NULL) THEN RETURN (num->0); END IF;
    IF (obj IS NOT NULL) THEN RETURN (obj->0); END IF;
    RETURN NULL;
  END; $function$ LANGUAGE plpgsql;`);
    yield api.query({
        type: 'track_table',
        args: {
            schema: SCHEMA,
            name: TABLE_NAME,
        },
    });
    yield api.query({
        type: 'add_computed_field',
        args: {
            table: TABLE_NAME,
            source: 'default',
            name: 'value',
            definition: {
                function: {
                    name: `${TABLE_NAME}__value__function`,
                    schema: 'public',
                },
                table_argument: 'link',
            }
        },
    });
    yield api.query({
        type: 'create_event_trigger',
        args: {
            name: TABLE_NAME,
            table: TABLE_NAME,
            webhook: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/links`,
            insert: {
                columns: "*",
                payload: '*',
            },
            update: {
                columns: '*',
                payload: '*',
            },
            delete: {
                columns: '*'
            },
            replace: false,
        },
    });
    yield api.query({
        type: 'create_object_relationship',
        args: {
            table: TABLE_NAME,
            name: 'from',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TABLE_NAME,
                    },
                    column_mapping: {
                        from_id: 'id',
                    },
                    insertion_order: 'before_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_object_relationship',
        args: {
            table: TABLE_NAME,
            name: 'to',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TABLE_NAME,
                    },
                    column_mapping: {
                        to_id: 'id',
                    },
                    insertion_order: 'before_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_object_relationship',
        args: {
            table: TABLE_NAME,
            name: 'type',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TABLE_NAME,
                    },
                    column_mapping: {
                        type_id: 'id',
                    },
                    insertion_order: 'before_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: TABLE_NAME,
            name: 'in',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TABLE_NAME,
                    },
                    column_mapping: {
                        id: 'to_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: TABLE_NAME,
            name: 'out',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TABLE_NAME,
                    },
                    column_mapping: {
                        id: 'from_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: TABLE_NAME,
            name: 'typed',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TABLE_NAME,
                    },
                    column_mapping: {
                        id: 'type_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    log('down');
    yield api.query({
        type: 'drop_computed_field',
        args: {
            table: TABLE_NAME,
            source: 'default',
            name: 'value',
            cascade: true,
        },
    });
    yield api.sql(sql `DROP FUNCTION IF EXISTS ${TABLE_NAME}__value__function CASCADE;`);
    yield api.query({
        type: 'untrack_table',
        args: {
            table: {
                schema: SCHEMA,
                name: TABLE_NAME,
            },
            cascade: true,
        },
    });
    yield api.sql(sql `
    DROP TABLE ${SCHEMA}."${TABLE_NAME}" CASCADE;
  `);
    const tables = (_c = (((_b = (_a = (yield api.sql(sql `
    SELECT * FROM ${TABLE_NAME}__tables;
  `))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.result) || [])) === null || _c === void 0 ? void 0 : _c.slice(1);
    yield api.query({
        type: 'untrack_table',
        args: {
            table: {
                schema: SCHEMA,
                name: `${TABLE_NAME}__tables`,
            },
            cascade: true,
        },
    });
    if (!!tables.length)
        yield api.sql(sql `
    ${tables.map(table => `DROP TABLE IF EXISTS ${table[1]} CASCADE;`).join('')}
  `);
    yield api.sql(sql `
    DROP TABLE ${TABLE_NAME}__tables CASCADE;
  `);
});
//# sourceMappingURL=1616701513782-links.js.map