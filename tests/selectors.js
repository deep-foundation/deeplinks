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
const deep = new DeepClient({ apolloClient });
let adminToken;
let admin;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const { linkId, token } = yield deep.jwt({ linkId: yield deep.id('deep', 'admin') });
    adminToken = token;
    admin = new DeepClient({ deep, token: adminToken, linkId });
}));
describe('selectors', () => {
    it(`selector include exclude`, () => __awaiter(void 0, void 0, void 0, function* () {
        const { data: [{ id: ty0 }] } = yield deep.insert({
            type_id: yield deep.id('@deep-foundation/core', 'Type'),
        });
        const { data: [{ id: ty1 }] } = yield deep.insert({
            type_id: yield deep.id('@deep-foundation/core', 'Type'),
            from_id: ty0,
            to_id: ty0,
        });
        const { data: [{ id: tr1 }] } = yield deep.insert({
            type_id: yield deep.id('@deep-foundation/core', 'Tree'),
            out: { data: [
                    {
                        type_id: yield deep.id('@deep-foundation/core', 'TreeIncludeDown'),
                        to_id: ty1,
                    },
                    {
                        type_id: yield deep.id('@deep-foundation/core', 'TreeIncludeNode'),
                        to_id: ty0,
                    },
                ] }
        });
        const { data: [{ id: ty2 }] } = yield deep.insert({
            type_id: yield deep.id('@deep-foundation/core', 'Type'),
            from_id: ty0,
            to_id: ty0,
        });
        const { data: [{ id: tr2 }] } = yield deep.insert({
            type_id: yield deep.id('@deep-foundation/core', 'Tree'),
            out: { data: [
                    {
                        type_id: yield deep.id('@deep-foundation/core', 'TreeIncludeDown'),
                        to_id: ty2,
                    },
                    {
                        type_id: yield deep.id('@deep-foundation/core', 'TreeIncludeNode'),
                        to_id: ty0,
                    },
                ] }
        });
        const { data: [{ id: id0 }] } = yield deep.insert({
            type_id: ty0,
        });
        const { data: [{ id: id1 }] } = yield deep.insert({
            type_id: ty0,
            in: { data: {
                    type_id: ty1,
                    from_id: id0,
                } }
        });
        const { data: [{ id: id2 }] } = yield deep.insert({
            type_id: ty0,
            in: { data: {
                    type_id: ty1,
                    from_id: id1,
                } }
        });
        const { data: [{ id: id3 }] } = yield deep.insert({
            type_id: ty0,
            in: { data: {
                    type_id: ty1,
                    from_id: id1,
                } }
        });
        const { data: [{ id: id4 }] } = yield deep.insert({
            type_id: ty0,
            in: { data: {
                    type_id: ty1,
                    from_id: id3,
                } }
        });
        const { data: [{ id: id5 }] } = yield deep.insert({
            type_id: ty0,
            in: { data: {
                    type_id: ty2,
                    from_id: id0,
                } }
        });
        const { data: [{ id: s1 }] } = yield deep.insert({
            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
            out: { data: [
                    {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                        to_id: id0,
                        out: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                to_id: tr1
                            } },
                    },
                    {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorExclude'),
                        to_id: id3,
                        out: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                to_id: tr1
                            } },
                    },
                ] }
        });
        const { data: [{ id: s2 }] } = yield deep.insert({
            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
            out: { data: [
                    {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                        to_id: id0,
                        out: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                to_id: tr2
                            } },
                    },
                    {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorExclude'),
                        to_id: id3,
                        out: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                                to_id: tr2
                            } },
                    },
                ] }
        });
        const n1 = yield deep.select({
            item_id: { _eq: id2 }, selector_id: { _eq: s1 },
        }, { table: 'selectors', returning: 'item_id selector_id' });
        assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1, `item_id ${id2} must be in selector_id ${s1}`);
        const n2 = yield deep.select({
            item_id: { _eq: id3 }, selector_id: { _eq: s1 },
        }, { table: 'selectors', returning: 'item_id selector_id' });
        assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 0, `item_id ${id3} must not be in selector_id ${s1}`);
        const n3 = yield deep.select({
            item_id: { _eq: id4 }, selector_id: { _eq: s1 },
        }, { table: 'selectors', returning: 'item_id selector_id' });
        assert.lengthOf(n3 === null || n3 === void 0 ? void 0 : n3.data, 0, `item_id ${id4} must not be in selector_id ${s1}`);
        const n4 = yield deep.select({
            item_id: { _eq: id5 }, selector_id: { _eq: s1 },
        }, { table: 'selectors', returning: 'item_id selector_id' });
        assert.lengthOf(n4 === null || n4 === void 0 ? void 0 : n4.data, 0, `item_id ${id5} must not be in selector_id ${s1}`);
        const n5 = yield deep.select({
            item_id: { _eq: id5 }, selector_id: { _eq: s2 },
        }, { table: 'selectors', returning: 'item_id selector_id' });
        assert.lengthOf(n5 === null || n5 === void 0 ? void 0 : n5.data, 1, `item_id ${id5} must be in selector_id ${s2}`);
    }));
    describe('criteria', () => {
        it(`selector include exclude boolExp`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            const { data: [{ id: ty0 }] } = yield admin.insert({
                type_id: yield admin.id('@deep-foundation/core', 'Type'),
            });
            const { data: [{ id: ty1 }] } = yield admin.insert({
                type_id: yield admin.id('@deep-foundation/core', 'Type'),
                from_id: ty0,
                to_id: ty0,
            });
            const { data: [{ id: tr1 }] } = yield admin.insert({
                type_id: yield admin.id('@deep-foundation/core', 'Tree'),
                out: { data: [
                        {
                            type_id: yield admin.id('@deep-foundation/core', 'TreeIncludeDown'),
                            to_id: ty1,
                        },
                        {
                            type_id: yield admin.id('@deep-foundation/core', 'TreeIncludeNode'),
                            to_id: ty0,
                        },
                    ] }
            });
            const { data: [{ id: id0 }] } = yield admin.insert({
                type_id: ty0,
                string: { data: { value: 'id0' } },
            });
            const { data: [{ id: id1 }] } = yield admin.insert({
                type_id: ty0,
                string: { data: { value: 'id1' } },
                in: { data: {
                        type_id: ty1,
                        from_id: id0,
                    } }
            });
            const { data: [{ id: id2 }] } = yield admin.insert({
                type_id: ty0,
                string: { data: { value: 'id2' } },
                in: { data: {
                        type_id: ty1,
                        from_id: id1,
                    } }
            });
            const { data: [{ id: id3 }] } = yield admin.insert({
                type_id: ty0,
                string: { data: { value: 'id3' } },
                in: { data: {
                        type_id: ty1,
                        from_id: id2,
                    } }
            });
            const { data: [{ id: id4 }] } = yield admin.insert({
                type_id: ty0,
                string: { data: { value: 'id4' } },
                in: { data: {
                        type_id: ty1,
                        from_id: id3,
                    } }
            });
            const { data: [{ id: id5 }] } = yield admin.insert({
                type_id: ty0,
                string: { data: { value: 'id5' } },
                in: { data: {
                        type_id: ty1,
                        from_id: id4,
                    } }
            });
            const { data: [{ id: s1 }] } = yield admin.insert({
                type_id: yield admin.id('@deep-foundation/core', 'Selector'),
                out: { data: [
                        {
                            type_id: yield admin.id('@deep-foundation/core', 'SelectorInclude'),
                            to_id: id0,
                            out: { data: {
                                    type_id: yield admin.id('@deep-foundation/core', 'SelectorTree'),
                                    to_id: tr1
                                } },
                        },
                        {
                            type_id: yield admin.id('@deep-foundation/core', 'SelectorFilter'),
                            to: { data: {
                                    type_id: yield admin.id('@deep-foundation/core', 'Query'),
                                    object: { data: { value: { string: { value: { _in: ['id3', 'id5'] } } } } }
                                } },
                        },
                    ] }
            });
            yield delay(3000);
            const n1 = yield admin.select({
                item_id: { _eq: id2 }, selector_id: { _eq: s1 },
            }, { table: 'selectors', returning: `item_id selector_id query { id exec_bool_exp(args: { link_id: ${id2} }) { id } }` });
            assert.lengthOf(n1 === null || n1 === void 0 ? void 0 : n1.data, 1);
            expect((_d = (_c = (_b = (_a = n1 === null || n1 === void 0 ? void 0 : n1.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.query) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.exec_bool_exp).to.be.empty;
            const n2 = yield admin.select({
                item_id: { _eq: id3 }, selector_id: { _eq: s1 },
            }, { table: 'selectors', returning: `item_id selector_id query { id exec_bool_exp(args: { link_id: ${id3} }) { id } }` });
            assert.lengthOf(n2 === null || n2 === void 0 ? void 0 : n2.data, 1);
            expect((_h = (_g = (_f = (_e = n2 === null || n2 === void 0 ? void 0 : n2.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.query) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.exec_bool_exp).to.not.be.empty;
            const n3 = yield admin.select({
                item_id: { _eq: id4 }, selector_id: { _eq: s1 },
            }, { table: 'selectors', returning: `item_id selector_id query { id exec_bool_exp(args: { link_id: ${id4} }) { id } }` });
            assert.lengthOf(n3 === null || n3 === void 0 ? void 0 : n3.data, 1);
            expect((_m = (_l = (_k = (_j = n3 === null || n3 === void 0 ? void 0 : n3.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.query) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.exec_bool_exp).to.be.empty;
            const n4 = yield admin.select({
                item_id: { _eq: id5 }, selector_id: { _eq: s1 },
            }, { table: 'selectors', returning: `item_id selector_id query { id exec_bool_exp(args: { link_id: ${id5} }) { id } }` });
            assert.lengthOf(n4 === null || n4 === void 0 ? void 0 : n4.data, 1);
            expect((_r = (_q = (_p = (_o = n4 === null || n4 === void 0 ? void 0 : n4.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.query) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.exec_bool_exp).to.not.be.empty;
        }));
    });
});
//# sourceMappingURL=selectors.js.map