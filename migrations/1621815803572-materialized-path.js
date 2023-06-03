var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61;
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import { down as downRels, up as upRels } from '@deep-foundation/materialized-path/relationships.js';
import { down as downTable, up as upTable } from '@deep-foundation/materialized-path/table.js';
import { Trigger } from '@deep-foundation/materialized-path/trigger.js';
import Debug from 'debug';
import { _ids } from '../imports/client.js';
import { SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
const debug = Debug('deeplinks:migrations:materialized-path');
const log = debug.extend('log');
const error = debug.extend('error');
const client = generateApolloClient({
    path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
const api = new HasuraApi({
    path: process.env.MIGRATIONS_HASURA_PATH,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
export const MP_TABLE_NAME = 'mp';
export const TREE_TABLE_NAME = 'tree';
const triggerOptionos = {
    mpTableName: MP_TABLE_NAME,
    graphTableName: LINKS_TABLE_NAME,
    id_field: 'id',
    to_field: 'to_id',
    from_field: 'from_id',
    id_type: 'bigint',
    iteratorInsertDeclare: 'groupRow RECORD;',
    iteratorDeleteArgumentSend: 'groupRow',
    iteratorDeleteArgumentGet: 'groupRow RECORD',
    iteratorInsertBegin: `FOR groupRow IN (
    SELECT
    DISTINCT mpGroup."id"
    FROM
    ${LINKS_TABLE_NAME} as mpGroup,
    ${LINKS_TABLE_NAME} as mpInclude
    WHERE
    mpInclude."type_id" IN (${(_a = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _a === void 0 ? void 0 : _a.TreeIncludeDown},${(_b = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _b === void 0 ? void 0 : _b.TreeIncludeUp},${(_c = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _c === void 0 ? void 0 : _c.TreeIncludeNode}, ${(_d = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _d === void 0 ? void 0 : _d.TreeIncludeIn}, ${(_e = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _e === void 0 ? void 0 : _e.TreeIncludeOut}, ${(_f = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _f === void 0 ? void 0 : _f.TreeIncludeFromCurrent}, ${(_g = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _g === void 0 ? void 0 : _g.TreeIncludeToCurrent}, ${(_h = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _h === void 0 ? void 0 : _h.TreeIncludeCurrentFrom}, ${(_j = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _j === void 0 ? void 0 : _j.TreeIncludeCurrentTo}, ${(_k = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _k === void 0 ? void 0 : _k.TreeIncludeFromCurrentTo}, ${(_l = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _l === void 0 ? void 0 : _l.TreeIncludeToCurrentFrom}) AND
    mpInclude."to_id" IN (NEW.type_id, ${(_m = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _m === void 0 ? void 0 : _m.Any}) AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = ${(_o = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _o === void 0 ? void 0 : _o.Tree} AND
    ((groupid != 0 AND groupid = mpGroup."id") OR groupid = 0)
    ) LOOP`,
    iteratorInsertEnd: 'END LOOP;',
    groupInsert: 'groupRow."id"',
    additionalFields: '',
    additionalData: '',
    iteratorDeleteDeclare: 'groupRow RECORD;',
    iteratorDeleteBegin: `FOR groupRow IN (
    SELECT
    mpGroup.*
    FROM
    ${LINKS_TABLE_NAME} as mpGroup,
    ${LINKS_TABLE_NAME} as mpInclude
    WHERE
    mpInclude."type_id" IN (${(_p = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _p === void 0 ? void 0 : _p.TreeIncludeDown},${(_q = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _q === void 0 ? void 0 : _q.TreeIncludeUp},${(_r = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _r === void 0 ? void 0 : _r.TreeIncludeNode}, ${(_s = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _s === void 0 ? void 0 : _s.TreeIncludeIn}, ${(_t = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _t === void 0 ? void 0 : _t.TreeIncludeOut}, ${(_u = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _u === void 0 ? void 0 : _u.TreeIncludeFromCurrent}, ${(_v = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _v === void 0 ? void 0 : _v.TreeIncludeToCurrent}, ${(_w = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _w === void 0 ? void 0 : _w.TreeIncludeCurrentFrom}, ${(_x = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _x === void 0 ? void 0 : _x.TreeIncludeCurrentTo}, ${(_y = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _y === void 0 ? void 0 : _y.TreeIncludeFromCurrentTo}, ${(_z = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _z === void 0 ? void 0 : _z.TreeIncludeToCurrentFrom}) AND
    mpInclude."to_id" IN (OLD.type_id, ${(_0 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _0 === void 0 ? void 0 : _0.Any}) AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = ${(_1 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _1 === void 0 ? void 0 : _1.Tree}
  ) LOOP`,
    iteratorDeleteEnd: 'END LOOP;',
    groupDelete: 'groupRow."id"',
    isAllowSpreadFromCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${(_2 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _2 === void 0 ? void 0 : _2.TreeIncludeDown}, ${(_3 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _3 === void 0 ? void 0 : _3.TreeIncludeIn}, ${(_4 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _4 === void 0 ? void 0 : _4.TreeIncludeFromCurrent}, ${(_5 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _5 === void 0 ? void 0 : _5.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
  )`,
    isAllowSpreadCurrentTo: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${(_6 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _6 === void 0 ? void 0 : _6.TreeIncludeDown}, ${(_7 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _7 === void 0 ? void 0 : _7.TreeIncludeOut}, ${(_8 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _8 === void 0 ? void 0 : _8.TreeIncludeCurrentTo}, ${(_9 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _9 === void 0 ? void 0 : _9.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
    AND
    EXISTS (SELECT * FROM ${LINKS_TABLE_NAME} as child, ${LINKS_TABLE_NAME} as include WHERE
      child."id" = CURRENT."to_id" AND
      include."type_id" IN (${(_10 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _10 === void 0 ? void 0 : _10.TreeIncludeDown},${(_11 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _11 === void 0 ? void 0 : _11.TreeIncludeUp},${(_12 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _12 === void 0 ? void 0 : _12.TreeIncludeNode}, ${(_13 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _13 === void 0 ? void 0 : _13.TreeIncludeIn}, ${(_14 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _14 === void 0 ? void 0 : _14.TreeIncludeOut}, ${(_15 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _15 === void 0 ? void 0 : _15.TreeIncludeFromCurrent}, ${(_16 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _16 === void 0 ? void 0 : _16.TreeIncludeToCurrent}, ${(_17 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _17 === void 0 ? void 0 : _17.TreeIncludeCurrentFrom}, ${(_18 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _18 === void 0 ? void 0 : _18.TreeIncludeCurrentTo}, ${(_19 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _19 === void 0 ? void 0 : _19.TreeIncludeFromCurrentTo}, ${(_20 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _20 === void 0 ? void 0 : _20.TreeIncludeToCurrentFrom}) AND
      include."from_id" = groupRow.id AND
      include."to_id" IN (child.type_id, ${(_21 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _21 === void 0 ? void 0 : _21.Any})
    )
  )`,
    isAllowSpreadToCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${(_22 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _22 === void 0 ? void 0 : _22.TreeIncludeUp}, ${(_23 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _23 === void 0 ? void 0 : _23.TreeIncludeIn}, ${(_24 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _24 === void 0 ? void 0 : _24.TreeIncludeToCurrent}, ${(_25 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _25 === void 0 ? void 0 : _25.TreeIncludeToCurrentFrom}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
  )`,
    isAllowSpreadCurrentFrom: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${(_26 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _26 === void 0 ? void 0 : _26.TreeIncludeUp}, ${(_27 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _27 === void 0 ? void 0 : _27.TreeIncludeOut}, ${(_28 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _28 === void 0 ? void 0 : _28.TreeIncludeCurrentFrom}, ${(_29 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _29 === void 0 ? void 0 : _29.TreeIncludeToCurrentFrom}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
    AND
    EXISTS (SELECT * FROM ${LINKS_TABLE_NAME} as child, ${LINKS_TABLE_NAME} as include WHERE
      child."id" = CURRENT."from_id" AND
      include."type_id" IN (${(_30 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _30 === void 0 ? void 0 : _30.TreeIncludeDown},${(_31 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _31 === void 0 ? void 0 : _31.TreeIncludeUp},${(_32 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _32 === void 0 ? void 0 : _32.TreeIncludeNode}, ${(_33 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _33 === void 0 ? void 0 : _33.TreeIncludeIn}, ${(_34 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _34 === void 0 ? void 0 : _34.TreeIncludeOut}, ${(_35 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _35 === void 0 ? void 0 : _35.TreeIncludeFromCurrent}, ${(_36 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _36 === void 0 ? void 0 : _36.TreeIncludeToCurrent}, ${(_37 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _37 === void 0 ? void 0 : _37.TreeIncludeCurrentFrom}, ${(_38 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _38 === void 0 ? void 0 : _38.TreeIncludeCurrentTo}, ${(_39 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _39 === void 0 ? void 0 : _39.TreeIncludeFromCurrentTo}, ${(_40 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _40 === void 0 ? void 0 : _40.TreeIncludeToCurrentFrom}) AND
      include."from_id" = groupRow.id AND
      include."to_id" IN (child.type_id, ${(_41 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _41 === void 0 ? void 0 : _41.Any})
    )
  )`,
    isAllowSpreadToInCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${(_42 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _42 === void 0 ? void 0 : _42.TreeIncludeDown}, ${(_43 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _43 === void 0 ? void 0 : _43.TreeIncludeOut}, ${(_44 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _44 === void 0 ? void 0 : _44.TreeIncludeCurrentTo}, ${(_45 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _45 === void 0 ? void 0 : _45.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${(_46 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _46 === void 0 ? void 0 : _46.Any})
  )`,
    isAllowSpreadCurrentFromOut: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${(_47 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _47 === void 0 ? void 0 : _47.TreeIncludeDown}, ${(_48 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _48 === void 0 ? void 0 : _48.TreeIncludeIn}, ${(_49 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _49 === void 0 ? void 0 : _49.TreeIncludeFromCurrent}, ${(_50 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _50 === void 0 ? void 0 : _50.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${(_51 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _51 === void 0 ? void 0 : _51.Any})
  )`,
    isAllowSpreadFromOutCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${(_52 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _52 === void 0 ? void 0 : _52.TreeIncludeUp}, ${(_53 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _53 === void 0 ? void 0 : _53.TreeIncludeOut}, ${(_54 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _54 === void 0 ? void 0 : _54.TreeIncludeCurrentFrom}, ${(_55 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _55 === void 0 ? void 0 : _55.TreeIncludeToCurrentFrom}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${(_56 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _56 === void 0 ? void 0 : _56.Any})
  )`,
    isAllowSpreadCurrentToIn: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${(_57 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _57 === void 0 ? void 0 : _57.TreeIncludeUp}, ${(_58 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _58 === void 0 ? void 0 : _58.TreeIncludeIn}, ${(_59 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _59 === void 0 ? void 0 : _59.TreeIncludeToCurrent}, ${(_60 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _60 === void 0 ? void 0 : _60.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${(_61 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _61 === void 0 ? void 0 : _61.Any})
  )`,
    postfix: '',
};
const trigger = Trigger(triggerOptionos);
const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_TREE_TABLE = TREE_TABLE_NAME;
const DEFAULT_GRAPH_TABLE = LINKS_TABLE_NAME;
export const upTreeSchema = ({ SCHEMA = DEFAULT_SCHEMA, TREE_TABLE = DEFAULT_TREE_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE, ID_FIELD = 'id', api }) => __awaiter(void 0, void 0, void 0, function* () {
    yield api.query({
        type: 'create_select_permission',
        args: {
            table: TREE_TABLE,
            role: 'guest',
            permission: {
                columns: '*',
                filter: {},
                limit: 999,
                allow_aggregations: true
            }
        }
    });
    yield api.query({
        type: 'create_select_permission',
        args: {
            table: TREE_TABLE,
            role: 'user',
            permission: {
                columns: '*',
                filter: {},
                limit: 999,
                allow_aggregations: true
            }
        }
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: GRAPH_TABLE,
            name: 'up',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TREE_TABLE,
                    },
                    column_mapping: {
                        [ID_FIELD]: 'link_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: GRAPH_TABLE,
            name: 'down',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TREE_TABLE,
                    },
                    column_mapping: {
                        [ID_FIELD]: 'parent_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: GRAPH_TABLE,
            name: 'root',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TREE_TABLE,
                    },
                    column_mapping: {
                        [ID_FIELD]: 'root_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: GRAPH_TABLE,
            name: TREE_TABLE_NAME,
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TREE_TABLE,
                    },
                    column_mapping: {
                        [ID_FIELD]: 'tree_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_object_relationship',
        args: {
            table: TREE_TABLE,
            name: 'link',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: GRAPH_TABLE,
                    },
                    column_mapping: {
                        link_id: ID_FIELD,
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_object_relationship',
        args: {
            table: TREE_TABLE,
            name: 'parent',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: GRAPH_TABLE,
                    },
                    column_mapping: {
                        parent_id: ID_FIELD,
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_object_relationship',
        args: {
            table: TREE_TABLE,
            name: 'root',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: GRAPH_TABLE,
                    },
                    column_mapping: {
                        root_id: ID_FIELD,
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_object_relationship',
        args: {
            table: TREE_TABLE,
            name: 'tree',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: GRAPH_TABLE,
                    },
                    column_mapping: {
                        tree_id: ID_FIELD,
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: TREE_TABLE,
            name: 'by_link',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TREE_TABLE,
                    },
                    column_mapping: {
                        link_id: 'link_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: TREE_TABLE,
            name: 'by_parent',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TREE_TABLE,
                    },
                    column_mapping: {
                        parent_id: 'parent_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: TREE_TABLE,
            name: 'by_position',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TREE_TABLE,
                    },
                    column_mapping: {
                        position_id: 'position_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_object_relationship',
        args: {
            table: TREE_TABLE,
            name: 'by_tree',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: GRAPH_TABLE,
                    },
                    column_mapping: {
                        tree_id: ID_FIELD,
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
    yield api.query({
        type: 'create_array_relationship',
        args: {
            table: TREE_TABLE,
            name: 'by_root',
            using: {
                manual_configuration: {
                    remote_table: {
                        schema: SCHEMA,
                        name: TREE_TABLE,
                    },
                    column_mapping: {
                        root_id: 'root_id',
                    },
                    insertion_order: 'after_parent',
                },
            },
        },
    });
});
export const downTreeSchema = ({ SCHEMA = DEFAULT_SCHEMA, TREE_TABLE = DEFAULT_TREE_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE, api }) => __awaiter(void 0, void 0, void 0, function* () {
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: GRAPH_TABLE,
            relationship: 'up',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: GRAPH_TABLE,
            relationship: 'down',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: GRAPH_TABLE,
            relationship: 'root',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: GRAPH_TABLE,
            relationship: TREE_TABLE_NAME,
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: TREE_TABLE,
            relationship: 'link',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: TREE_TABLE,
            relationship: 'parent',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: TREE_TABLE,
            relationship: 'root',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: TREE_TABLE,
            relationship: 'by_link',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: TREE_TABLE,
            relationship: 'by_parent',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: TREE_TABLE,
            relationship: 'by_position',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: TREE_TABLE,
            relationship: 'by_tree',
            cascade: true,
        },
    });
    yield api.query({
        type: 'drop_relationship',
        args: {
            table: TREE_TABLE,
            relationship: 'by_root',
            cascade: true,
        },
    });
});
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    var _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, _100, _101, _102, _103, _104, _105, _106, _107, _108, _109, _110, _111;
    log('up');
    yield upTable({
        MP_TABLE: MP_TABLE_NAME, customColumns: '',
        api,
    });
    yield upRels({
        SCHEMA,
        MP_TABLE: MP_TABLE_NAME,
        GRAPH_TABLE: LINKS_TABLE_NAME,
        api,
    });
    yield api.sql(trigger.upFunctionInsertNode());
    yield api.sql(trigger.upFunctionUpdateNode());
    yield api.sql(trigger.upFunctionDeleteNode());
    yield api.sql(trigger.upTriggerDelete());
    yield api.sql(trigger.upTriggerUpdate());
    yield api.sql(trigger.upTriggerInsert());
    yield (() => {
        const { mpTableName, graphTableName, id_field, to_field, from_field, id_type, iteratorInsertDeclare, iteratorInsertBegin, iteratorInsertEnd, iteratorDeleteArgumentSend, iteratorDeleteArgumentGet, iteratorDeleteDeclare, iteratorDeleteBegin, iteratorDeleteEnd, groupInsert, groupDelete, additionalFields, additionalData, isAllowSpreadFromCurrent, isAllowSpreadCurrentTo, isAllowSpreadToCurrent, isAllowSpreadCurrentFrom, isAllowSpreadToInCurrent, isAllowSpreadCurrentFromOut, isAllowSpreadFromOutCurrent, isAllowSpreadCurrentToIn, postfix, } = triggerOptionos;
    })();
    yield api.sql(sql `select create_btree_indexes_for_all_columns('${SCHEMA}', '${MP_TABLE_NAME}');`);
    yield api.sql(sql `CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__insert__function() RETURNS TRIGGER AS $trigger$ BEGIN
    IF (NEW."type_id" IN (${(_62 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _62 === void 0 ? void 0 : _62.TreeIncludeDown},${(_63 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _63 === void 0 ? void 0 : _63.TreeIncludeUp},${(_64 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _64 === void 0 ? void 0 : _64.TreeIncludeNode}, ${(_65 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _65 === void 0 ? void 0 : _65.TreeIncludeIn}, ${(_66 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _66 === void 0 ? void 0 : _66.TreeIncludeOut}, ${(_67 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _67 === void 0 ? void 0 : _67.TreeIncludeFromCurrent}, ${(_68 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _68 === void 0 ? void 0 : _68.TreeIncludeToCurrent}, ${(_69 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _69 === void 0 ? void 0 : _69.TreeIncludeCurrentFrom}, ${(_70 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _70 === void 0 ? void 0 : _70.TreeIncludeCurrentTo}, ${(_71 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _71 === void 0 ? void 0 : _71.TreeIncludeFromCurrentTo}, ${(_72 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _72 === void 0 ? void 0 : _72.TreeIncludeToCurrentFrom})) THEN
      PERFORM ${MP_TABLE_NAME}__insert_link__function_core(${LINKS_TABLE_NAME}.*, NEW."from_id")
      FROM ${LINKS_TABLE_NAME} WHERE type_id=NEW."to_id" OR NEW."to_id"=${(_73 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _73 === void 0 ? void 0 : _73.Any};
    END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
    yield api.sql(sql `CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__update__function() RETURNS TRIGGER AS $trigger$
  DECLARE groupRow RECORD;
  BEGIN
    IF (NEW."type_id" IN (${(_74 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _74 === void 0 ? void 0 : _74.TreeIncludeDown},${(_75 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _75 === void 0 ? void 0 : _75.TreeIncludeUp},${(_76 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _76 === void 0 ? void 0 : _76.TreeIncludeNode}, ${(_77 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _77 === void 0 ? void 0 : _77.TreeIncludeIn}, ${(_78 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _78 === void 0 ? void 0 : _78.TreeIncludeOut}, ${(_79 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _79 === void 0 ? void 0 : _79.TreeIncludeFromCurrent}, ${(_80 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _80 === void 0 ? void 0 : _80.TreeIncludeToCurrent}, ${(_81 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _81 === void 0 ? void 0 : _81.TreeIncludeCurrentFrom}, ${(_82 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _82 === void 0 ? void 0 : _82.TreeIncludeCurrentTo}, ${(_83 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _83 === void 0 ? void 0 : _83.TreeIncludeFromCurrentTo}, ${(_84 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _84 === void 0 ? void 0 : _84.TreeIncludeToCurrentFrom})) THEN
      SELECT ${LINKS_TABLE_NAME}.* INTO groupRow FROM ${LINKS_TABLE_NAME} WHERE "id"=OLD."from_id" AND "type_id" = ${(_85 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _85 === void 0 ? void 0 : _85.Tree};
      PERFORM ${MP_TABLE_NAME}__delete_link__function_core(${LINKS_TABLE_NAME}.*, groupRow)
      FROM ${LINKS_TABLE_NAME} WHERE type_id=OLD."to_id" OR OLD."to_id"=${(_86 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _86 === void 0 ? void 0 : _86.Any};
    END IF;
    IF (NEW."type_id" IN (${(_87 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _87 === void 0 ? void 0 : _87.TreeIncludeDown},${(_88 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _88 === void 0 ? void 0 : _88.TreeIncludeUp},${(_89 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _89 === void 0 ? void 0 : _89.TreeIncludeNode}, ${(_90 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _90 === void 0 ? void 0 : _90.TreeIncludeIn}, ${(_91 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _91 === void 0 ? void 0 : _91.TreeIncludeOut}, ${(_92 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _92 === void 0 ? void 0 : _92.TreeIncludeFromCurrent}, ${(_93 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _93 === void 0 ? void 0 : _93.TreeIncludeToCurrent}, ${(_94 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _94 === void 0 ? void 0 : _94.TreeIncludeCurrentFrom}, ${(_95 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _95 === void 0 ? void 0 : _95.TreeIncludeCurrentTo}, ${(_96 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _96 === void 0 ? void 0 : _96.TreeIncludeFromCurrentTo}, ${(_97 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _97 === void 0 ? void 0 : _97.TreeIncludeToCurrentFrom})) THEN
      PERFORM ${MP_TABLE_NAME}__insert_link__function_core(${LINKS_TABLE_NAME}.*, NEW."from_id")
      FROM ${LINKS_TABLE_NAME} WHERE type_id=NEW."to_id" OR NEW."to_id"=${(_98 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _98 === void 0 ? void 0 : _98.Any};
    END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
    yield api.sql(sql `CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__delete__function() RETURNS TRIGGER AS $trigger$
  DECLARE groupRow RECORD;
  BEGIN
    -- if delete link - is group include link
    IF (OLD."type_id" IN (${(_99 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _99 === void 0 ? void 0 : _99.TreeIncludeDown},${(_100 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _100 === void 0 ? void 0 : _100.TreeIncludeUp},${(_101 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _101 === void 0 ? void 0 : _101.TreeIncludeNode}, ${(_102 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _102 === void 0 ? void 0 : _102.TreeIncludeIn}, ${(_103 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _103 === void 0 ? void 0 : _103.TreeIncludeOut}, ${(_104 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _104 === void 0 ? void 0 : _104.TreeIncludeFromCurrent}, ${(_105 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _105 === void 0 ? void 0 : _105.TreeIncludeToCurrent}, ${(_106 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _106 === void 0 ? void 0 : _106.TreeIncludeCurrentFrom}, ${(_107 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _107 === void 0 ? void 0 : _107.TreeIncludeCurrentTo}, ${(_108 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _108 === void 0 ? void 0 : _108.TreeIncludeFromCurrentTo}, ${(_109 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _109 === void 0 ? void 0 : _109.TreeIncludeToCurrentFrom})) THEN
      SELECT ${LINKS_TABLE_NAME}.* INTO groupRow FROM ${LINKS_TABLE_NAME} WHERE "id"=OLD."from_id" AND "type_id" = ${(_110 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _110 === void 0 ? void 0 : _110.Tree};
      PERFORM ${MP_TABLE_NAME}__delete_link__function_core(${LINKS_TABLE_NAME}.*, groupRow)
      FROM ${LINKS_TABLE_NAME} WHERE type_id=OLD."to_id" OR OLD."to_id"=${(_111 = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _111 === void 0 ? void 0 : _111.Any};
    END IF;
    RETURN OLD;
  END; $trigger$ LANGUAGE plpgsql;`);
    yield api.sql(sql `CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__insert__trigger AFTER INSERT ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__insert__function();`);
    yield api.sql(sql `CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__delete__trigger AFTER DELETE ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__delete__function();`);
    yield api.sql(sql `CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__update__trigger AFTER UPDATE ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__update__function();`);
    log('tree view');
    yield api.sql(sql `
    CREATE VIEW tree AS
    SELECT
      mp."id" as "id",
      mp."item_id" as "link_id",
      mp."path_item_id" as "parent_id",
      mp."path_item_depth" as "depth",
      mp."root_id" as "root_id",
      mp."position_id" as "position_id",
      mp."group_id" as "tree_id",
      (mp."item_id" = mp."path_item_id") as "self"
    FROM
    ${MP_TABLE_NAME} as mp;
  `);
    yield api.query({
        type: 'track_table',
        args: {
            schema: SCHEMA,
            name: TREE_TABLE_NAME,
        },
    });
    upTreeSchema({ api });
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
    log('tree view');
    yield downTreeSchema({ api });
    yield api.query({
        type: 'untrack_table',
        args: {
            table: {
                schema: SCHEMA,
                name: TREE_TABLE_NAME,
            },
            cascade: true,
        },
    });
    yield api.sql(sql `
    DROP VIEW IF EXISTS ${SCHEMA}."tree" CASCADE;
  `);
    log('dropInclude');
    yield api.sql(sql `DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__insert__function CASCADE;`);
    yield api.sql(sql `DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__update__function CASCADE;`);
    yield api.sql(sql `DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__delete__function CASCADE;`);
    yield api.sql(sql `DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__insert__trigger ON "${LINKS_TABLE_NAME}";`);
    yield api.sql(sql `DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__update__trigger ON "${LINKS_TABLE_NAME}";`);
    yield api.sql(sql `DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__delete__trigger ON "${LINKS_TABLE_NAME}";`);
    log('dropRels');
    yield downRels({
        MP_TABLE: MP_TABLE_NAME,
        GRAPH_TABLE: LINKS_TABLE_NAME,
        api,
    });
    log('dropTrigger');
    yield api.sql(trigger.downFunctionInsertNode());
    yield api.sql(trigger.downFunctionUpdateNode());
    yield api.sql(trigger.downFunctionDeleteNode());
    yield api.sql(trigger.downTriggerDelete());
    yield api.sql(trigger.downTriggerUpdate());
    yield api.sql(trigger.downTriggerInsert());
    log('dropTable');
    yield downTable({
        MP_TABLE: MP_TABLE_NAME,
        api,
    });
});
//# sourceMappingURL=1621815803572-materialized-path.js.map