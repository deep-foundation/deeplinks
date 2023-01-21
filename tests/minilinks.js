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
const chai_1 = require("chai");
const minilinks_1 = require("../imports/minilinks");
describe('minilinks', () => {
    it(`add 1 3 5`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        const { anomalies } = mlc.add([
            { id: 1, type_id: 3, },
            { id: 3, type_id: 3, from_id: 1, to_id: 2 },
            { id: 5, type_id: 3, from_id: 7, to_id: 3 },
        ]);
        const { errors } = mlc.add([
            { id: 1, type_id: 3, },
        ]);
        (0, chai_1.expect)((_c = (_b = (_a = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _a === void 0 ? void 0 : _a[3]) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id).to.be.equal(1);
        (0, chai_1.expect)((_e = (_d = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _d === void 0 ? void 0 : _d[3]) === null || _e === void 0 ? void 0 : _e.to).to.be.undefined;
        (0, chai_1.expect)((_g = (_f = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _f === void 0 ? void 0 : _f[5]) === null || _g === void 0 ? void 0 : _g.from).to.be.undefined;
        (0, chai_1.expect)(anomalies).to.have.lengthOf(2);
        (0, chai_1.expect)((_h = anomalies === null || anomalies === void 0 ? void 0 : anomalies[0]) === null || _h === void 0 ? void 0 : _h.message).to.be.equal(`3 link.to_id 2 not founded`);
        (0, chai_1.expect)((_j = anomalies === null || anomalies === void 0 ? void 0 : anomalies[1]) === null || _j === void 0 ? void 0 : _j.message).to.be.equal(`5 link.from_id 7 not founded`);
        (0, chai_1.expect)(errors).to.have.lengthOf(1);
        (0, chai_1.expect)((_k = errors === null || errors === void 0 ? void 0 : errors[0]) === null || _k === void 0 ? void 0 : _k.message).to.be.equal(`1 can't add because already exists in collection`);
    }));
    it(`add 2`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 3, from_id: 2 },
            { id: 3, type_id: 3, from_id: 1, to_id: 2 },
            { id: 5, type_id: 2, from_id: 7, to_id: 3 },
        ]);
        const { anomalies } = mlc.add([
            { id: 2, type_id: 1 },
        ]);
        (0, chai_1.expect)(anomalies).to.have.lengthOf(0);
        (0, chai_1.expect)((_o = (_m = (_l = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _l === void 0 ? void 0 : _l[1]) === null || _m === void 0 ? void 0 : _m.from) === null || _o === void 0 ? void 0 : _o.id).to.be.equal(2);
        (0, chai_1.expect)((_q = (_p = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _p === void 0 ? void 0 : _p[3]) === null || _q === void 0 ? void 0 : _q.to).to.not.be.undefined;
        (0, chai_1.expect)((_t = (_s = (_r = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _r === void 0 ? void 0 : _r[3]) === null || _s === void 0 ? void 0 : _s.to) === null || _t === void 0 ? void 0 : _t.id).to.be.equal(2);
        (0, chai_1.expect)((_w = (_v = (_u = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _u === void 0 ? void 0 : _u[5]) === null || _v === void 0 ? void 0 : _v.type) === null || _w === void 0 ? void 0 : _w.id).to.be.equal(2);
    }));
    it(`remove 2`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _x, _y, _z, _0, _1, _2, _3;
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 3, from_id: 2 },
            { id: 3, type_id: 3, from_id: 1, to_id: 2 },
            { id: 5, type_id: 2, from_id: 7, to_id: 3 },
        ]);
        mlc.add([
            { id: 2, type_id: 1 },
        ]);
        const { errors } = mlc.remove([2, 4]);
        (0, chai_1.expect)(errors).to.have.lengthOf(1);
        (0, chai_1.expect)((_x = errors === null || errors === void 0 ? void 0 : errors[0]) === null || _x === void 0 ? void 0 : _x.message).to.be.equal(`4 can't delete because not exists in collection`);
        (0, chai_1.expect)((_z = (_y = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _y === void 0 ? void 0 : _y[1]) === null || _z === void 0 ? void 0 : _z.from).to.be.undefined;
        (0, chai_1.expect)((_1 = (_0 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _0 === void 0 ? void 0 : _0[3]) === null || _1 === void 0 ? void 0 : _1.to).to.be.undefined;
        (0, chai_1.expect)((_3 = (_2 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _2 === void 0 ? void 0 : _2[5]) === null || _3 === void 0 ? void 0 : _3.type).to.be.undefined;
    }));
    it(`apply`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18;
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        const events = [];
        mlc.emitter.on('apply', (o, n) => events.push(o ? o.id : n.id));
        mlc.apply([
            { id: 1, type_id: 3, from_id: 2 },
            { id: 3, type_id: 3, from_id: 1, to_id: 2, value: { value: 123 } },
            { id: 5, type_id: 2, from_id: 7, to_id: 3 },
        ]);
        mlc.apply([
            { id: 1, type_id: 3, from_id: 2 },
            { id: 2, type_id: 1 },
            { id: 3, type_id: 1, from_id: 5, to_id: 2, value: { value: 234 } },
        ]);
        (0, chai_1.expect)((_6 = (_5 = (_4 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _4 === void 0 ? void 0 : _4[2]) === null || _5 === void 0 ? void 0 : _5.type) === null || _6 === void 0 ? void 0 : _6.id).to.be.equal(1);
        (0, chai_1.expect)((_9 = (_8 = (_7 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _7 === void 0 ? void 0 : _7[3]) === null || _8 === void 0 ? void 0 : _8.type) === null || _9 === void 0 ? void 0 : _9.id).to.be.equal(1);
        (0, chai_1.expect)((_11 = (_10 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _10 === void 0 ? void 0 : _10[3]) === null || _11 === void 0 ? void 0 : _11.from).to.be.undefined;
        (0, chai_1.expect)((_14 = (_13 = (_12 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _12 === void 0 ? void 0 : _12[3]) === null || _13 === void 0 ? void 0 : _13.to) === null || _14 === void 0 ? void 0 : _14.id).to.be.equal(2);
        (0, chai_1.expect)((_17 = (_16 = (_15 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _15 === void 0 ? void 0 : _15[3]) === null || _16 === void 0 ? void 0 : _16.value) === null || _17 === void 0 ? void 0 : _17.value).to.be.equal(234);
        (0, chai_1.expect)((_18 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _18 === void 0 ? void 0 : _18[5]).to.be.undefined;
        chai_1.assert.deepEqual(events, [1, 3, 5, 2]);
    }));
    it(`apply`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33;
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.apply([
            { id: 1, type_id: 3, from_id: 2 },
            { id: 3, type_id: 3, from_id: 1, to_id: 2, value: { value: 123 } },
            { id: 5, type_id: 2, from_id: 7, to_id: 3 },
        ]);
        mlc.apply([
            { id: 1, type_id: 3, from_id: 2 },
            { id: 2, type_id: 1 },
            { id: 3, type_id: 1, from_id: 5, to_id: 2, value: { value: 234 } },
        ]);
        (0, chai_1.expect)((_21 = (_20 = (_19 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _19 === void 0 ? void 0 : _19[2]) === null || _20 === void 0 ? void 0 : _20.type) === null || _21 === void 0 ? void 0 : _21.id).to.be.equal(1);
        (0, chai_1.expect)((_24 = (_23 = (_22 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _22 === void 0 ? void 0 : _22[3]) === null || _23 === void 0 ? void 0 : _23.type) === null || _24 === void 0 ? void 0 : _24.id).to.be.equal(1);
        (0, chai_1.expect)((_26 = (_25 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _25 === void 0 ? void 0 : _25[3]) === null || _26 === void 0 ? void 0 : _26.from).to.be.undefined;
        (0, chai_1.expect)((_29 = (_28 = (_27 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _27 === void 0 ? void 0 : _27[3]) === null || _28 === void 0 ? void 0 : _28.to) === null || _29 === void 0 ? void 0 : _29.id).to.be.equal(2);
        (0, chai_1.expect)((_32 = (_31 = (_30 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _30 === void 0 ? void 0 : _30[3]) === null || _31 === void 0 ? void 0 : _31.value) === null || _32 === void 0 ? void 0 : _32.value).to.be.equal(234);
        (0, chai_1.expect)((_33 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _33 === void 0 ? void 0 : _33[5]).to.be.undefined;
    }));
    describe('multiple applies', () => {
        it(`equal`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
            mlc.apply([
                { id: 1, type_id: 3 },
            ], '1');
            mlc.apply([
                { id: 1, type_id: 3 },
            ], '2');
            (0, chai_1.expect)((_b = (_a = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b._applies.length).to.be.equal(2);
            mlc.apply([], '1');
            (0, chai_1.expect)((_d = (_c = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d._applies.length).to.be.equal(1);
            (0, chai_1.expect)((_f = (_e = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f._applies[0]).to.be.equal('2');
            mlc.apply([
                { id: 2, type_id: 3 },
            ], '2');
            (0, chai_1.expect)((_g = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _g === void 0 ? void 0 : _g[1]).to.be.undefined;
            (0, chai_1.expect)((_j = (_h = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _h === void 0 ? void 0 : _h[2]) === null || _j === void 0 ? void 0 : _j._applies.length).to.be.equal(1);
        }));
        it(`different`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
            const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
            mlc.apply([
                { id: 1, type_id: 3 },
                { id: 2, type_id: 3 },
            ], '1');
            mlc.apply([
                { id: 2, type_id: 3 },
                { id: 3, type_id: 3 },
            ], '2');
            (0, chai_1.expect)((_k = mlc === null || mlc === void 0 ? void 0 : mlc.links) === null || _k === void 0 ? void 0 : _k.length).to.be.equal(3);
            (0, chai_1.expect)((_m = (_l = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _l === void 0 ? void 0 : _l[1]) === null || _m === void 0 ? void 0 : _m._applies.length).to.be.equal(1);
            (0, chai_1.expect)((_p = (_o = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _o === void 0 ? void 0 : _o[2]) === null || _p === void 0 ? void 0 : _p._applies.length).to.be.equal(2);
            (0, chai_1.expect)((_r = (_q = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _q === void 0 ? void 0 : _q[3]) === null || _r === void 0 ? void 0 : _r._applies.length).to.be.equal(1);
            mlc.apply([
                { id: 1, type_id: 3 },
            ], '1');
            (0, chai_1.expect)((_s = mlc === null || mlc === void 0 ? void 0 : mlc.links) === null || _s === void 0 ? void 0 : _s.length).to.be.equal(3);
            (0, chai_1.expect)((_u = (_t = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _t === void 0 ? void 0 : _t[1]) === null || _u === void 0 ? void 0 : _u._applies.length).to.be.equal(1);
            (0, chai_1.expect)((_w = (_v = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _v === void 0 ? void 0 : _v[2]) === null || _w === void 0 ? void 0 : _w._applies.length).to.be.equal(1);
            (0, chai_1.expect)((_y = (_x = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _x === void 0 ? void 0 : _x[3]) === null || _y === void 0 ? void 0 : _y._applies.length).to.be.equal(1);
            mlc.apply([], '2');
            (0, chai_1.expect)((_z = mlc === null || mlc === void 0 ? void 0 : mlc.links) === null || _z === void 0 ? void 0 : _z.length).to.be.equal(1);
            (0, chai_1.expect)((_1 = (_0 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _0 === void 0 ? void 0 : _0[1]) === null || _1 === void 0 ? void 0 : _1._applies.length).to.be.equal(1);
            (0, chai_1.expect)((_2 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _2 === void 0 ? void 0 : _2[2]).to.be.undefined;
            (0, chai_1.expect)((_3 = mlc === null || mlc === void 0 ? void 0 : mlc.byId) === null || _3 === void 0 ? void 0 : _3[3]).to.be.undefined;
        }));
    });
});
//# sourceMappingURL=minilinks.js.map