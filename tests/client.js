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
import { DeepClient, useDeepSubscription } from "../imports/client";
import { assert } from 'chai';
import { inspect } from 'util';
import { createSerialOperation } from "../imports/gql";
import { render, screen, waitFor } from '@testing-library/react';
import { DeepProvider } from '../imports/client';
import React, { useEffect } from "react";
import { ApolloProvider } from '@apollo/client/index.js';
import '@testing-library/jest-dom';
import { useDeep } from '../imports/client';
const graphQlPath = `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`;
const ssl = !!+process.env.DEEPLINKS_HASURA_SSL;
const secret = process.env.DEEPLINKS_HASURA_SECRET;
const ws = true;
const apolloClient = generateApolloClient({
    path: graphQlPath,
    ssl,
    secret,
    ws
});
const deepClient = new DeepClient({ apolloClient });
describe('client', () => {
    it(`deep.linkId guest and login`, () => __awaiter(void 0, void 0, void 0, function* () {
        assert.equal(deepClient.linkId, undefined);
        assert.notEqual(deepClient.linkId, 0);
        const guest = yield deepClient.guest();
        const guestDeep = new DeepClient(Object.assign({ deep: deepClient }, guest));
        assert.notEqual(guestDeep.linkId, undefined);
        assert.notEqual(guestDeep.linkId, 0);
        const guestId = guestDeep.linkId;
        const adminId = yield deepClient.id('deep', 'admin');
        const admin = yield deepClient.login({ linkId: adminId });
        const deep = new DeepClient(Object.assign({ deep: deepClient }, admin));
        assert.notEqual(deep.linkId, undefined);
        assert.notEqual(deep.linkId, 0);
        assert.notEqual(deep.linkId, guestId);
    }));
    it(`{ id: 5 }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ id: 5 }), { id: { _eq: 5 } });
    });
    it(`{ id: { _eq: 5 } }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ id: { _eq: 5 } }), { id: { _eq: 5 } });
    });
    it(`{ value: 5 }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ value: 5 }), { number: { value: { _eq: 5 } } });
    });
    it(`{ value: 'a' }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ value: 'a' }), { string: { value: { _eq: 'a' } } });
    });
    it(`{ number: 5 }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ number: 5 }), { number: { value: { _eq: 5 } } });
    });
    it(`{ string: 'a' }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ string: 'a' }), { string: { value: { _eq: 'a' } } });
    });
    it(`{ number: { value: { _eq: 5 } } }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ number: { value: { _eq: 5 } } }), { number: { value: { _eq: 5 } } });
    });
    it(`{ string: { value: { _eq: 'a' } } }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ string: { value: { _eq: 'a' } } }), { string: { value: { _eq: 'a' } } });
    });
    it(`{ object: { value: { _contains: { a: 'b' } } } }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ object: { value: { _contains: { a: 'b' } } } }), { object: { value: { _contains: { a: 'b' } } } });
    });
    it(`{ from: { value: 5 } }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ from: { value: 5 } }), { from: { number: { value: { _eq: 5 } } } });
    });
    it(`{ out: { type_id: Contain, value: item, from: where } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        assert.deepEqual(deepClient.serializeWhere({
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
        assert.deepEqual(deepClient.serializeWhere({ value: 5, link: { type_id: 7 } }, 'value'), {
            value: { _eq: 5 },
            link: {
                type_id: { _eq: 7 }
            },
        });
    });
    it(`{ type: ['@deep-foundation/core', 'Value'] }`, () => {
        assert.deepEqual(deepClient.serializeWhere({
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
        assert.deepEqual(deepClient.serializeWhere({
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
        assert.equal(id, 4);
    }));
    it(`{ type_id: { _type_of: 25 } }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ type_id: { _type_of: 25 } }), { type: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
    });
    it(`{ from_id: { _type_of: 25 } }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ from_id: { _type_of: 25 } }), { from: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
    });
    it(`{ to_id: { _type_of: 25 } }`, () => {
        assert.deepEqual(deepClient.serializeWhere({ to_id: { _type_of: 25 } }), { to: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
    });
    it(`{ id: { _id: ['@deep-foundation/core', 'Package'] } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        assert.deepEqual((_c = (_b = (_a = (yield deepClient.select({ id: { _id: ['@deep-foundation/core', 'Package'] } }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id, 2);
    }));
    it(`{ type_id: { _id: ['@deep-foundation/core', 'Package'] } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _d, _e;
        const packageId = yield deepClient.id('@deep-foundation/core');
        assert.isTrue(!!((_e = (_d = (yield deepClient.select({ type_id: { _id: ['@deep-foundation/core', 'Package'] } }))) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.find(p => p.id === packageId)));
    }));
    it(`{ up: { parent_id: { _id: ['@deep-foundation/core', 'Package'] } } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _f, _g;
        const packageId = yield deepClient.id('@deep-foundation/core');
        assert.isTrue(!!((_g = (_f = (yield deepClient.select({ up: { parent_id: { _id: ['@deep-foundation/core', 'Package'] } } }))) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.find(p => p.id === packageId)));
    }));
    it(`idLocal get from minilinks`, () => __awaiter(void 0, void 0, void 0, function* () {
        const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
        const containTypeLinkId = yield deepClient.id("@deep-foundation/core", "Contain");
        const packageTypeLinkId = yield deepClient.id("@deep-foundation/core", "Package");
        const packageName = "idLocal get from minilinks package";
        const { data: [packageLink] } = yield deepClient.insert({
            type_id: packageTypeLinkId,
            string: {
                data: {
                    value: packageName
                }
            }
        }, { returning: deepClient.selectReturning });
        const { data: [newTypeTypeLink] } = yield deepClient.insert({
            type_id: typeTypeLinkId,
        }, { returning: deepClient.selectReturning });
        const { data: [containLink] } = yield deepClient.insert({
            type_id: containTypeLinkId,
            from_id: packageLink.id,
            to_id: newTypeTypeLink.id,
            string: {
                data: {
                    value: "Type"
                }
            }
        }, { returning: deepClient.selectReturning });
        deepClient.minilinks.apply([packageLink, containLink, newTypeTypeLink]);
        try {
            const newTypeTypeLinkId = deepClient.idLocal(packageName, "Type");
            assert.notEqual(newTypeTypeLinkId, 0);
            assert.equal(newTypeTypeLinkId, newTypeTypeLink.id);
        }
        finally {
            yield deepClient.delete([packageLink.id, newTypeTypeLink.id, containLink.id]);
        }
    }));
    it(`insert link with reserved id and string value`, () => __awaiter(void 0, void 0, void 0, function* () {
        const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
        const reservedIds = yield deepClient.reserve(1);
        try {
            yield deepClient.insert({
                id: reservedIds[0],
                type_id: typeTypeLinkId,
                string: {
                    data: {
                        value: 'stringValue'
                    }
                }
            });
        }
        finally {
            yield deepClient.delete(reservedIds[0]);
        }
    }));
    describe(`serial`, () => {
        describe('insert', () => {
            it('one insert', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
                const operation = createSerialOperation({
                    table: 'links',
                    type: 'insert',
                    objects: {
                        type_id: typeTypeLinkId
                    }
                });
                try {
                    const result = yield deepClient.serial({
                        operations: [
                            operation,
                        ]
                    });
                    assert.equal(result.error, undefined);
                    assert.notEqual(result.data, undefined);
                    linkIdsToDelete = [...linkIdsToDelete, ...result.data.map(link => link.id)];
                    assert.strictEqual(result.data.length, 1);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
            it('multiple inserts in one operation', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
                const operation = createSerialOperation({
                    table: 'links',
                    type: 'insert',
                    objects: {
                        type_id: typeTypeLinkId
                    }
                });
                try {
                    const result = yield deepClient.serial({
                        operations: [
                            operation,
                            operation
                        ]
                    });
                    assert.equal(result.error, undefined);
                    assert.notEqual(result.data, undefined);
                    linkIdsToDelete = [...linkIdsToDelete, ...result.data.map(link => link.id)];
                    assert.strictEqual(result.data.length, 2);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
            it('multiple inserts ine multiple operations', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
                const operation = createSerialOperation({
                    table: 'links',
                    type: 'insert',
                    objects: {
                        type_id: typeTypeLinkId
                    }
                });
                try {
                    const result = yield deepClient.serial({
                        operations: [
                            operation,
                            operation
                        ]
                    });
                    inspect(result);
                    assert.equal(result.error, undefined);
                    assert.notEqual(result.data, undefined);
                    linkIdsToDelete = [...linkIdsToDelete, ...result.data.map(link => link.id)];
                    assert.strictEqual(result.data.length, 2);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
        });
        describe('update', () => {
            it('one update', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const expectedValue = 'newStringValue';
                const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
                try {
                    const insertResult = yield deepClient.insert({
                        type_id: typeTypeLinkId,
                        string: {
                            data: {
                                value: "stringValue"
                            }
                        }
                    });
                    assert.equal(insertResult.error, undefined);
                    assert.notEqual(insertResult.data, undefined);
                    assert.strictEqual(insertResult.data.length, 1);
                    const newLinkId = insertResult.data[0].id;
                    linkIdsToDelete.push(newLinkId);
                    const operation = createSerialOperation({
                        table: 'strings',
                        type: 'update',
                        exp: {
                            link_id: newLinkId,
                        },
                        value: {
                            value: expectedValue
                        }
                    });
                    const updateResult = yield deepClient.serial({
                        operations: [
                            operation
                        ]
                    });
                    assert.equal(updateResult.error, undefined);
                    assert.notEqual(updateResult.data, undefined);
                    assert.strictEqual(updateResult.data.length, 1);
                    const { data: [newLink] } = yield deepClient.select({
                        id: newLinkId
                    });
                    assert.strictEqual(newLink.value.value, expectedValue);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
            it('multiple updates in one operation', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const expectedValue = 'newStringValue';
                const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
                try {
                    const insertResult = yield deepClient.insert({
                        type_id: typeTypeLinkId,
                        string: {
                            data: {
                                value: "stringValue"
                            }
                        }
                    });
                    assert.equal(insertResult.error, undefined);
                    assert.notEqual(insertResult.data, undefined);
                    assert.strictEqual(insertResult.data.length, 1);
                    const newLinkId = insertResult.data[0].id;
                    linkIdsToDelete.push(newLinkId);
                    const operation = createSerialOperation({
                        table: 'strings',
                        type: 'update',
                        exp: {
                            link_id: newLinkId,
                        },
                        value: {
                            value: expectedValue
                        }
                    });
                    const updateResult = yield deepClient.serial({
                        operations: [
                            operation,
                            operation
                        ]
                    });
                    assert.equal(updateResult.error, undefined);
                    assert.notEqual(updateResult.data, undefined);
                    assert.strictEqual(updateResult.data.length, 2);
                    const { data: [newLink] } = yield deepClient.select({
                        id: newLinkId
                    });
                    assert.strictEqual(newLink.value.value, expectedValue);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
            it('multiple updates in multiple operations', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const expectedValue = 'newStringValue';
                const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
                try {
                    const insertResult = yield deepClient.insert({
                        type_id: typeTypeLinkId,
                        string: {
                            data: {
                                value: "stringValue"
                            }
                        }
                    });
                    assert.equal(insertResult.error, undefined);
                    assert.notEqual(insertResult.data, undefined);
                    assert.strictEqual(insertResult.data.length, 1);
                    const newLinkId = insertResult.data[0].id;
                    linkIdsToDelete.push(newLinkId);
                    const operation = createSerialOperation({
                        table: 'strings',
                        type: 'update',
                        exp: {
                            link_id: newLinkId,
                        },
                        value: {
                            value: expectedValue
                        }
                    });
                    const updateResult = yield deepClient.serial({
                        operations: [
                            operation,
                            operation
                        ]
                    });
                    assert.equal(updateResult.error, undefined);
                    assert.notEqual(updateResult.data, undefined);
                    assert.strictEqual(updateResult.data.length, 2);
                    const { data: [newLink] } = yield deepClient.select({
                        id: newLinkId
                    });
                    assert.strictEqual(newLink.value.value, expectedValue);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
        });
        describe('delete', () => {
            it('one delete', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
                try {
                    const { data: [{ id: newLinkId }] } = yield deepClient.insert({
                        type_id: typeTypeLinkId,
                        string: {
                            data: {
                                value: "stringValue"
                            }
                        }
                    });
                    linkIdsToDelete.push(newLinkId);
                    const operation = createSerialOperation({
                        table: 'links',
                        type: 'delete',
                        exp: {
                            id: newLinkId
                        }
                    });
                    const result = yield deepClient.serial({
                        operations: [
                            operation,
                        ]
                    });
                    assert.equal(result.error, undefined);
                    assert.notEqual(result.data, undefined);
                    assert.strictEqual(result.data.length, 1);
                    const { data: [newLink] } = yield deepClient.select(newLinkId);
                    assert.equal(newLink, undefined);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
            it('multiple deletes in one operation', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                try {
                    const reservedLinkIds = yield deepClient.reserve(2);
                    linkIdsToDelete = [...linkIdsToDelete, ...reservedLinkIds];
                    const result = yield deepClient.serial({
                        operations: [
                            {
                                table: 'links',
                                type: 'delete',
                                exp: {
                                    id: reservedLinkIds[0]
                                }
                            },
                            {
                                table: 'links',
                                type: 'delete',
                                exp: {
                                    id: reservedLinkIds[1]
                                }
                            }
                        ]
                    });
                    assert.equal(result.error, undefined);
                    assert.notEqual(result.data, undefined);
                    assert.strictEqual(result.data.length, 2);
                    const { data } = yield deepClient.select(reservedLinkIds);
                    assert.equal(data.length, 0);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
            it('multiple deletes in multiple operations', () => __awaiter(void 0, void 0, void 0, function* () {
                let linkIdsToDelete = [];
                try {
                    const reservedLinkIds = yield deepClient.reserve(2);
                    linkIdsToDelete = [...linkIdsToDelete, ...reservedLinkIds];
                    const result = yield deepClient.serial({
                        operations: [
                            {
                                table: 'links',
                                type: 'delete',
                                exp: {
                                    id: reservedLinkIds[0]
                                }
                            },
                            {
                                table: 'links',
                                type: 'delete',
                                exp: {
                                    id: reservedLinkIds[1]
                                }
                            }
                        ]
                    });
                    assert.equal(result.error, undefined);
                    assert.notEqual(result.data, undefined);
                    assert.strictEqual(result.data.length, 2);
                    const { data } = yield deepClient.select(reservedLinkIds);
                    assert.equal(data.length, 0);
                }
                finally {
                    yield deepClient.delete(linkIdsToDelete);
                }
            }));
        });
    });
    it('select string table', () => __awaiter(void 0, void 0, void 0, function* () {
        const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
        const { data: [newLink] } = yield deepClient.insert({
            type_id: typeTypeLinkId,
            string: {
                data: {
                    value: "stringValue"
                }
            }
        });
        yield deepClient.select({
            link_id: { _eq: newLink.id }
        }, {
            table: 'strings'
        });
    }));
    it('deepClient token must not be undefined when secret is passed to apolloClient', () => __awaiter(void 0, void 0, void 0, function* () {
        const apolloClient = generateApolloClient({
            path: graphQlPath,
            ssl: true,
            ws: true,
            secret
        });
        const deep = new DeepClient({ apolloClient });
        assert.notEqual(deep.token, undefined);
    }));
    describe('react', () => {
        describe(`useDeepSubscription`, () => {
            it(`type`, () => __awaiter(void 0, void 0, void 0, function* () {
                yield setup();
                expect(screen.getByText('Loading...')).toBeInTheDocument();
                yield waitFor(() => {
                    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
                });
                expect(screen.queryByText(/^Error:/)).not.toBeInTheDocument();
                yield waitFor(() => {
                    const dataLengthText = screen.getByText(/items loaded$/);
                    expect(dataLengthText).toBeInTheDocument();
                    const dataLength = parseInt(dataLengthText.textContent);
                    expect(dataLength).toBeGreaterThan(0);
                }, { timeout: 10000 });
                function setup() {
                    return __awaiter(this, void 0, void 0, function* () {
                        const typeTypeLinkId = yield deepClient.id("@deep-foundation/core", "Type");
                        function TestHookComponent() {
                            const { loading, data, error } = useDeepSubscription({
                                type_id: typeTypeLinkId,
                            });
                            if (loading) {
                                return React.createElement("div", null, "Loading...");
                            }
                            if (error) {
                                return React.createElement("div", null,
                                    "Error: ",
                                    error.message);
                            }
                            return React.createElement("div", null,
                                data.length,
                                " items loaded");
                        }
                        render(React.createElement(ApolloProvider, { client: deepClient.apolloClient },
                            React.createElement(DeepProvider, null,
                                React.createElement(TestHookComponent, null))));
                    });
                }
            }));
            it('rerender with loading:true must occur only once', () => __awaiter(void 0, void 0, void 0, function* () {
                let renderCount = 0;
                let loadingCount = 0;
                function TestComponent() {
                    const deepSubscriptionResult = useDeepSubscription({
                        id: {
                            _id: ['@deep-foundation/core']
                        }
                    });
                    renderCount += 1;
                    if (deepSubscriptionResult.loading) {
                        loadingCount += 1;
                    }
                    return null;
                }
                render(React.createElement(ApolloProvider, { client: deepClient.apolloClient },
                    React.createElement(DeepProvider, null,
                        React.createElement(TestComponent, null))));
                yield waitFor(() => {
                    assert(renderCount > 1, 'TestComponent must be rerendered more than once');
                    assert(loadingCount === 1, 'loading:true must occur only once');
                });
            }));
            it('rerender with loading:false must occur only once', () => __awaiter(void 0, void 0, void 0, function* () {
                let renderCount = 0;
                let loadingCount = 0;
                function TestComponent() {
                    const deepSubscriptionResult = useDeepSubscription({
                        id: {
                            _id: ['@deep-foundation/core']
                        }
                    });
                    renderCount += 1;
                    if (!deepSubscriptionResult.loading) {
                        loadingCount += 1;
                    }
                    return null;
                }
                render(React.createElement(ApolloProvider, { client: deepClient.apolloClient },
                    React.createElement(DeepProvider, null,
                        React.createElement(TestComponent, null))));
                yield waitFor(() => {
                    assert(renderCount > 1, 'TestComponent must be rerendered more than once');
                    assert(loadingCount === 1, 'loading:false must occur only once');
                });
            }));
        });
        describe('login', () => {
            it('login with secret', () => __awaiter(void 0, void 0, void 0, function* () {
                const apolloClient = generateApolloClient({
                    path: graphQlPath,
                    ssl: true,
                    ws: true,
                });
                const deep = new DeepClient({ apolloClient });
                let deepInComponent;
                function TestComponent() {
                    deepInComponent = useDeep();
                    useEffect(() => {
                        deepInComponent.login({
                            token: secret
                        });
                    }, []);
                    return null;
                }
                render(React.createElement(ApolloProvider, { client: deepClient.apolloClient },
                    React.createElement(DeepProvider, null,
                        React.createElement(TestComponent, null))));
                yield waitFor(() => {
                    assert(deepInComponent.linkId !== 0, 'deep.linkId is 0. Failed to login');
                });
            }));
        });
    });
});
//# sourceMappingURL=client.js.map