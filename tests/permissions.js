var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { assert, expect } from 'chai';
import { delay } from "../imports/promise";
const apolloClient = generateApolloClient({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const root = new DeepClient({ apolloClient });
let admin;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const { linkId, token, error } = yield root.jwt({ linkId: yield root.id('deep', 'admin') });
    admin = new DeepClient({ deep, token, linkId });
}));
let deep = root;
describe('permissions', () => {
    describe('select', () => {
        it(`user contain range`, () => __awaiter(void 0, void 0, void 0, function* () {
            const a1 = yield deep.guest({});
            const a2 = yield deep.guest({});
            const d1 = new DeepClient(Object.assign({ deep }, a1));
            const d2 = new DeepClient(Object.assign({ deep }, a2));
            const { data: [{ id }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                in: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                        from_id: a1.linkId,
                    } }
            });
            const n1 = yield d1.select({ id });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1, `item_id ${id} must be selectable by ${a1.linkId}`);
            const n2 = yield d2.select({ id });
            assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 0, `item_id ${id} must not be selectable by ${a2.linkId}`);
            const n3 = yield admin.select({ id });
            assert.lengthOf(n3 === null || n3 === void 0 ? void 0 : n3.data, 1, `item_id ${id} must be selectable by ${admin.linkId}`);
        }));
        it(`rule select include 1 depth but exclude 2 depth`, () => __awaiter(void 0, void 0, void 0, function* () {
            const a1 = yield deep.guest({});
            const a2 = yield deep.guest({});
            const a3 = yield deep.guest({});
            const d1 = new DeepClient(Object.assign({ deep }, a1));
            const d2 = new DeepClient(Object.assign({ deep }, a2));
            const d3 = new DeepClient(Object.assign({ deep }, a3));
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
            const n1 = yield d1.select({ id: id1 });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
            const n2 = yield d2.select({ id: id1 });
            assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 1);
            const n3 = yield d3.select({ id: id1 });
            assert.lengthOf(n3 === null || n3 === void 0 ? void 0 : n3.data, 0);
            const n4 = yield admin.select({ id: id1 });
            assert.lengthOf(n4 === null || n4 === void 0 ? void 0 : n4.data, 1);
            const n5 = yield d1.select({ id: id2 });
            assert.lengthOf(n5 === null || n5 === void 0 ? void 0 : n5.data, 1);
            const n6 = yield d2.select({ id: id2 });
            assert.lengthOf(n6 === null || n6 === void 0 ? void 0 : n6.data, 0);
            const n7 = yield d3.select({ id: id2 });
            assert.lengthOf(n7 === null || n7 === void 0 ? void 0 : n7.data, 0);
            const n8 = yield admin.select({ id: id2 });
            assert.lengthOf(n8 === null || n8 === void 0 ? void 0 : n8.data, 1);
        }));
    });
    describe('insert', () => {
        it(`root can insert`, () => __awaiter(void 0, void 0, void 0, function* () {
            const { data: [{ id }], error } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            const n1 = yield deep.select({ id });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
        }));
        it(`guest cant insert by default`, () => __awaiter(void 0, void 0, void 0, function* () {
            const a1 = yield deep.guest({});
            const d1 = new DeepClient(Object.assign(Object.assign({ deep }, a1), { silent: true }));
            const { data, error } = yield d1.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            assert.isNotEmpty(error);
        }));
        it(`insert permission can be gived to guest`, () => __awaiter(void 0, void 0, void 0, function* () {
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
            const d1 = new DeepClient(Object.assign(Object.assign({ deep }, a1), { silent: true }));
            const { data: da1, error: e1 } = yield d1.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            if (e1)
                console.log('error', e1);
            expect(da1).to.not.be.undefined;
            expect(e1).to.be.undefined;
            const d2 = new DeepClient(Object.assign(Object.assign({ deep }, a2), { silent: true }));
            const { data: da2, error: e2 } = yield d2.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            expect(da2).to.not.be.undefined;
            expect(e2).to.be.undefined;
            const d3 = new DeepClient(Object.assign(Object.assign({ deep }, a3), { silent: true }));
            const { data: da3, error: e3 } = yield d3.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            expect(da3).to.be.undefined;
            expect(e3).to.not.be.undefined;
        }));
        it(`insert permission with SelectorFilter`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
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
            const d1 = new DeepClient(Object.assign(Object.assign({ deep }, a1), { silent: true }));
            const { data: da1, error: e1 } = yield d1.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            expect(da1).to.not.be.undefined;
            expect(e1).to.be.undefined;
            const { data: da1t, error: e1t } = yield d1.insert({
                type_id: TempType,
                from_id: (_a = da1 === null || da1 === void 0 ? void 0 : da1[0]) === null || _a === void 0 ? void 0 : _a.id,
                to_id: a1.linkId,
            });
            expect(da1t).to.not.be.undefined;
            expect(e1t).to.be.undefined;
            const d2 = new DeepClient(Object.assign(Object.assign({ deep }, a2), { silent: true }));
            const { data: da2, error: e2 } = yield d2.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            expect(da2).to.not.be.undefined;
            expect(e2).to.be.undefined;
            const { data: da2t, error: e2t } = yield d2.insert({
                type_id: TempType,
                from_id: (_b = da2 === null || da2 === void 0 ? void 0 : da2[0]) === null || _b === void 0 ? void 0 : _b.id,
                to_id: a1.linkId,
            });
            expect(da2t).to.be.undefined;
            expect(e2t).to.not.be.undefined;
            const d3 = new DeepClient(Object.assign(Object.assign({ deep }, a3), { silent: true }));
            const { data: da3, error: e3 } = yield d3.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            expect(da3).to.not.be.undefined;
            expect(e3).to.be.undefined;
            const { data: da3t, error: e3t } = yield d3.insert({
                type_id: TempType,
                from_id: (_c = da2 === null || da2 === void 0 ? void 0 : da2[0]) === null || _c === void 0 ? void 0 : _c.id,
                to_id: a3.linkId,
            });
            expect(da3t).to.not.be.undefined;
            expect(e3t).to.be.undefined;
        }));
    });
    describe('update', () => {
        it(`root can update string value`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const { data: [{ id }], error } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                string: { data: { value: 'abc' } },
            });
            yield deep.update({ link_id: id }, {
                value: 'def',
            }, { table: 'strings' });
            const n1 = yield deep.select({ id });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
            assert.equal((_c = (_b = (_a = n1 === null || n1 === void 0 ? void 0 : n1.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.value, 'def');
        }));
        it(`guest cant update string value`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _d, _e, _f;
            const a1 = yield deep.guest({});
            const { data: [{ id }], error } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                string: { data: { value: 'abc' } },
            });
            const d1 = new DeepClient(Object.assign({ deep }, a1));
            const { data: updated } = yield d1.update({ link_id: id }, {
                value: 'def',
            }, { table: 'strings' });
            assert.lengthOf(updated, 0);
            const n1 = yield deep.select({ id });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
            assert.equal((_f = (_e = (_d = n1 === null || n1 === void 0 ? void 0 : n1.data) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.value) === null || _f === void 0 ? void 0 : _f.value, 'abc');
        }));
        it(`update permission can be gived to guest`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _g, _h, _j, _k, _l, _m, _o, _p, _q;
            const { data: [{ id }], error } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                string: { data: { value: 'abc' } },
            });
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
                                            to_id: yield deep.id('@deep-foundation/core', 'AllowUpdateType'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                } },
                                        } }
                                } }
                        },
                    ] },
            });
            const d1 = new DeepClient(Object.assign({ deep }, a1));
            const { data: u1 } = yield d1.update({ link_id: id }, {
                value: 'def',
            }, { table: 'strings' });
            assert.lengthOf(u1, 1);
            const n1 = yield deep.select({ id });
            assert.equal((_j = (_h = (_g = n1 === null || n1 === void 0 ? void 0 : n1.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.value) === null || _j === void 0 ? void 0 : _j.value, 'def');
            const d2 = new DeepClient(Object.assign({ deep }, a2));
            const { data: u2 } = yield d2.update({ link_id: id }, {
                value: 'efg',
            }, { table: 'strings' });
            assert.lengthOf(u2, 1);
            const n2 = yield deep.select({ id });
            assert.equal((_m = (_l = (_k = n2 === null || n2 === void 0 ? void 0 : n2.data) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.value) === null || _m === void 0 ? void 0 : _m.value, 'efg');
            const d3 = new DeepClient(Object.assign({ deep }, a3));
            const { data: u3 } = yield d3.update({ link_id: id }, {
                value: 'fgj',
            }, { table: 'strings' });
            assert.lengthOf(u3, 0);
            const n3 = yield deep.select({ id });
            assert.equal((_q = (_p = (_o = n3 === null || n3 === void 0 ? void 0 : n3.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.value) === null || _q === void 0 ? void 0 : _q.value, 'efg');
        }));
    });
    describe('delete', () => {
        it(`root can delete`, () => __awaiter(void 0, void 0, void 0, function* () {
            const { data: [{ id }], error } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            const n1 = yield deep.select({ id });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
            const { data: deleted } = yield deep.delete(id);
            assert.lengthOf(deleted, 1);
            const n2 = yield deep.select({ id });
            assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 0);
        }));
        it(`guest cant delete by default`, () => __awaiter(void 0, void 0, void 0, function* () {
            const { data: [{ id }], error } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            const n1 = yield deep.select({ id });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
            const a1 = yield deep.guest({});
            const d1 = new DeepClient(Object.assign({ deep }, a1));
            const { data: deleted } = yield d1.delete(id);
            assert.lengthOf(deleted, 0);
            const n2 = yield deep.select({ id });
        }));
        it(`delete permission can be gived to guest`, () => __awaiter(void 0, void 0, void 0, function* () {
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
            const d1 = new DeepClient(Object.assign({ deep }, a1));
            yield d1.delete(id1);
            const n1 = yield deep.select({ id: id1 });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 0);
            const { data: [{ id: id2 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            const d2 = new DeepClient(Object.assign({ deep }, a2));
            yield d2.delete(id2);
            const n2 = yield deep.select({ id: id2 });
            assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 0);
            const { data: [{ id: id3 }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
            });
            const d3 = new DeepClient(Object.assign({ deep }, a3));
            yield d3.delete(id3);
            const n3 = yield deep.select({ id: id3 });
            assert.lengthOf(n3 === null || n3 === void 0 ? void 0 : n3.data, 1);
        }));
        it(`delete permission with SelectorFilter`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
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
            expect(e1).to.be.undefined;
            expect(da1).to.not.be.undefined;
            const { data: da1d, error: e1d } = yield d1.delete((_a = da1 === null || da1 === void 0 ? void 0 : da1[0]) === null || _a === void 0 ? void 0 : _a.id);
            expect(e1d).to.not.be.undefined;
            expect(da1d).to.be.undefined;
            const d2 = new DeepClient(Object.assign(Object.assign({ deep }, a2), { silent: true }));
            const { data: da2, error: e2 } = yield d2.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                string: { data: { value: 'abc2' } },
            });
            expect(e2).to.be.undefined;
            expect(da2).to.not.be.undefined;
            const { data: da2d, error: e2d } = yield d2.delete((_b = da2 === null || da2 === void 0 ? void 0 : da2[0]) === null || _b === void 0 ? void 0 : _b.id);
            expect(e2d).to.be.undefined;
            expect(da2d).to.not.be.undefined;
            const d3 = new DeepClient(Object.assign(Object.assign({ deep }, a3), { silent: true }));
            const { data: da3, error: e3 } = yield d3.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Operation'),
                string: { data: { value: 'abc3' } },
            });
            expect(e3).to.be.undefined;
            expect(da3).to.not.be.undefined;
            const { data: da3d, error: e3d } = yield d3.delete((_c = da3 === null || da3 === void 0 ? void 0 : da3[0]) === null || _c === void 0 ? void 0 : _c.id);
            expect(e3d).to.not.be.undefined;
            expect(da3d).to.be.undefined;
        }));
    });
    describe('login', () => {
        it(`login permission can be granted`, () => __awaiter(void 0, void 0, void 0, function* () {
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
                                                to_id: a2.linkId,
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
                                            to_id: a1.linkId,
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
                                            to_id: yield deep.id('@deep-foundation/core', 'AllowLogin'),
                                            out: { data: {
                                                    type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                                                } },
                                        } }
                                } }
                        },
                    ] },
            });
            const d1 = new DeepClient(Object.assign({ deep }, a1));
            yield d1.can(a1.linkId, a1.linkId, yield deep.id('@deep-foundation/core', 'AllowLogin'));
            const d2 = new DeepClient(Object.assign({ deep }, a2));
            yield d2.can(a1.linkId, a2.linkId, yield deep.id('@deep-foundation/core', 'AllowLogin'));
            const d3 = new DeepClient(Object.assign({ deep }, a3));
            yield d3.can(a1.linkId, a3.linkId, yield deep.id('@deep-foundation/core', 'AllowLogin'));
        }));
    });
});
//# sourceMappingURL=permissions.js.map