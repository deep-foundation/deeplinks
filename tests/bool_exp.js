"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const api_1 = require("@deep-foundation/hasura/api");
const client_1 = require("@deep-foundation/hasura/client");
const chai_1 = require("chai");
const bool_exp_to_sql_1 = require("../imports/bool_exp_to_sql");
const client_2 = require("../imports/client");
const promise_1 = require("../imports/promise");
exports.api = new api_1.HasuraApi({
    path: process.env.DEEPLINKS_HASURA_PATH,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const apolloClient = (0, client_1.generateApolloClient)({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const deep = new client_2.DeepClient({ apolloClient });
let adminToken;
let admin;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const { linkId, token } = yield deep.jwt({ linkId: yield deep.id('deep', 'admin') });
    adminToken = token;
    admin = new client_2.DeepClient({ deep, token: adminToken, linkId });
}));
describe('bool_exp', () => {
    describe('value convertation', () => {
        it(`insert separately`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const { data: [{ id: t1 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Any'),
            });
            const { data: [{ id: t2 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Any'),
            });
            const { data: [{ id: boolExpId }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Query'),
            });
            yield deep.insert({
                link_id: boolExpId,
                value: { id: { _eq: t1 } },
            }, { table: 'objects' });
            yield deep.await(boolExpId);
            yield (0, promise_1.delay)(2000);
            const { data: [{ value: sql }], error } = yield deep.select({
                link_id: { _eq: boolExpId },
            }, { table: 'bool_exp', returning: 'id link_id value' });
            const { data: d1 } = yield exports.api.sql((0, bool_exp_to_sql_1.applyBoolExpToLink)(sql, t1));
            (0, chai_1.expect)(+((_b = (_a = d1 === null || d1 === void 0 ? void 0 : d1.result) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b[0])).to.equal(1);
            const { data: d2 } = yield exports.api.sql((0, bool_exp_to_sql_1.applyBoolExpToLink)(sql, t2));
            (0, chai_1.expect)(+((_d = (_c = d2 === null || d2 === void 0 ? void 0 : d2.result) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d[0])).to.equal(0);
        }));
        it(`insert with link`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _e, _f, _g, _h;
            const { data: [{ id: t1 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Any'),
            });
            const { data: [{ id: t2 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Any'),
            });
            const { data: [{ id: boolExpId }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Query'),
                object: { data: { value: { id: { _eq: t1 } } } },
            });
            yield deep.await(boolExpId);
            yield (0, promise_1.delay)(2000);
            const { data: [{ value: sql }], error } = yield deep.select({
                link_id: { _eq: boolExpId },
            }, { table: 'bool_exp', returning: 'id link_id value' });
            const { data: d1 } = yield exports.api.sql((0, bool_exp_to_sql_1.applyBoolExpToLink)(sql, t1));
            (0, chai_1.expect)(+((_f = (_e = d1 === null || d1 === void 0 ? void 0 : d1.result) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f[0])).to.equal(1);
            const { data: d2 } = yield exports.api.sql((0, bool_exp_to_sql_1.applyBoolExpToLink)(sql, t2));
            (0, chai_1.expect)(+((_h = (_g = d2 === null || d2 === void 0 ? void 0 : d2.result) === null || _g === void 0 ? void 0 : _g[1]) === null || _h === void 0 ? void 0 : _h[0])).to.equal(0);
        }));
        it(`update`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _j, _k, _l, _m;
            const { data: [{ id: t1 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Any'),
            });
            const { data: [{ id: t2 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Any'),
            });
            const { data: [{ id: boolExpId }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Query'),
                object: { data: { value: { id: { _eq: t1 } } } },
            });
            yield deep.await(boolExpId);
            yield (0, promise_1.delay)(2000);
            yield deep.update({ link_id: { _eq: boolExpId } }, {
                value: { id: { _eq: t2 } },
            }, { table: 'objects' });
            yield deep.await(boolExpId);
            yield (0, promise_1.delay)(2000);
            const { data: [{ value: sql }], error } = yield deep.select({
                link_id: { _eq: boolExpId },
            }, { table: 'bool_exp', returning: 'id link_id value' });
            const { data: d1 } = yield exports.api.sql((0, bool_exp_to_sql_1.applyBoolExpToLink)(sql, t1));
            (0, chai_1.expect)(+((_k = (_j = d1 === null || d1 === void 0 ? void 0 : d1.result) === null || _j === void 0 ? void 0 : _j[1]) === null || _k === void 0 ? void 0 : _k[0])).to.equal(0);
            const { data: d2 } = yield exports.api.sql((0, bool_exp_to_sql_1.applyBoolExpToLink)(sql, t2));
            (0, chai_1.expect)(+((_m = (_l = d2 === null || d2 === void 0 ? void 0 : d2.result) === null || _l === void 0 ? void 0 : _l[1]) === null || _m === void 0 ? void 0 : _m[0])).to.equal(1);
        }));
        it(`delete`, () => __awaiter(void 0, void 0, void 0, function* () {
            const { data: [{ id: t1 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Any'),
            });
            const { data: [{ id: t2 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Any'),
            });
            const { data: [{ id: boolExpId }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Query'),
                object: { data: { value: { id: { _eq: t1 } } } },
            });
            yield deep.await(boolExpId);
            yield (0, promise_1.delay)(2000);
            yield deep.delete({ link_id: { _eq: boolExpId } }, { table: 'objects' });
            yield deep.await(boolExpId);
            yield (0, promise_1.delay)(2000);
            const { data, error } = yield deep.select({
                link_id: { _eq: boolExpId },
            }, { table: 'bool_exp', returning: 'id link_id value' });
            (0, chai_1.expect)(data).to.be.empty;
        }));
        it(`X-Deep-User-Id`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _o, _p, _q, _r, _s, _t, _u, _v;
            const g1 = yield deep.guest({});
            const { data: [{ id: boolExpId }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Query'),
                object: { data: { value: { id: { _eq: 'X-Deep-User-Id' } } } },
                in: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                        from_id: g1.linkId,
                    } },
            });
            yield deep.await(boolExpId);
            yield (0, promise_1.delay)(2000);
            const d1s = yield deep.select({
                id: { _eq: boolExpId },
            }, { returning: `exec_bool_exp(args: { link_id: ${g1.linkId} }) { id }` });
            (0, chai_1.expect)(((_p = (_o = d1s === null || d1s === void 0 ? void 0 : d1s.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.exec_bool_exp) || []).to.be.empty;
            const deep1 = new client_2.DeepClient(Object.assign({ deep }, g1));
            const g1s = yield deep1.select({
                id: { _eq: boolExpId },
            }, { returning: `exec_bool_exp(args: { link_id: ${g1.linkId} }) { id }` });
            (0, chai_1.expect)(((_r = (_q = g1s === null || g1s === void 0 ? void 0 : g1s.data) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.exec_bool_exp) || []).to.not.be.empty;
            (0, chai_1.expect)((_v = (_u = (_t = (_s = g1s === null || g1s === void 0 ? void 0 : g1s.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.exec_bool_exp) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.id).to.be.equal(g1.linkId);
        }));
        it(`X-Deep-Item-Id`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _w, _x, _y, _z;
            const { data: [{ id: boolExpId }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Query'),
                object: { data: { value: { id: { _eq: 'X-Deep-Item-Id' } } } },
            });
            yield deep.await(boolExpId);
            yield (0, promise_1.delay)(2000);
            const d1s = yield admin.select({
                id: { _eq: boolExpId },
            }, { returning: `exec_bool_exp(args: { link_id: ${boolExpId} }) { id }` });
            (0, chai_1.expect)((_z = (_y = (_x = (_w = d1s === null || d1s === void 0 ? void 0 : d1s.data) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.exec_bool_exp) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.id).to.be.equal(boolExpId);
        }));
    });
});
//# sourceMappingURL=bool_exp.js.map