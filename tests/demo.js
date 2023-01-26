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
const client_1 = require("@deep-foundation/hasura/client");
const client_2 = require("../imports/client");
const chai_1 = require("chai");
const apolloClient = (0, client_1.generateApolloClient)({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const deep = new client_2.DeepClient({ apolloClient });
describe('demo', () => {
    it(`user can basic dc operations`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        const g1 = yield deep.guest();
        const d1 = new client_2.DeepClient(Object.assign({ deep }, g1));
        const i1s1 = yield d1.insert({ type_id: yield d1.id('@deep-foundation/core', 'Space') });
        const i1c1 = yield d1.insert({ type_id: yield d1.id('@deep-foundation/core', 'Contain'), from_id: g1.linkId, to_id: (_b = (_a = i1s1 === null || i1s1 === void 0 ? void 0 : i1s1.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id });
        (0, chai_1.expect)((_d = (_c = i1s1 === null || i1s1 === void 0 ? void 0 : i1s1.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.id).is.not.undefined;
        const i1q1 = yield d1.insert({ type_id: yield d1.id('@deep-foundation/core', 'Query'), object: { data: { value: { limit: 0 } } } });
        (0, chai_1.expect)((_f = (_e = i1q1 === null || i1q1 === void 0 ? void 0 : i1q1.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id).is.not.undefined;
        const i1c2 = yield d1.insert({ type_id: yield d1.id('@deep-foundation/core', 'Contain'), from_id: (_h = (_g = i1s1 === null || i1s1 === void 0 ? void 0 : i1s1.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id, to_id: (_k = (_j = i1q1 === null || i1q1 === void 0 ? void 0 : i1q1.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id });
        (0, chai_1.expect)((_m = (_l = i1c1 === null || i1c1 === void 0 ? void 0 : i1c1.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.id).is.not.undefined;
        const u1q1 = yield d1.update({ link_id: { _eq: (_p = (_o = i1q1 === null || i1q1 === void 0 ? void 0 : i1q1.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id } }, { value: { limit: 1 } }, { table: 'objects' });
        const s1q1 = yield d1.select((_r = (_q = i1q1 === null || i1q1 === void 0 ? void 0 : i1q1.data) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.id);
        (0, chai_1.expect)((_v = (_u = (_t = (_s = s1q1 === null || s1q1 === void 0 ? void 0 : s1q1.data) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.value) === null || _u === void 0 ? void 0 : _u.value) === null || _v === void 0 ? void 0 : _v.limit).is.equal(1);
        const i1f1 = yield d1.insert({ type_id: yield d1.id('@deep-foundation/core', 'Focus'), from_id: (_x = (_w = i1s1 === null || i1s1 === void 0 ? void 0 : i1s1.data) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.id, to_id: (_z = (_y = i1q1 === null || i1q1 === void 0 ? void 0 : i1q1.data) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.id });
        const i1c3 = yield d1.insert({ type_id: yield d1.id('@deep-foundation/core', 'Contain'), from_id: (_1 = (_0 = i1s1 === null || i1s1 === void 0 ? void 0 : i1s1.data) === null || _0 === void 0 ? void 0 : _0[0]) === null || _1 === void 0 ? void 0 : _1.id, to_id: (_3 = (_2 = i1f1 === null || i1f1 === void 0 ? void 0 : i1f1.data) === null || _2 === void 0 ? void 0 : _2[0]) === null || _3 === void 0 ? void 0 : _3.id });
        const s1f1 = yield d1.select((_5 = (_4 = i1f1 === null || i1f1 === void 0 ? void 0 : i1f1.data) === null || _4 === void 0 ? void 0 : _4[0]) === null || _5 === void 0 ? void 0 : _5.id);
        (0, chai_1.expect)((_7 = (_6 = s1f1 === null || s1f1 === void 0 ? void 0 : s1f1.data) === null || _6 === void 0 ? void 0 : _6[0]) === null || _7 === void 0 ? void 0 : _7.id).is.not.undefined;
    }));
});
//# sourceMappingURL=demo.js.map