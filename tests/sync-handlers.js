var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
import { assert, expect } from 'chai';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { insertHandler, insertSelector, insertSelectorItem, deleteHandler, deleteSelector } from "../imports/handlers";
import { HasuraApi } from '@deep-foundation/hasura/api';
import { sql } from '@deep-foundation/hasura/sql.js';
import { _ids } from '../imports/client.js';
import Debug from 'debug';
const debug = Debug('deeplinks:tests:sync-handlers');
const log = debug.extend('log');
const error = debug.extend('error');
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);
const delay = time => new Promise(res => setTimeout(res, time));
const HASURA_PATH = 'localhost:8080';
const HASURA_SSL = 0;
const HASURA_SECRET = 'myadminsecretkey';
export const api = new HasuraApi({
    path: HASURA_PATH,
    ssl: !!+HASURA_SSL,
    secret: HASURA_SECRET,
});
const apolloClient = generateApolloClient({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const deep = new DeepClient({ apolloClient });
const handleInsertTypeId = (_a = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _a === void 0 ? void 0 : _a.HandleInsert;
const handleUpdateTypeId = (_b = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _b === void 0 ? void 0 : _b.HandleUpdate;
const handleDeleteTypeId = (_c = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _c === void 0 ? void 0 : _c.HandleDelete;
;
const userTypeId = (_d = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _d === void 0 ? void 0 : _d.User;
const packageTypeId = (_e = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _e === void 0 ? void 0 : _e.Package;
const containTypeId = (_f = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _f === void 0 ? void 0 : _f.Contain;
const plv8SupportsJsTypeId = (_g = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _g === void 0 ? void 0 : _g.plv8SupportsJs;
const HandlerTypeId = (_h = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _h === void 0 ? void 0 : _h.Handler;
const SelectorTypeId = (_j = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _j === void 0 ? void 0 : _j.Selector;
const AllowSelectTypeId = (_k = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _k === void 0 ? void 0 : _k.AllowSelectType;
const AllowSelectId = (_l = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _l === void 0 ? void 0 : _l.AllowSelect;
const AllowAdminId = (_m = _ids === null || _ids === void 0 ? void 0 : _ids['@deep-foundation/core']) === null || _m === void 0 ? void 0 : _m.AllowAdmin;
log({ handleInsertTypeId, handleUpdateTypeId, handleDeleteTypeId, userTypeId, packageTypeId, containTypeId, plv8SupportsJsTypeId, HandlerTypeId, SelectorTypeId, AllowSelectTypeId, AllowSelectId, AllowAdminId });
describe('sync handlers', () => {
    describe('Prepare fuction', () => {
        it(`handleInsert`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const handlerId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const link = JSON.stringify({ id: 1, type_id: 1 });
            const result = yield api.sql(sql `select links__sync__handlers__prepare__function('${link}'::jsonb, ${handlerId}::bigint)`);
            log('prepare result', (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c[0]);
        }));
    });
    describe('DeepClient mini', () => {
        it(`id`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'id', '["@deep-foundation/core", "Rule"]'::jsonb, '{}'::jsonb)`);
            const clientResult = yield deep.id('@deep-foundation/core', 'Rule');
            log('id result', (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c[0]);
            assert.equal((_g = JSON.parse((_f = (_e = (_d = result === null || result === void 0 ? void 0 : result.data) === null || _d === void 0 ? void 0 : _d.result) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f[0])) === null || _g === void 0 ? void 0 : _g[0], clientResult);
        }));
        it(`select should return value`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
            const { data: [{ id }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                string: { data: { value: 'HelloBugFixers' } },
                in: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                        from_id: yield deep.id('deep', 'admin')
                    } }
            });
            const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'select', '{"id": ${id}}'::jsonb, '{}'::jsonb)`);
            log('select result', (_k = (_j = (_h = result === null || result === void 0 ? void 0 : result.data) === null || _h === void 0 ? void 0 : _h.result) === null || _j === void 0 ? void 0 : _j[1]) === null || _k === void 0 ? void 0 : _k[0]);
            const value = (_r = (_q = (_p = JSON.parse((_o = (_m = (_l = result === null || result === void 0 ? void 0 : result.data) === null || _l === void 0 ? void 0 : _l.result) === null || _m === void 0 ? void 0 : _m[1]) === null || _o === void 0 ? void 0 : _o[0])) === null || _p === void 0 ? void 0 : _p.data) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.value;
            const selected = yield deep.select(id);
            log('selected', (_s = selected === null || selected === void 0 ? void 0 : selected.data) === null || _s === void 0 ? void 0 : _s[0]);
            assert.equal(value === null || value === void 0 ? void 0 : value.value, 'HelloBugFixers');
            assert.equal(value === null || value === void 0 ? void 0 : value.id, (_v = (_u = (_t = selected === null || selected === void 0 ? void 0 : selected.data) === null || _t === void 0 ? void 0 : _t[0]) === null || _u === void 0 ? void 0 : _u.value) === null || _v === void 0 ? void 0 : _v.id);
        }));
        describe('permissions', () => {
            describe('select', () => {
                it(`root can select from tree`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b;
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'select', '{"link_id":1}'::jsonb, '{"table":"tree"}'::jsonb)`);
                    const n1 = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[1];
                    log('n1', JSON.parse(n1 === null || n1 === void 0 ? void 0 : n1[0]).data);
                    assert.equal(!!JSON.parse(n1 === null || n1 === void 0 ? void 0 : n1[0]).data.length, true);
                }));
                it(`root can select from can`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _c, _d;
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'select', '{"subject_id":${yield deep.id('deep', 'admin')}}'::jsonb, '{"table":"can"}'::jsonb)`);
                    const n1 = (_d = (_c = result === null || result === void 0 ? void 0 : result.data) === null || _c === void 0 ? void 0 : _c.result) === null || _d === void 0 ? void 0 : _d[1];
                    log('n1', JSON.parse(n1 === null || n1 === void 0 ? void 0 : n1[0]).data);
                    assert.equal(!!JSON.parse(n1 === null || n1 === void 0 ? void 0 : n1[0]).data.length, true);
                }));
                it(`root can select from selectors`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _e, _f;
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'select', '{"item_id":213}'::jsonb, '{"table":"selectors"}'::jsonb)`);
                    const n1 = (_f = (_e = result === null || result === void 0 ? void 0 : result.data) === null || _e === void 0 ? void 0 : _e.result) === null || _f === void 0 ? void 0 : _f[1];
                    log('n1', JSON.parse(n1 === null || n1 === void 0 ? void 0 : n1[0]).data);
                    assert.equal(!!JSON.parse(n1 === null || n1 === void 0 ? void 0 : n1[0]).data.length, true);
                }));
                it(`nobody can select from not permitted tables`, () => __awaiter(void 0, void 0, void 0, function* () {
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'select', '{"id":1}'::jsonb, '{"table":"strings"}'::jsonb)`);
                    assert.equal(result.error, 'Bad Request');
                }));
                it(`user contain range`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _g, _h, _j, _k, _l, _m;
                    const a1 = yield deep.guest({});
                    log('a1', a1);
                    const a2 = yield deep.guest({});
                    log('a2', a2);
                    const { data: [{ id }] } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                        in: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                                from_id: a1.linkId,
                            } }
                    });
                    log('id', id);
                    const result1 = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'select', '{"id": ${id}}'::jsonb, '{}'::jsonb)`);
                    const n1 = (_h = (_g = result1 === null || result1 === void 0 ? void 0 : result1.data) === null || _g === void 0 ? void 0 : _g.result) === null || _h === void 0 ? void 0 : _h[1];
                    assert.lengthOf(JSON.parse(n1 === null || n1 === void 0 ? void 0 : n1[0]).data, 1, `item_id ${id} must be selectable by ${a1.linkId}`);
                    log(`${a1.linkId} n1`, n1);
                    const result2 = yield api.sql(sql `select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'select', '{"id": ${id}}'::jsonb, '{}'::jsonb)`);
                    const n2 = (_k = (_j = result2 === null || result2 === void 0 ? void 0 : result2.data) === null || _j === void 0 ? void 0 : _j.result) === null || _k === void 0 ? void 0 : _k[1];
                    log(`${a2.linkId} n2`, n2);
                    assert.lengthOf(JSON.parse(n2 === null || n2 === void 0 ? void 0 : n2[0]).data, 0, `item_id ${id} must not be selectable by ${a2.linkId}`);
                    const result3 = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'select', '{"id": ${id}}'::jsonb, '{}'::jsonb)`);
                    const n3 = (_m = (_l = result3 === null || result3 === void 0 ? void 0 : result3.data) === null || _l === void 0 ? void 0 : _l.result) === null || _m === void 0 ? void 0 : _m[1];
                    log(`${yield deep.id('deep', 'admin')} n3`, n3);
                    assert.lengthOf(JSON.parse(n3 === null || n3 === void 0 ? void 0 : n3[0]).data, 1, `item_id ${id} must be selectable by admin`);
                }));
                it(`rule select include 1 depth but exclude 2 depth`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
                    const a1 = yield deep.guest({});
                    const a2 = yield deep.guest({});
                    const a3 = yield deep.guest({});
                    const { data: [{ id: id1 }] } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                        in: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                                from_id: a1.linkId,
                            } }
                    });
                    const { data: [{ id: id2 }] } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                        in: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                                from_id: id1,
                            } }
                    });
                    yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Rule'),
                        out: { data: [
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleSubject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: a2.linkId,
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleObject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: id1,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorExclude'),
                                                        to_id: id2,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleAction'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'AllowSelect'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                            ] },
                    });
                    const result1 = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'select', '{"id": ${id1}}'::jsonb, '{}'::jsonb)`);
                    const n1 = (_p = (_o = result1 === null || result1 === void 0 ? void 0 : result1.data) === null || _o === void 0 ? void 0 : _o.result) === null || _p === void 0 ? void 0 : _p[1];
                    assert.lengthOf(JSON.parse(n1 === null || n1 === void 0 ? void 0 : n1[0]).data, 1);
                    const result2 = yield api.sql(sql `select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'select', '{"id": ${id1}}'::jsonb, '{}'::jsonb)`);
                    const n2 = (_r = (_q = result2 === null || result2 === void 0 ? void 0 : result2.data) === null || _q === void 0 ? void 0 : _q.result) === null || _r === void 0 ? void 0 : _r[1];
                    assert.lengthOf(JSON.parse(n2 === null || n2 === void 0 ? void 0 : n2[0]).data, 1);
                    const result3 = yield api.sql(sql `select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'select', '{"id": ${id1}}'::jsonb, '{}'::jsonb)`);
                    const n3 = (_t = (_s = result3 === null || result3 === void 0 ? void 0 : result3.data) === null || _s === void 0 ? void 0 : _s.result) === null || _t === void 0 ? void 0 : _t[1];
                    assert.lengthOf(JSON.parse(n3 === null || n3 === void 0 ? void 0 : n3[0]).data, 0);
                    const result4 = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'select', '{"id": ${id1}}'::jsonb, '{}'::jsonb)`);
                    const n4 = (_v = (_u = result4 === null || result4 === void 0 ? void 0 : result4.data) === null || _u === void 0 ? void 0 : _u.result) === null || _v === void 0 ? void 0 : _v[1];
                    assert.lengthOf(JSON.parse(n4 === null || n4 === void 0 ? void 0 : n4[0]).data, 1);
                    const result5 = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'select', '{"id": ${id2}}'::jsonb, '{}'::jsonb)`);
                    const n5 = (_x = (_w = result5 === null || result5 === void 0 ? void 0 : result5.data) === null || _w === void 0 ? void 0 : _w.result) === null || _x === void 0 ? void 0 : _x[1];
                    assert.lengthOf(JSON.parse(n5 === null || n5 === void 0 ? void 0 : n5[0]).data, 1);
                    const result6 = yield api.sql(sql `select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'select', '{"id": ${id2}}'::jsonb, '{}'::jsonb)`);
                    const n6 = (_z = (_y = result6 === null || result6 === void 0 ? void 0 : result6.data) === null || _y === void 0 ? void 0 : _y.result) === null || _z === void 0 ? void 0 : _z[1];
                    assert.lengthOf(JSON.parse(n6 === null || n6 === void 0 ? void 0 : n6[0]).data, 0);
                    const result7 = yield api.sql(sql `select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'select', '{"id": ${id2}}'::jsonb, '{}'::jsonb)`);
                    const n7 = (_1 = (_0 = result7 === null || result7 === void 0 ? void 0 : result7.data) === null || _0 === void 0 ? void 0 : _0.result) === null || _1 === void 0 ? void 0 : _1[1];
                    assert.lengthOf(JSON.parse(n7 === null || n7 === void 0 ? void 0 : n7[0]).data, 0);
                    const result8 = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'select', '{"id": ${id2}}'::jsonb, '{}'::jsonb)`);
                    const n8 = (_3 = (_2 = result8 === null || result8 === void 0 ? void 0 : result8.data) === null || _2 === void 0 ? void 0 : _2.result) === null || _3 === void 0 ? void 0 : _3[1];
                    assert.lengthOf(JSON.parse(n8 === null || n8 === void 0 ? void 0 : n8[0]).data, 1);
                }));
            });
            describe('insert', () => {
                it(`root can insert`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'insert', '{"type_id":${yield deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
                    const customLinkId = (_f = (_e = (_d = JSON.parse((_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c[0])) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id;
                    log('customLinkId', customLinkId);
                    const clientResult = yield deep.select({ id: { _eq: customLinkId } });
                    log('clientResult', clientResult);
                    if (customLinkId === ((_h = (_g = clientResult === null || clientResult === void 0 ? void 0 : clientResult.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id))
                        yield deep.delete({ id: { _eq: customLinkId } });
                    assert.equal(customLinkId, (_k = (_j = clientResult === null || clientResult === void 0 ? void 0 : clientResult.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id);
                }));
                it(`guest cant insert by default`, () => __awaiter(void 0, void 0, void 0, function* () {
                    const a1 = yield deep.guest({});
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'insert', '{"type_id":${yield deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
                    assert.isNotEmpty(result === null || result === void 0 ? void 0 : result.error);
                }));
                it(`insert permission can be gived to guest`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
                    const a1 = yield deep.guest({});
                    const a2 = yield deep.guest({});
                    const a3 = yield deep.guest({});
                    const ruleResult = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Rule'),
                        out: { data: [
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleSubject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a1.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a2.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorExclude'),
                                                        to_id: a3.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleObject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleAction'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'AllowInsertType'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                            ] },
                    });
                    const r1 = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'insert', '{"type_id":${yield deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
                    const e1 = r1 === null || r1 === void 0 ? void 0 : r1.error;
                    log('r1', (_o = (_m = (_l = r1 === null || r1 === void 0 ? void 0 : r1.data) === null || _l === void 0 ? void 0 : _l.result) === null || _m === void 0 ? void 0 : _m[1]) === null || _o === void 0 ? void 0 : _o[0]);
                    const da1 = (_s = JSON.parse((_r = (_q = (_p = r1 === null || r1 === void 0 ? void 0 : r1.data) === null || _p === void 0 ? void 0 : _p.result) === null || _q === void 0 ? void 0 : _q[1]) === null || _r === void 0 ? void 0 : _r[0])) === null || _s === void 0 ? void 0 : _s.data;
                    log('a1.linkId', a1.linkId);
                    log('da1', da1);
                    if (e1)
                        log('error', e1);
                    expect(da1).to.not.be.undefined;
                    assert.equal(!!e1, false);
                    const r2 = yield api.sql(sql `select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'insert', '{"type_id":${yield deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
                    const e2 = r2 === null || r2 === void 0 ? void 0 : r2.error;
                    const da2 = (_w = JSON.parse((_v = (_u = (_t = r2 === null || r2 === void 0 ? void 0 : r2.data) === null || _t === void 0 ? void 0 : _t.result) === null || _u === void 0 ? void 0 : _u[1]) === null || _v === void 0 ? void 0 : _v[0])) === null || _w === void 0 ? void 0 : _w.data;
                    expect(da2).to.not.be.undefined;
                    assert.equal(!!e2, false);
                    const r3 = yield api.sql(sql `select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'insert', '{"type_id":${yield deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
                    const e3 = r3 === null || r3 === void 0 ? void 0 : r3.error;
                    const da3 = ((_z = (_y = (_x = r3 === null || r3 === void 0 ? void 0 : r3.data) === null || _x === void 0 ? void 0 : _x.result) === null || _y === void 0 ? void 0 : _y[1]) === null || _z === void 0 ? void 0 : _z[0]) ? (_3 = JSON.parse((_2 = (_1 = (_0 = r3 === null || r3 === void 0 ? void 0 : r3.data) === null || _0 === void 0 ? void 0 : _0.result) === null || _1 === void 0 ? void 0 : _1[1]) === null || _2 === void 0 ? void 0 : _2[0])) === null || _3 === void 0 ? void 0 : _3.data : undefined;
                    log('da3', da3);
                    expect(e3).to.not.be.undefined;
                }));
                it(`insert permission with SelectorFilter`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33;
                    const a1 = yield deep.guest({});
                    const a2 = yield deep.guest({});
                    const a3 = yield deep.guest({});
                    const { data: [{ id: TempType }] } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Type'),
                        from_id: yield deep.id('@deep-foundation/core', 'Any'),
                        to_id: yield deep.id('@deep-foundation/core', 'Any'),
                    });
                    yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Rule'),
                        out: { data: [
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleSubject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a1.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a2.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a3.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleObject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: yield deep.id('@deep-foundation/core'),
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleAction'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'AllowInsertType'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                            ] },
                    });
                    yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Rule'),
                        out: { data: [
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleSubject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a1.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a2.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a3.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleObject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: TempType,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorFilter'),
                                                        to: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'Query'),
                                                                object: { data: { value: {
                                                                            to_id: { _eq: 'X-Deep-User-Id' },
                                                                        }, }, },
                                                            }, },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleAction'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'AllowInsertType'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                            ] },
                    });
                    yield delay(5000);
                    const r1 = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'insert', '{"type_id":${yield deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
                    const e1 = r1 === null || r1 === void 0 ? void 0 : r1.error;
                    const da1 = (_7 = JSON.parse((_6 = (_5 = (_4 = r1 === null || r1 === void 0 ? void 0 : r1.data) === null || _4 === void 0 ? void 0 : _4.result) === null || _5 === void 0 ? void 0 : _5[1]) === null || _6 === void 0 ? void 0 : _6[0])) === null || _7 === void 0 ? void 0 : _7.data;
                    expect(da1).to.not.be.undefined;
                    assert.equal(!!e1, false);
                    const r2 = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'insert', '{"type_id":${TempType}, "from_id": ${(_8 = da1 === null || da1 === void 0 ? void 0 : da1[0]) === null || _8 === void 0 ? void 0 : _8.id}, "to_id": ${a1.linkId}}'::jsonb, '{}'::jsonb)`);
                    const e1t = r2 === null || r2 === void 0 ? void 0 : r2.error;
                    const da1t = (_12 = JSON.parse((_11 = (_10 = (_9 = r2 === null || r2 === void 0 ? void 0 : r2.data) === null || _9 === void 0 ? void 0 : _9.result) === null || _10 === void 0 ? void 0 : _10[1]) === null || _11 === void 0 ? void 0 : _11[0])) === null || _12 === void 0 ? void 0 : _12.data;
                    expect(da1t).to.not.be.undefined;
                    assert.equal(!!e1t, false);
                    const r3 = yield api.sql(sql `select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'insert', '{"type_id":${yield deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
                    const e2 = r3 === null || r3 === void 0 ? void 0 : r3.error;
                    const da2 = (_16 = JSON.parse((_15 = (_14 = (_13 = r3 === null || r3 === void 0 ? void 0 : r3.data) === null || _13 === void 0 ? void 0 : _13.result) === null || _14 === void 0 ? void 0 : _14[1]) === null || _15 === void 0 ? void 0 : _15[0])) === null || _16 === void 0 ? void 0 : _16.data;
                    expect(da2).to.not.be.undefined;
                    assert.equal(!!e1t, false);
                    let r4;
                    try {
                        r4 = yield api.sql(sql `select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'insert', '{"type_id":${TempType}, "from_id": ${(_17 = da2 === null || da2 === void 0 ? void 0 : da2[0]) === null || _17 === void 0 ? void 0 : _17.id}, "to_id": ${a1.linkId}}'::jsonb, '{}'::jsonb)`);
                    }
                    catch (e) {
                        log(e);
                    }
                    const da2t = ((_20 = (_19 = (_18 = r4 === null || r4 === void 0 ? void 0 : r4.data) === null || _18 === void 0 ? void 0 : _18.result) === null || _19 === void 0 ? void 0 : _19[1]) === null || _20 === void 0 ? void 0 : _20[0]) ? (_24 = JSON.parse((_23 = (_22 = (_21 = r4 === null || r4 === void 0 ? void 0 : r4.data) === null || _21 === void 0 ? void 0 : _21.result) === null || _22 === void 0 ? void 0 : _22[1]) === null || _23 === void 0 ? void 0 : _23[0])) === null || _24 === void 0 ? void 0 : _24.data : undefined;
                    const e2t = r4 === null || r4 === void 0 ? void 0 : r4.error;
                    expect(da2t).to.be.undefined;
                    expect(e2t).to.not.be.undefined;
                    const r5 = yield api.sql(sql `select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'insert', '{"type_id":${yield deep.id('@deep-foundation/core', 'Operation')}}'::jsonb, '{}'::jsonb)`);
                    const e3 = r5 === null || r5 === void 0 ? void 0 : r5.error;
                    const da3 = (_28 = JSON.parse((_27 = (_26 = (_25 = r5 === null || r5 === void 0 ? void 0 : r5.data) === null || _25 === void 0 ? void 0 : _25.result) === null || _26 === void 0 ? void 0 : _26[1]) === null || _27 === void 0 ? void 0 : _27[0])) === null || _28 === void 0 ? void 0 : _28.data;
                    expect(da3).to.not.be.undefined;
                    assert.equal(!!e3, false);
                    const r6 = yield api.sql(sql `select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'insert', '{"type_id":${TempType}, "from_id": ${(_29 = da2 === null || da2 === void 0 ? void 0 : da2[0]) === null || _29 === void 0 ? void 0 : _29.id}, "to_id": ${a3.linkId}}'::jsonb, '{}'::jsonb)`);
                    const e4 = r6 === null || r6 === void 0 ? void 0 : r6.error;
                    const da4 = (_33 = JSON.parse((_32 = (_31 = (_30 = r6 === null || r6 === void 0 ? void 0 : r6.data) === null || _30 === void 0 ? void 0 : _30.result) === null || _31 === void 0 ? void 0 : _31[1]) === null || _32 === void 0 ? void 0 : _32[0])) === null || _33 === void 0 ? void 0 : _33.data;
                    expect(da4).to.not.be.undefined;
                    assert.equal(!!e4, false);
                }));
            });
            describe('update', () => {
                describe('values', () => {
                    it(`root can update value`, () => __awaiter(void 0, void 0, void 0, function* () {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                        const { data: [{ id }], error } = yield deep.insert({
                            type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                        });
                        const n1 = yield deep.select({ id });
                        assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
                        yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'update', '[{"link_id":${id}}, { "value": "test2"}, { "table": "strings"}]'::jsonb, '{}'::jsonb)`);
                        const clientResult = yield deep.select({ id: { _eq: id } });
                        log('clientResult', clientResult);
                        assert.equal(undefined, (_c = (_b = (_a = clientResult === null || clientResult === void 0 ? void 0 : clientResult.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.value);
                        const n2 = yield deep.insert({ link_id: id, value: 'test1' }, { table: 'strings' });
                        log('n2', n2);
                        const inserted = yield deep.select({ id: { _eq: id } });
                        log('inserted', inserted);
                        assert.equal('test1', (_f = (_e = (_d = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.value) === null || _f === void 0 ? void 0 : _f.value);
                        yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'update', '[{"link_id":${id}}, { "value": "test2"}, { "table": "strings"}]'::jsonb, '{}'::jsonb)`);
                        const clientResult2 = yield deep.select({ id: { _eq: id } });
                        log('clientResult2', clientResult2);
                        assert.equal('test2', (_j = (_h = (_g = clientResult2 === null || clientResult2 === void 0 ? void 0 : clientResult2.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.value) === null || _j === void 0 ? void 0 : _j.value);
                        yield deep.delete({ id: { _eq: id } });
                    }));
                });
            });
            describe('delete', () => {
                it(`root can delete`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    const { data: [{ id }], error } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                    });
                    const n1 = yield deep.select({ id });
                    assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'delete', '{"id":${id}}'::jsonb, '{}'::jsonb)`);
                    const customLinkId = (_f = (_e = (_d = JSON.parse((_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c[0])) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id;
                    log('customLinkId', customLinkId);
                    const clientResult = yield deep.select({ id: { _eq: customLinkId } });
                    log('clientResult', clientResult);
                    if ((_h = (_g = clientResult === null || clientResult === void 0 ? void 0 : clientResult.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id)
                        deep.delete({ id: { _eq: customLinkId } });
                    assert.lengthOf(clientResult === null || clientResult === void 0 ? void 0 : clientResult.data, 0);
                }));
                it(`nobody can delete from not permitted tables`, () => __awaiter(void 0, void 0, void 0, function* () {
                    const { data: [{ id }], error } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                    });
                    const n1 = yield deep.select({ id });
                    assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${yield deep.id('deep', 'admin')}::bigint, 'delete', '{"id":${id}}'::jsonb, '{"table":"selectors"}'::jsonb)`);
                    log('result.error', JSON.stringify(result.error));
                    assert.equal(result.error, 'Bad Request');
                }));
                it(`guest cant delete by default`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _j, _k, _l, _m, _o, _p, _q;
                    const { data: [{ id }], error } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                    });
                    const n1 = yield deep.select({ id });
                    assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
                    const a1 = yield deep.guest({});
                    const result = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'delete', '{"id":${id}}'::jsonb, '{}'::jsonb)`);
                    if ((_l = (_k = (_j = result === null || result === void 0 ? void 0 : result.data) === null || _j === void 0 ? void 0 : _j.result) === null || _k === void 0 ? void 0 : _k[1]) === null || _l === void 0 ? void 0 : _l[0])
                        assert.lengthOf((_q = JSON.parse((_p = (_o = (_m = result === null || result === void 0 ? void 0 : result.data) === null || _m === void 0 ? void 0 : _m.result) === null || _o === void 0 ? void 0 : _o[1]) === null || _p === void 0 ? void 0 : _p[0])) === null || _q === void 0 ? void 0 : _q.data, 0);
                    const n2 = yield deep.select({ id });
                    assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 1);
                }));
                it(`delete permission can be gived to guest`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
                    const a1 = yield deep.guest({});
                    const a2 = yield deep.guest({});
                    const a3 = yield deep.guest({});
                    yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Rule'),
                        out: { data: [
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleSubject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a1.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a2.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorExclude'),
                                                        to_id: a3.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] },
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleObject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleAction'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'AllowDeleteType'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                            ] },
                    });
                    const { data: [{ id: id1 }] } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                    });
                    const { data: [{ id: id2 }] } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                    });
                    const { data: [{ id: id3 }] } = yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                    });
                    const r1 = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'delete', '{"id":${id1}}'::jsonb, '{}'::jsonb)`);
                    const r2 = yield api.sql(sql `select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'delete', '{"id":${id2}}'::jsonb, '{}'::jsonb)`);
                    const r3 = yield api.sql(sql `select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'delete', '{"id":${id3}}'::jsonb, '{}'::jsonb)`);
                    const da1 = (_u = JSON.parse((_t = (_s = (_r = r1 === null || r1 === void 0 ? void 0 : r1.data) === null || _r === void 0 ? void 0 : _r.result) === null || _s === void 0 ? void 0 : _s[1]) === null || _t === void 0 ? void 0 : _t[0])) === null || _u === void 0 ? void 0 : _u.data;
                    expect(da1).to.not.be.undefined;
                    const n1 = yield deep.select({ id: id1 });
                    assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 0);
                    const da2 = (_y = JSON.parse((_x = (_w = (_v = r2 === null || r2 === void 0 ? void 0 : r2.data) === null || _v === void 0 ? void 0 : _v.result) === null || _w === void 0 ? void 0 : _w[1]) === null || _x === void 0 ? void 0 : _x[0])) === null || _y === void 0 ? void 0 : _y.data;
                    expect(da2).to.not.be.undefined;
                    const n2 = yield deep.select({ id: id2 });
                    assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 0);
                    const da3 = ((_1 = (_0 = (_z = r3 === null || r3 === void 0 ? void 0 : r3.data) === null || _z === void 0 ? void 0 : _z.result) === null || _0 === void 0 ? void 0 : _0[1]) === null || _1 === void 0 ? void 0 : _1[0]) ? (_5 = JSON.parse((_4 = (_3 = (_2 = r3 === null || r3 === void 0 ? void 0 : r3.data) === null || _2 === void 0 ? void 0 : _2.result) === null || _3 === void 0 ? void 0 : _3[1]) === null || _4 === void 0 ? void 0 : _4[0])) === null || _5 === void 0 ? void 0 : _5.data : undefined;
                    expect(da3).to.be.undefined;
                    const n3 = yield deep.select({ id: id3 });
                    assert.lengthOf(n3 === null || n3 === void 0 ? void 0 : n3.data, 1);
                    yield deep.delete(id1);
                    yield deep.delete(id2);
                    yield deep.delete(id3);
                }));
                it(`delete permission with SelectorFilter`, () => __awaiter(void 0, void 0, void 0, function* () {
                    var _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32;
                    const a1 = yield deep.guest({});
                    const a2 = yield deep.guest({});
                    const a3 = yield deep.guest({});
                    yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Rule'),
                        out: { data: [
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleSubject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a1.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a2.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a3.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleObject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: yield deep.id('@deep-foundation/core', 'Operation'),
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleAction'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'AllowInsertType'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                            ] },
                    });
                    yield deep.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Rule'),
                        out: { data: [
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleSubject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a1.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a2.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: a3.linkId,
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleObject'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: [
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                        to_id: yield deep.id('@deep-foundation/core', 'Operation'),
                                                        out: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                            } },
                                                    },
                                                    {
                                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorFilter'),
                                                        to: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'Query'),
                                                                object: { data: { value: {
                                                                            string: { value: { _eq: 'abc2' } },
                                                                        }, }, },
                                                            }, },
                                                    },
                                                ] }
                                        } }
                                },
                                {
                                    type_id: yield deep.id('@deep-foundation/core', 'RuleAction'),
                                    to: { data: {
                                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'AllowDeleteType'),
                                                    out: { data: {
                                                            type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                            to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                        } },
                                                } }
                                        } }
                                },
                            ] },
                    });
                    yield delay(5000);
                    const d1 = new DeepClient(Object.assign(Object.assign({ deep }, a1), { silent: true }));
                    const { data: da1, error: e1 } = yield d1.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                        string: { data: { value: 'abc1' } },
                    });
                    assert.equal(!!e1, false);
                    const r1 = yield api.sql(sql `select links__sync__handlers__deep__client(${a1.linkId}::bigint, 'delete', '{"id":${(_6 = da1 === null || da1 === void 0 ? void 0 : da1[0]) === null || _6 === void 0 ? void 0 : _6.id}}'::jsonb, '{}'::jsonb)`);
                    const e1d = r1.error;
                    expect(e1d).to.not.be.undefined;
                    if ((_9 = (_8 = (_7 = r1 === null || r1 === void 0 ? void 0 : r1.data) === null || _7 === void 0 ? void 0 : _7.result) === null || _8 === void 0 ? void 0 : _8[1]) === null || _9 === void 0 ? void 0 : _9[0])
                        assert.lengthOf((_13 = JSON.parse((_12 = (_11 = (_10 = r1 === null || r1 === void 0 ? void 0 : r1.data) === null || _10 === void 0 ? void 0 : _10.result) === null || _11 === void 0 ? void 0 : _11[1]) === null || _12 === void 0 ? void 0 : _12[0])) === null || _13 === void 0 ? void 0 : _13.data, 0);
                    const n1 = yield deep.select((_14 = da1 === null || da1 === void 0 ? void 0 : da1[0]) === null || _14 === void 0 ? void 0 : _14.id);
                    assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
                    const d2 = new DeepClient(Object.assign(Object.assign({ deep }, a2), { silent: true }));
                    const { data: da2, error: e2 } = yield d2.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                        string: { data: { value: 'abc2' } },
                    });
                    assert.equal(!!e2, false);
                    const r2 = yield api.sql(sql `select links__sync__handlers__deep__client(${a2.linkId}::bigint, 'delete', '{"id":${(_15 = da2 === null || da2 === void 0 ? void 0 : da2[0]) === null || _15 === void 0 ? void 0 : _15.id}}'::jsonb, '{}'::jsonb)`);
                    const e2d = r2.error;
                    assert.equal(!!e2d, false);
                    if ((_18 = (_17 = (_16 = r2 === null || r2 === void 0 ? void 0 : r2.data) === null || _16 === void 0 ? void 0 : _16.result) === null || _17 === void 0 ? void 0 : _17[1]) === null || _18 === void 0 ? void 0 : _18[0])
                        assert.lengthOf((_22 = JSON.parse((_21 = (_20 = (_19 = r2 === null || r2 === void 0 ? void 0 : r2.data) === null || _19 === void 0 ? void 0 : _19.result) === null || _20 === void 0 ? void 0 : _20[1]) === null || _21 === void 0 ? void 0 : _21[0])) === null || _22 === void 0 ? void 0 : _22.data, 1);
                    const n2 = yield deep.select((_23 = da2 === null || da2 === void 0 ? void 0 : da2[0]) === null || _23 === void 0 ? void 0 : _23.id);
                    assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 0);
                    const d3 = new DeepClient(Object.assign(Object.assign({ deep }, a3), { silent: true }));
                    const { data: da3, error: e3 } = yield d3.insert({
                        type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                        string: { data: { value: 'abc3' } },
                    });
                    assert.equal(!!e3, false);
                    const r3 = yield api.sql(sql `select links__sync__handlers__deep__client(${a3.linkId}::bigint, 'delete', '{"id":${(_24 = da3 === null || da3 === void 0 ? void 0 : da3[0]) === null || _24 === void 0 ? void 0 : _24.id}}'::jsonb, '{}'::jsonb)`);
                    const e3d = r3.error;
                    expect(e3d).to.not.be.undefined;
                    if ((_27 = (_26 = (_25 = r3 === null || r3 === void 0 ? void 0 : r3.data) === null || _25 === void 0 ? void 0 : _25.result) === null || _26 === void 0 ? void 0 : _26[1]) === null || _27 === void 0 ? void 0 : _27[0])
                        assert.lengthOf((_31 = JSON.parse((_30 = (_29 = (_28 = r3 === null || r3 === void 0 ? void 0 : r3.data) === null || _28 === void 0 ? void 0 : _28.result) === null || _29 === void 0 ? void 0 : _29[1]) === null || _30 === void 0 ? void 0 : _30[0])) === null || _31 === void 0 ? void 0 : _31.data, 0);
                    const n3 = yield deep.select((_32 = da3 === null || da3 === void 0 ? void 0 : da3[0]) === null || _32 === void 0 ? void 0 : _32.id);
                    assert.lengthOf(n3 === null || n3 === void 0 ? void 0 : n3.data, 1);
                }));
            });
        });
    });
    describe('require package', () => {
        it(`require mathjs`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const debug = log.extend('HandleInsert');
            const typeId = yield deep.id('@deep-foundation/core', 'Operation');
            const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
            const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
            const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
            const customLinkId = (_b = (_a = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
            debug('customLinkId', customLinkId);
            const handler = yield insertHandler(handleInsertTypeId, typeId, `({deep, require, data}) => { const mathjs = require('mathjs'); if (mathjs.atan2(3, -3) / mathjs.pi == 0.75) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
            debug('handler', handler);
            try {
                const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
                debug('linkId', linkId);
                debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
            }
            catch (e) {
                debug('insert error: ', e);
            }
            const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
            debug('insertedByHandler', (_f = (_e = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id);
            if ((_h = (_g = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id)
                yield deep.delete((_k = (_j = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id);
            yield deep.delete(customLinkId);
            debug('delete handler', yield deleteHandler(handler));
            assert.equal(!!((_m = (_l = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.id), true);
        }));
        it(`require jsonschema`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
            const debug = log.extend('HandleInsert');
            const typeId = yield deep.id('@deep-foundation/core', 'Operation');
            const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
            const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
            const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
            const customLinkId = (_p = (_o = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id;
            debug('customLinkId', customLinkId);
            const handler = yield insertHandler(handleInsertTypeId, typeId, `({deep, require, data}) => { var validate = require('jsonschema').validate; if (validate(4, {"type": "number"}).valid) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
            debug('handler', handler);
            try {
                const linkId = (_r = (_q = (yield deep.insert({ type_id: typeId }))) === null || _q === void 0 ? void 0 : _q.data) === null || _r === void 0 ? void 0 : _r[0].id;
                debug('linkId', linkId);
                debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
            }
            catch (e) {
                debug('insert error: ', e);
            }
            const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
            debug('insertedByHandler', (_t = (_s = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.id);
            if ((_v = (_u = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.id)
                yield deep.delete((_x = (_w = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.id);
            yield deep.delete(customLinkId);
            debug('delete handler', yield deleteHandler(handler));
            assert.equal(!!((_z = (_y = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.id), true);
        }));
    });
    describe('Handle operations', () => {
        describe('Handle insert', () => {
            it(`Handle insert on type`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                const debug = log.extend('HandleInsert');
                const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_b = (_a = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
                debug('customLinkId', customLinkId);
                const handler = yield insertHandler(handleInsertTypeId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                debug('handler', handler);
                try {
                    const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
                    debug('linkId', linkId);
                    debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                }
                catch (e) {
                    debug('insert error: ', e);
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', (_f = (_e = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id);
                if ((_h = (_g = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id)
                    yield deep.delete((_k = (_j = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id);
                yield deep.delete(customLinkId);
                debug('delete handler', yield deleteHandler(handler));
                assert.equal(!!((_m = (_l = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.id), true);
            }));
            it.skip(`Handle insert on type with sql injection (DAMAGES DATABASE SHOULD BE SKIPPED UNTIL FIXED)`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
                const debug = log.extend('HandleInsert');
                const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_p = (_o = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id;
                debug('customLinkId', customLinkId);
                const handler = yield insertHandler(handleInsertTypeId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: "${customLinkId}) RETURNING id; DROP TABLE promise_links; INSERT INTO links (type_id, from_id, to_id) VALUES (${customLinkId}, ${customLinkId}, ${customLinkId}) RETURNING id; -- ", from_id: ${customLinkId}}); }`, undefined, supportsId);
                debug('handler', handler);
                try {
                    const linkId = (_r = (_q = (yield deep.insert({ type_id: typeId }))) === null || _q === void 0 ? void 0 : _q.data) === null || _r === void 0 ? void 0 : _r[0].id;
                    debug('linkId', linkId);
                    debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                }
                catch (e) {
                    debug('insert error: ', e);
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', (_t = (_s = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.id);
                if ((_v = (_u = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.id)
                    yield deep.delete((_x = (_w = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.id);
                yield deep.delete(customLinkId);
                debug('delete handler', yield deleteHandler(handler));
                assert.equal(!!((_z = (_y = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.id), true);
            }));
            it(`Handle insert 2 triggers and broke transaction in second`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
                const debug = log.extend('HandleInsert');
                const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_1 = (_0 = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _0 === void 0 ? void 0 : _0[0]) === null || _1 === void 0 ? void 0 : _1.id;
                const handler = yield insertHandler(handleInsertTypeId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                debug('handler', handler);
                debug('customLinkId', customLinkId);
                const handler2 = yield insertHandler(handleInsertTypeId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); throw new Error('errorTest')}`, undefined, supportsId);
                try {
                    const linkId = (_3 = (_2 = (yield deep.insert({ type_id: typeId }))) === null || _2 === void 0 ? void 0 : _2.data) === null || _3 === void 0 ? void 0 : _3[0].id;
                    debug('linkId', linkId);
                }
                catch (e) {
                    debug('insert error: ', e);
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', (_5 = (_4 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _4 === void 0 ? void 0 : _4[0]) === null || _5 === void 0 ? void 0 : _5.id);
                if ((_7 = (_6 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _6 === void 0 ? void 0 : _6[0]) === null || _7 === void 0 ? void 0 : _7.id)
                    yield deep.delete((_9 = (_8 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _8 === void 0 ? void 0 : _8[0]) === null || _9 === void 0 ? void 0 : _9.id);
                yield deep.delete(customLinkId);
                debug('delete handler', yield deleteHandler(handler));
                debug('delete handler2', yield deleteHandler(handler2));
                assert.equal((_11 = (_10 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _10 === void 0 ? void 0 : _10[0]) === null || _11 === void 0 ? void 0 : _11.id, undefined);
            }));
            it(`Handle insert 1 trigger and 2 types, check not triggered twice`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25;
                const debug = log.extend('HandleInsert1x2');
                const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_13 = (_12 = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _12 === void 0 ? void 0 : _12[0]) === null || _13 === void 0 ? void 0 : _13.id;
                debug('customLinkId', customLinkId);
                const inserted2 = yield deep.insert({ type_id: 1 });
                const customLinkId2 = (_15 = (_14 = inserted2 === null || inserted2 === void 0 ? void 0 : inserted2.data) === null || _14 === void 0 ? void 0 : _14[0]) === null || _15 === void 0 ? void 0 : _15.id;
                debug('customLinkId2', customLinkId2);
                const handler = yield insertHandler(handleInsertTypeId, customLinkId2, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                debug('handler', handler);
                try {
                    const link = (_17 = (_16 = (yield deep.insert({ type_id: customLinkId2 }))) === null || _16 === void 0 ? void 0 : _16.data) === null || _17 === void 0 ? void 0 : _17[0];
                    const linkId = link.id;
                    if (linkId)
                        yield deep.delete(linkId);
                    debug('linkId', linkId);
                }
                catch (e) {
                    debug('insert error: ', e);
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                assert.equal((_18 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _18 === void 0 ? void 0 : _18.length, 1);
                const link2 = (_20 = (_19 = (yield deep.insert({ type_id: customLinkId, from_id: customLinkId, to_id: customLinkId }))) === null || _19 === void 0 ? void 0 : _19.data) === null || _20 === void 0 ? void 0 : _20[0];
                const insertedByHandler2 = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                assert.equal((_21 = insertedByHandler2 === null || insertedByHandler2 === void 0 ? void 0 : insertedByHandler2.data) === null || _21 === void 0 ? void 0 : _21.length, 2);
                if (link2 === null || link2 === void 0 ? void 0 : link2.id)
                    yield deep.delete(link2 === null || link2 === void 0 ? void 0 : link2.id);
                debug('insertedByHandler', insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data);
                if ((_23 = (_22 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _22 === void 0 ? void 0 : _22[0]) === null || _23 === void 0 ? void 0 : _23.id)
                    yield deep.delete((_25 = (_24 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _24 === void 0 ? void 0 : _24[0]) === null || _25 === void 0 ? void 0 : _25.id);
                yield deep.delete(customLinkId);
                yield deep.delete(customLinkId2);
                debug('delete handler', yield deleteHandler(handler));
            }));
            it(`Handle insert on type throw error`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _26, _27, _28, _29, _30, _31, _32, _33, _34, _35;
                const debug = log.extend('HandleInsertError');
                const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_27 = (_26 = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _26 === void 0 ? void 0 : _26[0]) === null || _27 === void 0 ? void 0 : _27.id;
                const handler = yield insertHandler(handleInsertTypeId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); throw new Error('testError');}`, undefined, supportsId);
                let linkId;
                let error;
                debug('handler', handler);
                try {
                    const linkId = (_29 = (_28 = (yield deep.insert({ type_id: typeId }))) === null || _28 === void 0 ? void 0 : _28.data) === null || _29 === void 0 ? void 0 : _29[0].id;
                    debug('ensureLinkIsCreated', linkId);
                    throw new Error('Not errored handler!');
                }
                catch (e) {
                    debug('error', e === null || e === void 0 ? void 0 : e.message);
                    error = e === null || e === void 0 ? void 0 : e.message;
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', (_31 = (_30 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _30 === void 0 ? void 0 : _30[0]) === null || _31 === void 0 ? void 0 : _31.id);
                debug('delete handler', JSON.stringify(yield deleteHandler(handler)));
                if ((_33 = (_32 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _32 === void 0 ? void 0 : _32[0]) === null || _33 === void 0 ? void 0 : _33.id)
                    yield deep.delete((_35 = (_34 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _34 === void 0 ? void 0 : _34[0]) === null || _35 === void 0 ? void 0 : _35.id);
                yield deep.delete(customLinkId);
                if (linkId) {
                    const deleteResult = yield deep.delete({ id: { _eq: linkId } });
                    debug('delete linkid', deleteResult);
                }
                assert.equal(error, 'testError');
            }));
            it(`Handle insert on selector`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _36, _37, _38, _39, _40, _41, _42, _43, _44, _45;
                const debug = log.extend('HandleInsertSelect');
                const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const selector = yield insertSelector();
                debug('selector', selector);
                const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_37 = (_36 = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _36 === void 0 ? void 0 : _36[0]) === null || _37 === void 0 ? void 0 : _37.id;
                const handler = yield insertHandler(handleInsertTypeId, selectorId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                let selectorItem;
                debug('handler', handler);
                try {
                    selectorItem = yield insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
                    debug('selectorItem', selectorItem);
                }
                catch (e) {
                    error(e);
                }
                if (selectorItem === null || selectorItem === void 0 ? void 0 : selectorItem.linkId)
                    yield deep.delete(selectorItem.linkId);
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', (_39 = (_38 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _38 === void 0 ? void 0 : _38[0]) === null || _39 === void 0 ? void 0 : _39.id);
                if ((_41 = (_40 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _40 === void 0 ? void 0 : _40[0]) === null || _41 === void 0 ? void 0 : _41.id)
                    yield deep.delete((_43 = (_42 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _42 === void 0 ? void 0 : _42[0]) === null || _43 === void 0 ? void 0 : _43.id);
                yield deep.delete(customLinkId);
                yield deep.delete(customLinkId);
                debug('deleteSelector');
                yield deleteSelector(selector);
                debug('deleteHandler');
                yield deleteHandler(handler);
                assert.equal(!!((_45 = (_44 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _44 === void 0 ? void 0 : _44[0]) === null || _45 === void 0 ? void 0 : _45.id), true);
            }));
            it(`Handle insert on type any`, () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const handleInsertTypeLinkId = yield deep.id('@deep-foundation/core', 'HandleInsert');
                const supportsLinkId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const typeTypeLinkId = yield deep.id("@deep-foundation/core", "Type");
                const anyTypeLinkId = yield deep.id('@deep-foundation/core', 'Any');
                const expectedErrorMessage = "Success! Handler is called. This test throw this error because there is a bug with plv8 handler which does not let to catch this error";
                let actualErrorMessage;
                const handler = yield insertHandler(handleInsertTypeLinkId, anyTypeLinkId, `() => {
            throw new Error("${expectedErrorMessage}");
          }`, undefined, supportsLinkId);
                try {
                    const { data: [newLink] } = yield deep.insert({
                        type_id: typeTypeLinkId
                    });
                    linkIdsToDelete.push(newLink.id);
                }
                catch (error) {
                    actualErrorMessage = error.message;
                }
                finally {
                    yield deleteHandler(handler);
                    yield deep.delete(linkIdsToDelete);
                    assert.strictEqual(actualErrorMessage, expectedErrorMessage);
                }
            }));
        });
        describe('Handle delete', () => {
            it(`Handle delete on type`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                const debug = log.extend('HandleDelete');
                const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                const handleDeleteTypeId = yield deep.id('@deep-foundation/core', 'HandleDelete');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_b = (_a = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
                const handler = yield insertHandler(handleDeleteTypeId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                debug('handler', handler);
                debug('customLinkId', customLinkId);
                const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
                try {
                    const deleted = yield deep.delete(linkId);
                    debug('deleted', deleted);
                }
                catch (e) {
                    debug('insert error: ', e);
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', insertedByHandler);
                if ((_f = (_e = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id)
                    yield deep.delete((_h = (_g = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id);
                debug('delete handler', yield deleteHandler(handler));
                yield deep.delete(customLinkId);
                assert.equal(!!((_k = (_j = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id), true);
            }));
            it(`Handle delete on selector`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _l, _m, _o, _p, _q, _r, _s, _t;
                const debug = log.extend('HandleDeleteSelect');
                const handleDeleteTypeId = yield deep.id('@deep-foundation/core', 'HandleDelete');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const selector = yield insertSelector();
                debug('selector', selector);
                const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_m = (_l = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.id;
                const handler = yield insertHandler(handleDeleteTypeId, selectorId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                const selectorItem = yield insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
                debug('handler', handler);
                try {
                    const deleted = yield deep.delete(selectorItem.linkId);
                    debug('deleted', deleted);
                }
                catch (e) {
                    error(e);
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', insertedByHandler);
                if ((_p = (_o = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id)
                    yield deep.delete((_r = (_q = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.id);
                yield deep.delete(customLinkId);
                debug('deleteSelector');
                yield deleteSelector(selector);
                debug('deleteHandler');
                yield deleteHandler(handler);
                assert.equal(!!((_t = (_s = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.id), true);
            }));
            it(`Handle delete on type any`, () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const handleDeleteTypeLinkId = yield deep.id('@deep-foundation/core', 'HandleDelete');
                const supportsLinkId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const typeTypeLinkId = yield deep.id("@deep-foundation/core", "Type");
                const anyTypeLinkId = yield deep.id('@deep-foundation/core', 'Any');
                const expectedErrorMessage = "Success! Handler is called";
                let actualErrorMessage;
                const handler = yield insertHandler(handleDeleteTypeLinkId, anyTypeLinkId, `() => {
            throw new Error("${expectedErrorMessage}");
          }`, undefined, supportsLinkId);
                try {
                    const { data: [newLink] } = yield deep.insert({
                        type_id: typeTypeLinkId
                    });
                    linkIdsToDelete.push(newLink.id);
                    yield deep.delete(newLink.id);
                }
                catch (error) {
                    actualErrorMessage = error.message;
                }
                finally {
                    yield deleteHandler(handler);
                    yield deep.delete(linkIdsToDelete);
                    console.log({ actualErrorMessage, expectedErrorMessage });
                    assert.strictEqual(actualErrorMessage, expectedErrorMessage);
                }
            }));
        });
        describe('Handle update', () => {
            it(`Handle update on type`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                const debug = log.extend('HandleUpdate');
                const typeId = yield deep.id('@deep-foundation/core', 'Type');
                const anyId = yield deep.id('@deep-foundation/core', 'Any');
                const handleUpdateTypeId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_b = (_a = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
                const handler = yield insertHandler(handleUpdateTypeId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                debug('handler', handler);
                debug('customLinkId', customLinkId);
                const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId, from_id: typeId, to_id: typeId }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
                try {
                    const updated = yield deep.update(linkId, { to_id: anyId });
                    console.log('updated', updated);
                }
                catch (e) {
                    debug('update error: ', e);
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', insertedByHandler);
                if ((_f = (_e = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id)
                    yield deep.delete((_h = (_g = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id);
                debug('delete handler', yield deleteHandler(handler));
                yield deep.delete(customLinkId);
                yield deep.delete(linkId);
                assert.equal(!!((_k = (_j = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id), true);
            }));
            it(`Handle update on selector`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _l, _m, _o, _p, _q, _r, _s, _t;
                const debug = log.extend('HandleUpdateSelect');
                const handleUpdateTypeId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const selector = yield insertSelector();
                debug('selector', selector);
                const { nodeTypeId, linkTypeId, treeId, selectorId, rootId } = selector;
                const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                const customLinkId = (_m = (_l = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.id;
                const handler = yield insertHandler(handleUpdateTypeId, selectorId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                const { data: [{ id: newToId }] } = yield deep.insert({ type_id: nodeTypeId });
                const selectorItem = yield insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
                debug('handler', handler);
                try {
                    const updated = yield deep.update(selectorItem.linkId, { to_id: newToId });
                    debug('updated', updated);
                }
                catch (e) {
                    error(e);
                }
                const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                debug('insertedByHandler', insertedByHandler);
                if ((_p = (_o = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id)
                    yield deep.delete((_r = (_q = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.id);
                yield deep.delete(customLinkId);
                debug('deleteSelector');
                yield deleteSelector(selector);
                debug('deleteHandler');
                yield deleteHandler(handler);
                assert.equal(!!((_t = (_s = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.id), true);
            }));
            it(`Handle update on type any`, () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToUpdate = [];
                const handleUpdateTypeLinkId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                const supportsLinkId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const typeTypeLinkId = yield deep.id("@deep-foundation/core", "Type");
                const anyTypeLinkId = yield deep.id('@deep-foundation/core', 'Any');
                const expectedErrorMessage = "Success! Handler is called";
                let actualErrorMessage;
                const handler = yield insertHandler(handleUpdateTypeLinkId, anyTypeLinkId, `() => {
            throw new Error("${expectedErrorMessage}");
          }`, undefined, supportsLinkId);
                try {
                    const { data: [newLink] } = yield deep.insert({
                        type_id: typeTypeLinkId,
                        from_id: anyTypeLinkId,
                        to_id: anyTypeLinkId,
                    });
                    linkIdsToUpdate.push(newLink.id);
                    yield deep.update(newLink.id, {
                        to_id: typeTypeLinkId,
                    });
                }
                catch (error) {
                    actualErrorMessage = error.message;
                }
                finally {
                    yield deleteHandler(handler);
                    yield deep.delete(linkIdsToUpdate);
                    debug({ actualErrorMessage, expectedErrorMessage });
                    assert.strictEqual(actualErrorMessage, expectedErrorMessage);
                }
            }));
        });
        describe('Handle value', () => {
            describe('Handle strings', () => {
                it('Handle insert string', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_b = (_a = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId, string: { data: { value: 'helloBugFixers' } } }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
                        const insertedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_f = (_e = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id);
                    if ((_h = (_g = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id)
                        yield deep.delete((_k = (_j = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_m = (_l = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.id), true);
                }));
                it('Handle update string', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_p = (_o = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_r = (_q = (yield deep.insert({ type_id: typeId, string: { data: { value: 'helloBugFixers' } } }))) === null || _q === void 0 ? void 0 : _q.data) === null || _r === void 0 ? void 0 : _r[0].id;
                        const insertedLink = yield deep.select(linkId);
                        const notInsertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                        const updated = yield deep.update({ link_id: linkId }, { value: 'helloBugFixers!' }, { table: 'strings' });
                        const updatedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('notInsertedByHandler', notInsertedByHandler === null || notInsertedByHandler === void 0 ? void 0 : notInsertedByHandler.data);
                        debug('updated', updated === null || updated === void 0 ? void 0 : updated.data);
                        debug('updatedLink', updatedLink === null || updatedLink === void 0 ? void 0 : updatedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_t = (_s = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.id);
                    if ((_v = (_u = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.id)
                        yield deep.delete((_x = (_w = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_z = (_y = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.id), true);
                }));
                it('Handle delete string', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_1 = (_0 = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _0 === void 0 ? void 0 : _0[0]) === null || _1 === void 0 ? void 0 : _1.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_3 = (_2 = (yield deep.insert({ type_id: typeId, string: { data: { value: 'helloBugFixers' } } }))) === null || _2 === void 0 ? void 0 : _2.data) === null || _3 === void 0 ? void 0 : _3[0].id;
                        const insertedLink = yield deep.select(linkId);
                        const notInsertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                        const deleted = yield deep.delete({ link_id: linkId }, { table: 'strings' });
                        const deletedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('notInsertedByHandler', notInsertedByHandler === null || notInsertedByHandler === void 0 ? void 0 : notInsertedByHandler.data);
                        debug('deleted', deleted === null || deleted === void 0 ? void 0 : deleted.data);
                        debug('deletedLink', deletedLink === null || deletedLink === void 0 ? void 0 : deletedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_5 = (_4 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _4 === void 0 ? void 0 : _4[0]) === null || _5 === void 0 ? void 0 : _5.id);
                    if ((_7 = (_6 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _6 === void 0 ? void 0 : _6[0]) === null || _7 === void 0 ? void 0 : _7.id)
                        yield deep.delete((_9 = (_8 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _8 === void 0 ? void 0 : _8[0]) === null || _9 === void 0 ? void 0 : _9.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_11 = (_10 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _10 === void 0 ? void 0 : _10[0]) === null || _11 === void 0 ? void 0 : _11.id), true);
                }));
            });
            describe('Handle numbers', () => {
                it('Handle insert number', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_b = (_a = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId, number: { data: { value: 1 } } }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
                        const insertedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_f = (_e = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id);
                    if ((_h = (_g = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id)
                        yield deep.delete((_k = (_j = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_m = (_l = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.id), true);
                }));
                it('Handle update number', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_p = (_o = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_r = (_q = (yield deep.insert({ type_id: typeId, number: { data: { value: 1 } } }))) === null || _q === void 0 ? void 0 : _q.data) === null || _r === void 0 ? void 0 : _r[0].id;
                        const insertedLink = yield deep.select(linkId);
                        const notInsertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                        const updated = yield deep.update({ link_id: linkId }, { value: 2 }, { table: 'numbers' });
                        const updatedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('notInsertedByHandler', notInsertedByHandler === null || notInsertedByHandler === void 0 ? void 0 : notInsertedByHandler.data);
                        debug('updated', updated === null || updated === void 0 ? void 0 : updated.data);
                        debug('updatedLink', updatedLink === null || updatedLink === void 0 ? void 0 : updatedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_t = (_s = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.id);
                    if ((_v = (_u = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.id)
                        yield deep.delete((_x = (_w = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_z = (_y = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.id), true);
                }));
                it('Handle delete number', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_1 = (_0 = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _0 === void 0 ? void 0 : _0[0]) === null || _1 === void 0 ? void 0 : _1.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_3 = (_2 = (yield deep.insert({ type_id: typeId, number: { data: { value: 1 } } }))) === null || _2 === void 0 ? void 0 : _2.data) === null || _3 === void 0 ? void 0 : _3[0].id;
                        const insertedLink = yield deep.select(linkId);
                        const notInsertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                        const deleted = yield deep.delete({ link_id: linkId }, { table: 'numbers' });
                        const deletedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('notInsertedByHandler', notInsertedByHandler === null || notInsertedByHandler === void 0 ? void 0 : notInsertedByHandler.data);
                        debug('deleted', deleted === null || deleted === void 0 ? void 0 : deleted.data);
                        debug('deletedLink', deletedLink === null || deletedLink === void 0 ? void 0 : deletedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_5 = (_4 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _4 === void 0 ? void 0 : _4[0]) === null || _5 === void 0 ? void 0 : _5.id);
                    if ((_7 = (_6 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _6 === void 0 ? void 0 : _6[0]) === null || _7 === void 0 ? void 0 : _7.id)
                        yield deep.delete((_9 = (_8 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _8 === void 0 ? void 0 : _8[0]) === null || _9 === void 0 ? void 0 : _9.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_11 = (_10 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _10 === void 0 ? void 0 : _10[0]) === null || _11 === void 0 ? void 0 : _11.id), true);
                }));
            });
            describe('Handle objects', () => {
                it('Handle insert object', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_b = (_a = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId, object: { data: { value: { a: 'helloBugFixers' } } } }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
                        const insertedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_f = (_e = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id);
                    if ((_h = (_g = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id)
                        yield deep.delete((_k = (_j = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_m = (_l = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.id), true);
                }));
                it('Handle update object', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_p = (_o = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_r = (_q = (yield deep.insert({ type_id: typeId, object: { data: { value: { a: 'helloBugFixers' } } } }))) === null || _q === void 0 ? void 0 : _q.data) === null || _r === void 0 ? void 0 : _r[0].id;
                        const insertedLink = yield deep.select(linkId);
                        const notInsertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                        const updated = yield deep.update({ link_id: linkId }, { value: { b: 'helloBugFixers' } }, { table: 'objects' });
                        const updatedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('notInsertedByHandler', notInsertedByHandler === null || notInsertedByHandler === void 0 ? void 0 : notInsertedByHandler.data);
                        debug('updated', updated === null || updated === void 0 ? void 0 : updated.data);
                        debug('updatedLink', updatedLink === null || updatedLink === void 0 ? void 0 : updatedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_t = (_s = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.id);
                    if ((_v = (_u = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.id)
                        yield deep.delete((_x = (_w = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_z = (_y = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.id), true);
                }));
                it('Handle delete object', () => __awaiter(void 0, void 0, void 0, function* () {
                    var _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
                    const debug = log.extend('HandleInsertString');
                    const typeId = yield deep.id('@deep-foundation/core', 'Operation');
                    const handleUpdateId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                    const supportsId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                    const anyTypeId = yield deep.id('@deep-foundation/core', 'Any');
                    const inserted = yield deep.insert({ type_id: 1, from_id: anyTypeId, to_id: anyTypeId });
                    const customLinkId = (_1 = (_0 = inserted === null || inserted === void 0 ? void 0 : inserted.data) === null || _0 === void 0 ? void 0 : _0[0]) === null || _1 === void 0 ? void 0 : _1.id;
                    debug('customLinkId', customLinkId);
                    const handler = yield insertHandler(handleUpdateId, typeId, `({deep, data}) => { if (data?.oldLink?.value) deep.insert({type_id: ${customLinkId}, to_id: ${customLinkId}, from_id: ${customLinkId}}); }`, undefined, supportsId);
                    debug('handler', handler);
                    try {
                        const linkId = (_3 = (_2 = (yield deep.insert({ type_id: typeId, object: { data: { value: { a: 'helloBugFixers' } } } }))) === null || _2 === void 0 ? void 0 : _2.data) === null || _3 === void 0 ? void 0 : _3[0].id;
                        const insertedLink = yield deep.select(linkId);
                        const notInsertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                        const deleted = yield deep.delete({ link_id: linkId }, { table: 'objects' });
                        const deletedLink = yield deep.select(linkId);
                        debug('linkId', linkId);
                        debug('insertedLink', insertedLink === null || insertedLink === void 0 ? void 0 : insertedLink.data);
                        debug('notInsertedByHandler', notInsertedByHandler === null || notInsertedByHandler === void 0 ? void 0 : notInsertedByHandler.data);
                        debug('deleted', deleted === null || deleted === void 0 ? void 0 : deleted.data);
                        debug('deletedLink', deletedLink === null || deletedLink === void 0 ? void 0 : deletedLink.data);
                        debug('delete linkid', yield deep.delete({ id: { _eq: linkId } }));
                    }
                    catch (e) {
                        debug('insert error: ', e);
                    }
                    const insertedByHandler = yield deep.select({ type_id: { _eq: customLinkId }, to_id: { _eq: customLinkId }, from_id: { _eq: customLinkId } });
                    debug('insertedByHandler', (_5 = (_4 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _4 === void 0 ? void 0 : _4[0]) === null || _5 === void 0 ? void 0 : _5.id);
                    if ((_7 = (_6 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _6 === void 0 ? void 0 : _6[0]) === null || _7 === void 0 ? void 0 : _7.id)
                        yield deep.delete((_9 = (_8 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _8 === void 0 ? void 0 : _8[0]) === null || _9 === void 0 ? void 0 : _9.id);
                    yield deep.delete(customLinkId);
                    debug('delete handler', yield deleteHandler(handler));
                    assert.equal(!!((_11 = (_10 = insertedByHandler === null || insertedByHandler === void 0 ? void 0 : insertedByHandler.data) === null || _10 === void 0 ? void 0 : _10[0]) === null || _11 === void 0 ? void 0 : _11.id), true);
                }));
            });
            it(`Handle update on type any`, () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const handleUpdateTypeLinkId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
                const supportsLinkId = yield deep.id('@deep-foundation/core', 'plv8SupportsJs');
                const typeTypeLinkId = yield deep.id("@deep-foundation/core", "Type");
                const anyTypeLinkId = yield deep.id('@deep-foundation/core', 'Any');
                const expectedErrorMessage = "Success! Handler is called";
                let actualErrorMessage;
                const handler = yield insertHandler(handleUpdateTypeLinkId, anyTypeLinkId, `() => {
            throw new Error("${expectedErrorMessage}");
          }`, undefined, supportsLinkId);
                try {
                    const { data: [newLink] } = yield deep.insert({
                        type_id: typeTypeLinkId
                    });
                    linkIdsToDelete.push(newLink.id);
                    yield deep.insert({
                        link_id: newLink.id, value: "newValue"
                    }, {
                        table: `strings`
                    });
                }
                catch (error) {
                    actualErrorMessage = error.message;
                }
                finally {
                    yield deleteHandler(handler);
                    yield deep.delete(linkIdsToDelete);
                    assert.strictEqual(actualErrorMessage, expectedErrorMessage);
                }
            }));
        });
    });
});
//# sourceMappingURL=sync-handlers.js.map