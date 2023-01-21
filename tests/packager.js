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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@deep-foundation/hasura/client");
const client_2 = require("../imports/client");
const chai_1 = require("chai");
const client_3 = require("@apollo/client");
const packager_1 = require("../imports/packager");
const minilinks_1 = require("../imports/minilinks");
const packager_2 = require("../imports/router/packager");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('deeplinks:tests:packager');
const log = debug.extend('log');
const error = debug.extend('error');
const namespaces = debug_1.default.disable();
debug_1.default.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);
const GIST_URL = process.env.GIST_URL;
const apolloClient = (0, client_1.generateApolloClient)({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const deep = new client_2.DeepClient({ apolloClient });
describe('packager', () => {
    describe('class', () => {
        it('export import', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const packager = new packager_1.Packager(deep);
            const namespace = yield deep.select({
                type_id: yield deep.id('@deep-foundation/core', 'PackageNamespace'),
                string: { value: { _eq: '@deep-foundation/test' } },
            });
            const { data: [{ id: packageId }] } = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Package'),
                string: { data: { value: '@deep-foundation/test' } },
                in: { data: Object.assign({ type_id: yield deep.id('@deep-foundation/core', 'PackageVersion'), string: { data: { value: '0.0.0' } } }, (((_a = namespace === null || namespace === void 0 ? void 0 : namespace.data) === null || _a === void 0 ? void 0 : _a[0])
                        ? {
                            from_id: (_c = (_b = namespace === null || namespace === void 0 ? void 0 : namespace.data) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id,
                        }
                        : {
                            from: { data: {
                                    type_id: yield deep.id('@deep-foundation/core', 'PackageNamespace'),
                                    string: { data: { value: '@deep-foundation/test' } },
                                } },
                        })) },
                out: { data: [
                        {
                            type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                            string: { data: { value: 'item' } },
                            to: { data: {
                                    type_id: yield deep.id('@deep-foundation/core', 'Type'),
                                    from_id: yield deep.id('@deep-foundation/core', 'Any'),
                                    to_id: yield deep.id('@deep-foundation/core', 'SyncTextFile'),
                                } },
                        },
                    ] },
            });
            (0, chai_1.assert)(!!packageId, '!packageId');
            const exported = yield packager.export({ packageLinkId: packageId });
            (0, chai_1.assert)(!((_d = exported.errors) === null || _d === void 0 ? void 0 : _d.length), '!!exported.errors.length');
            const imported = yield packager.import(exported);
            (0, chai_1.assert)(!((_e = imported.errors) === null || _e === void 0 ? void 0 : _e.length), '!!imported.errors.length');
            const results = yield deep.select({ id: { _in: imported === null || imported === void 0 ? void 0 : imported.ids } });
            const ml = (0, minilinks_1.minilinks)(results.data);
            (0, chai_1.assert)(+ml.links.length === +imported.ids.length, 'ml.links.length !== imported.ids.length');
        }));
    });
    if (GIST_URL) {
        describe('links', () => {
            it(`install and publish`, () => __awaiter(void 0, void 0, void 0, function* () {
                const { linkId, token } = yield deep.jwt({ linkId: yield deep.id('deep', 'admin') });
                const admin = new client_2.DeepClient({ deep, token, linkId });
                const { data: [{ id: packageQueryId1 }] } = yield admin.insert({
                    type_id: yield admin.id('@deep-foundation/core', 'PackageQuery'),
                    string: { data: { value: GIST_URL } },
                });
                const { data: [{ id: packageInstallId1 }] } = yield admin.insert({
                    type_id: yield admin.id('@deep-foundation/core', 'PackageInstall'),
                    from_id: admin.linkId,
                    to_id: packageQueryId1,
                });
                yield admin.await(packageInstallId1);
                const { data: [{ id: packageId }] } = yield admin.select({
                    type_id: yield admin.id('@deep-foundation/core', 'Package'),
                    in: {
                        type_id: yield admin.id('@deep-foundation/core', 'PromiseOut'),
                        from: {
                            in: {
                                type_id: yield admin.id('@deep-foundation/core', 'Then'),
                                from_id: packageInstallId1,
                            }
                        },
                    },
                });
                const { data: [{ id: packageQueryId2 }] } = yield admin.insert({
                    type_id: yield admin.id('@deep-foundation/core', 'PackageQuery'),
                    string: { data: { value: GIST_URL } },
                });
                const { data: [{ id: packagePublishId }] } = yield admin.insert({
                    type_id: yield admin.id('@deep-foundation/core', 'PackagePublish'),
                    from_id: packageId,
                    to_id: packageQueryId2,
                });
                yield admin.await(packagePublishId);
            }));
        });
        describe('core', () => {
            it(`install then publish old`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                const imported = yield (0, packager_2.packagerInstallCore)([], GIST_URL);
                if ((_a = imported.errors) === null || _a === void 0 ? void 0 : _a.length) {
                    log(JSON.stringify(imported, null, 2));
                    throw new Error('!!errors?.length');
                }
                const exported = yield (0, packager_2.packagerPublishCore)([], GIST_URL, imported.packageId);
                if ((_b = exported === null || exported === void 0 ? void 0 : exported.errors) === null || _b === void 0 ? void 0 : _b.length) {
                    log(JSON.stringify(exported, null, 2));
                    throw new Error('!!exported.data.errors');
                }
            }));
            it(`install then publish new`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _c, _d;
                const address = GIST_URL.split('/').slice(0, -1).join('/');
                const imported = yield (0, packager_2.packagerInstallCore)([], GIST_URL);
                if ((_c = imported === null || imported === void 0 ? void 0 : imported.errors) === null || _c === void 0 ? void 0 : _c.length) {
                    log(JSON.stringify(imported, null, 2));
                    throw new Error('!!imported.data.errors');
                }
                const exported = yield (0, packager_2.packagerPublishCore)([], address, imported.packageId);
                if ((_d = exported === null || exported === void 0 ? void 0 : exported.errors) === null || _d === void 0 ? void 0 : _d.length) {
                    log(JSON.stringify(exported, null, 2));
                    throw new Error('!!exported.data.errors');
                }
            }));
        });
        describe('gql', () => {
            it(`install then publish old`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                const { data: { packager_install: imported } } = yield deep.apolloClient.query({
                    query: (0, client_3.gql) `query PACKAGE_INSTALL($address: String!) {
            packager_install(input: { address: $address }) {
              ids
              packageId
              errors
            }
          }`,
                    variables: {
                        address: GIST_URL
                    },
                });
                if ((_a = imported.errors) === null || _a === void 0 ? void 0 : _a.length) {
                    log(JSON.stringify(imported, null, 2));
                    throw new Error('!!errors?.length');
                }
                const { data: { packager_publish: exported } } = yield deep.apolloClient.query({
                    query: (0, client_3.gql) `query PACKAGE_PUBLISH($address: String!, $id: Int) {
            packager_publish(input: { address: $address, id: $id }) {
              address
              errors
            }
          }`,
                    variables: {
                        address: GIST_URL,
                        id: imported === null || imported === void 0 ? void 0 : imported.packageId,
                    },
                });
                if ((_b = exported === null || exported === void 0 ? void 0 : exported.errors) === null || _b === void 0 ? void 0 : _b.length) {
                    log(JSON.stringify(exported, null, 2));
                    throw new Error('!!exported.data.errors');
                }
            }));
            it(`install then publish new`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _c, _d;
                const address = GIST_URL.split('/').slice(0, -1).join('/');
                const { data: { packager_install: imported } } = yield deep.apolloClient.query({
                    query: (0, client_3.gql) `query PACKAGE_INSTALL($address: String!) {
            packager_install(input: { address: $address }) {
              ids
              packageId
              errors
            }
          }`,
                    variables: {
                        address: GIST_URL
                    },
                });
                if ((_c = imported === null || imported === void 0 ? void 0 : imported.errors) === null || _c === void 0 ? void 0 : _c.length) {
                    log(JSON.stringify(imported, null, 2));
                    throw new Error('!!imported.data.errors');
                }
                const { data: { packager_publish: exported } } = yield deep.apolloClient.query({
                    query: (0, client_3.gql) `query PACKAGE_PUBLISH($address: String!, $id: Int) {
            packager_publish(input: { address: $address, id: $id }) {
              address
              errors
            }
          }`,
                    variables: {
                        address: address,
                        id: imported === null || imported === void 0 ? void 0 : imported.packageId,
                    },
                });
                if ((_d = exported === null || exported === void 0 ? void 0 : exported.errors) === null || _d === void 0 ? void 0 : _d.length) {
                    log(JSON.stringify(exported, null, 2));
                    throw new Error('!!exported.data.errors');
                }
            }));
        });
    }
});
//# sourceMappingURL=packager.js.map