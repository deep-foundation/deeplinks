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
const unloginedDeep = new client_2.DeepClient({ apolloClient });
let adminToken;
let deep;
describe('messanger', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    }));
    it(`guest message`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const guest = yield unloginedDeep.guest();
        const guestDeep = new client_2.DeepClient(Object.assign({ deep: unloginedDeep }, guest));
        const inserted = yield guestDeep.insert({
            type_id: yield guestDeep.id('@deep-foundation/messenger', 'Message'),
            string: { data: { value: 'test guest message' } },
            out: { data: [
                    {
                        type_id: yield guestDeep.id('@deep-foundation/messenger', 'Author'),
                        to_id: guestDeep.linkId,
                    },
                    {
                        type_id: yield guestDeep.id('@deep-foundation/messenger', 'Reply'),
                        to_id: guestDeep.linkId,
                        out: { data: {
                                type_id: yield guestDeep.id('@deep-foundation/messenger', 'Join'),
                                to_id: guestDeep.linkId,
                            } },
                    },
                ] },
        });
        const { data: [{ id }] } = inserted;
        console.log(inserted);
        const result = yield guestDeep.select({ id });
        console.log(result);
        chai_1.assert.lengthOf(result === null || result === void 0 ? void 0 : result.data, 1);
        chai_1.assert.equal((_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.value, 'test guest message');
    }));
    it(`guest A join B, B reply A`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const guestA = yield unloginedDeep.guest();
        const guestADeep = new client_2.DeepClient(Object.assign({ deep: unloginedDeep }, guestA));
        const guestB = yield unloginedDeep.guest();
        const guestBDeep = new client_2.DeepClient(Object.assign({ deep: unloginedDeep }, guestB));
        const { data: [{ id: messageAId }] } = yield guestADeep.insert({
            type_id: yield guestADeep.id('@deep-foundation/messenger', 'Message'),
            string: { data: { value: 'test guest A message' } },
            out: { data: [
                    {
                        type_id: yield guestADeep.id('@deep-foundation/messenger', 'Author'),
                        to_id: guestADeep.linkId,
                    },
                    {
                        type_id: yield guestADeep.id('@deep-foundation/messenger', 'Reply'),
                        to_id: guestADeep.linkId,
                        out: { data: [
                                {
                                    type_id: yield guestADeep.id('@deep-foundation/messenger', 'Join'),
                                    to_id: guestADeep.linkId,
                                },
                                {
                                    type_id: yield guestADeep.id('@deep-foundation/messenger', 'Join'),
                                    to_id: guestBDeep.linkId,
                                },
                            ] },
                    },
                ] },
        });
        const { data: [{ id: messageBId }] } = yield guestBDeep.insert({
            type_id: yield guestADeep.id('@deep-foundation/messenger', 'Message'),
            string: { data: { value: 'test guest B message' } },
            out: { data: [
                    {
                        type_id: yield guestADeep.id('@deep-foundation/messenger', 'Author'),
                        to_id: guestADeep.linkId,
                    },
                    {
                        type_id: yield guestADeep.id('@deep-foundation/messenger', 'Reply'),
                        to_id: messageAId,
                    },
                ] },
        });
        const resultA = yield guestADeep.select({ id: messageAId });
        const resultB = yield guestBDeep.select({ id: messageBId });
        chai_1.assert.lengthOf(resultA === null || resultA === void 0 ? void 0 : resultA.data, 2);
        chai_1.assert.equal((_f = (_e = (_d = resultA === null || resultA === void 0 ? void 0 : resultA.data) === null || _d === void 0 ? void 0 : _d[1]) === null || _e === void 0 ? void 0 : _e.value) === null || _f === void 0 ? void 0 : _f.value, 'test guest A message');
        chai_1.assert.equal((_j = (_h = (_g = resultA === null || resultA === void 0 ? void 0 : resultA.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.value) === null || _j === void 0 ? void 0 : _j.value, 'test guest B message');
        chai_1.assert.lengthOf(resultB === null || resultB === void 0 ? void 0 : resultB.data, 2);
        chai_1.assert.equal((_m = (_l = (_k = resultB === null || resultB === void 0 ? void 0 : resultB.data) === null || _k === void 0 ? void 0 : _k[1]) === null || _l === void 0 ? void 0 : _l.value) === null || _m === void 0 ? void 0 : _m.value, 'test guest A message');
        chai_1.assert.equal((_q = (_p = (_o = resultB === null || resultB === void 0 ? void 0 : resultB.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.value) === null || _q === void 0 ? void 0 : _q.value, 'test guest B message');
    }));
    it(`guest A join B, B reply A, A delete join B`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _r, _s, _t, _u, _v, _w;
        const guestA = yield unloginedDeep.guest();
        const guestADeep = new client_2.DeepClient(Object.assign({ deep: unloginedDeep }, guestA));
        const guestB = yield unloginedDeep.guest();
        const guestBDeep = new client_2.DeepClient(Object.assign({ deep: unloginedDeep }, guestB));
        const admin = yield unloginedDeep.login({ linkId: yield unloginedDeep.id('deep', 'admin') });
        const deep = new client_2.DeepClient(Object.assign({ deep: unloginedDeep }, admin));
        const { data: [{ id: messageAId }] } = yield guestADeep.insert({
            type_id: yield guestADeep.id('@deep-foundation/messenger', 'Message'),
            string: { data: { value: 'test guest A message' } },
            out: { data: [
                    {
                        type_id: yield guestADeep.id('@deep-foundation/messenger', 'Author'),
                        to_id: guestADeep.linkId,
                    },
                    {
                        type_id: yield guestADeep.id('@deep-foundation/messenger', 'Reply'),
                        to_id: guestADeep.linkId,
                        out: { data: [
                                {
                                    type_id: yield guestADeep.id('@deep-foundation/messenger', 'Join'),
                                    to_id: guestADeep.linkId,
                                },
                                {
                                    type_id: yield guestADeep.id('@deep-foundation/messenger', 'Join'),
                                    to_id: guestBDeep.linkId,
                                },
                            ] },
                    },
                ] },
        });
        const { data: [{ id: messageBId }] } = yield guestBDeep.insert({
            type_id: yield guestADeep.id('@deep-foundation/messenger', 'Message'),
            string: { data: { value: 'test guest B message' } },
            out: { data: [
                    {
                        type_id: yield guestADeep.id('@deep-foundation/messenger', 'Author'),
                        to_id: guestADeep.linkId,
                    },
                    {
                        type_id: yield guestADeep.id('@deep-foundation/messenger', 'Reply'),
                        to_id: messageAId,
                    },
                ] },
        });
        yield deep.delete({
            type_id: yield guestADeep.id('@deep-foundation/messenger', 'Join'),
            to_id: guestBDeep.linkId,
            from: {
                type_id: yield guestADeep.id('@deep-foundation/messenger', 'Reply'),
                to_id: guestADeep.linkId,
            },
        });
        const resultA = yield guestADeep.select({ id: messageAId });
        const resultB = yield guestBDeep.select({ id: messageBId });
        chai_1.assert.lengthOf(resultA === null || resultA === void 0 ? void 0 : resultA.data, 2);
        chai_1.assert.equal((_t = (_s = (_r = resultA === null || resultA === void 0 ? void 0 : resultA.data) === null || _r === void 0 ? void 0 : _r[1]) === null || _s === void 0 ? void 0 : _s.value) === null || _t === void 0 ? void 0 : _t.value, 'test guest A message');
        chai_1.assert.equal((_w = (_v = (_u = resultA === null || resultA === void 0 ? void 0 : resultA.data) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.value) === null || _w === void 0 ? void 0 : _w.value, 'test guest B message');
        chai_1.assert.lengthOf(resultB === null || resultB === void 0 ? void 0 : resultB.data, 0);
    }));
});
//# sourceMappingURL=messanger.js.map