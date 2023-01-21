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
const deepClient = new client_2.DeepClient({ apolloClient });
describe('client', () => {
    it(`{ id: 5 }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ id: 5 }), { id: { _eq: 5 } });
    });
    it(`{ id: { _eq: 5 } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ id: { _eq: 5 } }), { id: { _eq: 5 } });
    });
    it(`{ value: 5 }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ value: 5 }), { number: { value: { _eq: 5 } } });
    });
    it(`{ value: 'a' }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ value: 'a' }), { string: { value: { _eq: 'a' } } });
    });
    it(`{ number: 5 }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ number: 5 }), { number: { value: { _eq: 5 } } });
    });
    it(`{ string: 'a' }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ string: 'a' }), { string: { value: { _eq: 'a' } } });
    });
    it(`{ number: { value: { _eq: 5 } } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ number: { value: { _eq: 5 } } }), { number: { value: { _eq: 5 } } });
    });
    it(`{ string: { value: { _eq: 'a' } } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ string: { value: { _eq: 'a' } } }), { string: { value: { _eq: 'a' } } });
    });
    it(`{ object: { value: { _contains: { a: 'b' } } } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ object: { value: { _contains: { a: 'b' } } } }), { object: { value: { _contains: { a: 'b' } } } });
    });
    it(`{ from: { value: 5 } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ from: { value: 5 } }), { from: { number: { value: { _eq: 5 } } } });
    });
    it(`{ out: { type_id: Contain, value: item, from: where } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        chai_1.assert.deepEqual(deepClient.serializeWhere({
            out: {
                type_id: yield deepClient.id('@deep-foundation/core', 'Contain'),
                value: 'b',
                from: {
                    type_id: yield deepClient.id('@deep-foundation/core', 'Package'),
                    value: 'a',
                },
            },
        }), {
            out: {
                type_id: { _eq: yield deepClient.id('@deep-foundation/core', 'Contain') },
                string: { value: { _eq: 'b' } },
                from: {
                    type_id: { _eq: yield deepClient.id('@deep-foundation/core', 'Package') },
                    string: { value: { _eq: 'a' } },
                },
            }
        });
    }));
    it(`{ value: 5, link: { type_id: 7 } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ value: 5, link: { type_id: 7 } }, 'value'), {
            value: { _eq: 5 },
            link: {
                type_id: { _eq: 7 }
            },
        });
    });
    it(`{ type: ['@deep-foundation/core', 'Value'] }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({
            type: ["@deep-foundation/core", "Value"],
        }), {
            type: {
                in: {
                    from: {
                        string: { value: { _eq: "@deep-foundation/core" } },
                        type_id: { _eq: 2 },
                    },
                    string: { value: { _eq: "Value" } },
                    type_id: { _eq: 3 },
                },
            },
        });
    });
    it(`{ type: ['@deep-foundation/core', 'Value'] }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({
            _or: [{
                    type: ["@deep-foundation/core", "Value"],
                }, {
                    type: ["@deep-foundation/core", "User"],
                }]
        }), {
            _or: [{
                    type: {
                        in: {
                            from: {
                                string: { value: { _eq: "@deep-foundation/core" } },
                                type_id: { _eq: 2 },
                            },
                            string: { value: { _eq: "Value" } },
                            type_id: { _eq: 3 },
                        },
                    },
                }, {
                    type: {
                        in: {
                            from: {
                                string: { value: { _eq: "@deep-foundation/core" } },
                                type_id: { _eq: 2 },
                            },
                            string: { value: { _eq: "User" } },
                            type_id: { _eq: 3 },
                        },
                    },
                }]
        });
    });
    it(`id(packageName,contain)`, () => __awaiter(void 0, void 0, void 0, function* () {
        const id = yield deepClient.id('@deep-foundation/core', 'Value');
        chai_1.assert.equal(id, 4);
    }));
    it(`{ type_id: { _type_of: 25 } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ type_id: { _type_of: 25 } }), { type: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
    });
    it(`{ from_id: { _type_of: 25 } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ from_id: { _type_of: 25 } }), { from: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
    });
    it(`{ to_id: { _type_of: 25 } }`, () => {
        chai_1.assert.deepEqual(deepClient.serializeWhere({ to_id: { _type_of: 25 } }), { to: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
    });
    it(`{ id: { _id: ['@deep-foundation/core', 'Package'] } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        chai_1.assert.deepEqual((_c = (_b = (_a = (yield deepClient.select({ id: { _id: ['@deep-foundation/core', 'Package'] } }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id, 2);
    }));
    it(`{ type_id: { _id: ['@deep-foundation/core', 'Package'] } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _d, _e;
        const packageId = yield deepClient.id('@deep-foundation/core');
        chai_1.assert.isTrue(!!((_e = (_d = (yield deepClient.select({ type_id: { _id: ['@deep-foundation/core', 'Package'] } }))) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.find(p => p.id === packageId)));
    }));
    it(`{ up: { parent_id: { _id: ['@deep-foundation/core', 'Package'] } } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _f, _g;
        const packageId = yield deepClient.id('@deep-foundation/core');
        chai_1.assert.isTrue(!!((_g = (_f = (yield deepClient.select({ up: { parent_id: { _id: ['@deep-foundation/core', 'Package'] } } }))) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.find(p => p.id === packageId)));
    }));
});
//# sourceMappingURL=client.js.map