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
exports.getPromiseResults = exports.deleteScheduleHandler = exports.deletePromiseResult = exports.api = void 0;
const client_1 = require("@deep-foundation/hasura/client");
const api_1 = require("@deep-foundation/hasura/api");
const client_2 = require("../imports/client");
const chai_1 = require("chai");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const debug_1 = __importDefault(require("debug"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const handlers_1 = require("../imports/handlers");
const lodash_1 = __importDefault(require("lodash"));
const debug = (0, debug_1.default)('deeplinks:tests:handlers');
const log = debug.extend('log');
const error = debug.extend('error');
const namespaces = debug_1.default.disable();
debug_1.default.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);
const wait_on_1 = __importDefault(require("wait-on"));
const get_port_1 = __importDefault(require("get-port"));
jest.setTimeout(120000);
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
const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));
let packageWithPermissions;
let lastHandlerResult = 1;
const nextHandlerResult = () => {
    lastHandlerResult += 1;
    return lastHandlerResult;
};
const collectIds = (data) => {
    const ids = [];
    if (Array.isArray(data)) {
        data.forEach(item => {
            collectIds(item).forEach(id => ids.push(id));
        });
    }
    if (data.id) {
        ids.push(data.id);
    }
    if (data.to) {
        collectIds(data.to).forEach(id => ids.push(id));
    }
    if (data.from) {
        collectIds(data.from).forEach(id => ids.push(id));
    }
    if (data.in) {
        data.in.forEach(item => {
            collectIds(item).forEach(id => ids.push(id));
        });
    }
    if (data.out) {
        data.out.forEach(item => {
            collectIds(item).forEach(id => ids.push(id));
        });
    }
    return ids;
};
const insertPackageWithPermissions = (forcePackageId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const Rule = yield deep.id('@deep-foundation/core', 'Rule');
    const RuleSubject = yield deep.id('@deep-foundation/core', 'RuleSubject');
    const Selector = yield deep.id('@deep-foundation/core', 'Selector');
    const RuleObject = yield deep.id('@deep-foundation/core', 'RuleObject');
    const RuleAction = yield deep.id('@deep-foundation/core', 'RuleAction');
    const SelectorInclude = yield deep.id('@deep-foundation/core', 'SelectorInclude');
    const SelectorTree = yield deep.id('@deep-foundation/core', 'SelectorTree');
    const AllowSelect = yield deep.id('@deep-foundation/core', 'AllowSelect');
    const AllowInsertType = yield deep.id('@deep-foundation/core', 'AllowInsertType');
    const containTree = yield deep.id('@deep-foundation/core', 'containTree');
    const joinTree = yield deep.id('@deep-foundation/core', 'joinTree');
    let packageId;
    let packageValueId;
    let containId;
    let containValueId;
    let typeId;
    if (forcePackageId) {
        packageId = forcePackageId;
    }
    else {
        const packageTypeId = yield deep.id('@deep-foundation/core', 'Package');
        const containTypeId = yield deep.id('@deep-foundation/core', 'Contain');
        const typeTypeId = yield deep.id('@deep-foundation/core', 'Type');
        const $package = (yield deep.insert({
            type_id: packageTypeId,
            string: { data: { value: '@deep-foundation/test-package' } },
            out: {
                data: {
                    type_id: containTypeId,
                    string: { data: { value: 'test-type' } },
                    to: {
                        data: {
                            type_id: typeTypeId
                        }
                    },
                }
            }
        }, { name: 'INSERT_PACKAGE', returning: `
      id
      string {
        id
      }
      out {
        id
        string {
          id
        }
        to {
          id
        }
      }
    ` })).data[0];
        packageId = $package.id;
        packageValueId = $package.string.id;
        containId = (_b = (_a = $package === null || $package === void 0 ? void 0 : $package.out) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
        containValueId = (_f = (_e = (_d = (_c = $package === null || $package === void 0 ? void 0 : $package.out) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.string) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id;
        typeId = (_j = (_h = (_g = $package === null || $package === void 0 ? void 0 : $package.out) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.to) === null || _j === void 0 ? void 0 : _j.id;
    }
    const rule = yield deep.insert({
        type_id: Rule,
        out: { data: [
                {
                    type_id: RuleSubject,
                    to: { data: {
                            type_id: Selector,
                            out: { data: [
                                    {
                                        type_id: SelectorInclude,
                                        to_id: packageId,
                                        out: { data: {
                                                type_id: SelectorTree,
                                                to_id: joinTree,
                                            }, },
                                    },
                                ] },
                        }, },
                },
                {
                    type_id: RuleObject,
                    to: { data: {
                            type_id: Selector,
                            out: { data: [
                                    {
                                        type_id: SelectorInclude,
                                        to_id: packageId,
                                        out: { data: {
                                                type_id: SelectorTree,
                                                to_id: containTree,
                                            }, },
                                    },
                                ], },
                        }, },
                },
                {
                    type_id: RuleAction,
                    to: { data: {
                            type_id: Selector,
                            out: { data: [
                                    {
                                        type_id: SelectorInclude,
                                        to_id: AllowInsertType,
                                        out: { data: {
                                                type_id: SelectorTree,
                                                to_id: containTree,
                                            }, },
                                    },
                                    {
                                        type_id: SelectorInclude,
                                        to_id: AllowSelect,
                                        out: { data: {
                                                type_id: SelectorTree,
                                                to_id: containTree,
                                            }, },
                                    }
                                ], },
                        }, },
                },
            ], },
    }, { returning: `
    id
    out {
      id
      to {
        id
        out {
          id
          out {
            id
          }
        }
      }
    }
  ` });
    const ids = collectIds(rule.data);
    return { packageId, packageValueId, containId, containValueId, typeId, ruleIds: ids };
});
const deletePackageWithPermissions = (deepPackage) => __awaiter(void 0, void 0, void 0, function* () {
    yield deep.delete(lodash_1.default.compact(lodash_1.default.concat([deepPackage.typeId, deepPackage.containId, deepPackage.packageId], deepPackage.ruleIds)));
    yield deep.delete(lodash_1.default.compact([deepPackage.containValueId, deepPackage.packageValueId]), { table: 'strings' });
});
const insertOperationHandlerForSchedule = (schedule, code, forceOwnerId) => __awaiter(void 0, void 0, void 0, function* () {
    const syncTextFileTypeId = yield deep.id('@deep-foundation/core', 'SyncTextFile');
    const handlerJSFile = (yield deep.insert({
        type_id: syncTextFileTypeId,
    }, { name: 'INSERT_HANDLER_JS_FILE' })).data[0];
    const handlerJSFileValue = (yield deep.insert({ link_id: handlerJSFile === null || handlerJSFile === void 0 ? void 0 : handlerJSFile.id, value: code }, { table: 'strings' })).data[0];
    const handlerTypeId = yield deep.id('@deep-foundation/core', 'Handler');
    const isolationProviderThatSupportsJSExecutionProviderId = yield deep.id('@deep-foundation/core', 'dockerSupportsJs');
    const handler = (yield deep.insert({
        from_id: isolationProviderThatSupportsJSExecutionProviderId,
        type_id: handlerTypeId,
        to_id: handlerJSFile === null || handlerJSFile === void 0 ? void 0 : handlerJSFile.id,
    }, { name: 'INSERT_HANDLER' })).data[0];
    const ownerId = forceOwnerId || (yield deep.id('deep', 'admin'));
    const ownerContainHandler = (yield deep.insert({
        from_id: ownerId,
        type_id: yield deep.id('@deep-foundation/core', 'Contain'),
        to_id: handler === null || handler === void 0 ? void 0 : handler.id,
    }, { name: 'INSERT_ADMIN_CONTAIN_HANDLER' })).data[0];
    const scheduleTypeId = yield deep.id('@deep-foundation/core', 'Schedule');
    const scheduleNode = (yield deep.insert({
        type_id: scheduleTypeId,
    }, { name: 'INSERT_SCHEDULE' })).data[0];
    const scheduleValue = (yield deep.insert({ link_id: scheduleNode === null || scheduleNode === void 0 ? void 0 : scheduleNode.id, value: schedule }, { table: 'strings' })).data[0];
    const handleScheduleTypeId = yield deep.id('@deep-foundation/core', 'HandleSchedule');
    const handleOperation = (yield deep.insert({
        from_id: scheduleNode === null || scheduleNode === void 0 ? void 0 : scheduleNode.id,
        type_id: handleScheduleTypeId,
        to_id: handler === null || handler === void 0 ? void 0 : handler.id,
    }, { name: 'INSERT_INSERT_HANDLER' })).data[0];
    return {
        handlerId: handler === null || handler === void 0 ? void 0 : handler.id,
        handleOperationId: handleOperation === null || handleOperation === void 0 ? void 0 : handleOperation.id,
        handlerJSFileId: handlerJSFile === null || handlerJSFile === void 0 ? void 0 : handlerJSFile.id,
        handlerJSFileValueId: handlerJSFileValue === null || handlerJSFileValue === void 0 ? void 0 : handlerJSFileValue.id,
        scheduleId: scheduleNode === null || scheduleNode === void 0 ? void 0 : scheduleNode.id,
        scheduleValueId: scheduleValue === null || scheduleValue === void 0 ? void 0 : scheduleValue.id,
        ownerContainHandlerId: ownerContainHandler === null || ownerContainHandler === void 0 ? void 0 : ownerContainHandler.id,
    };
});
function deletePromiseResult(promiseResult, linkId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    return __awaiter(this, void 0, void 0, function* () {
        const resultLinkId = (_b = (_a = promiseResult === null || promiseResult === void 0 ? void 0 : promiseResult.in) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
        const thenLinkId = (_g = (_f = (_e = (_d = (_c = promiseResult === null || promiseResult === void 0 ? void 0 : promiseResult.in) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.from) === null || _e === void 0 ? void 0 : _e.in) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.id;
        const valueId = (_h = promiseResult === null || promiseResult === void 0 ? void 0 : promiseResult.object) === null || _h === void 0 ? void 0 : _h.id;
        const promiseResultId = promiseResult === null || promiseResult === void 0 ? void 0 : promiseResult.id;
        const promiseId = (_l = (_k = (_j = promiseResult === null || promiseResult === void 0 ? void 0 : promiseResult.in) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.from) === null || _l === void 0 ? void 0 : _l.id;
        const promiseReasonId = (_q = (_p = (_o = (_m = promiseResult === null || promiseResult === void 0 ? void 0 : promiseResult.in) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.out) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.id;
        if (promiseReasonId)
            yield deep.delete(promiseReasonId);
        if (valueId)
            yield deep.delete(valueId, { table: 'objects' });
        yield deep.delete(lodash_1.default.compact([resultLinkId, thenLinkId, promiseResultId, promiseId, linkId]));
    });
}
exports.deletePromiseResult = deletePromiseResult;
const deleteScheduleHandler = (handler) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, handlers_1.deleteHandler)(handler);
    if (handler.scheduleValueId)
        yield deep.delete(handler.scheduleValueId, { table: 'strings' });
    if (handler.scheduleId)
        yield deep.delete(handler.scheduleId);
});
exports.deleteScheduleHandler = deleteScheduleHandler;
function getPromiseResults(deep, resultTypeId, linkId) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const promiseTypeId = yield deep.id('@deep-foundation/core', 'Promise');
        const thenTypeId = yield deep.id('@deep-foundation/core', 'Then');
        const promiseReasonTypeId = yield deep.id('@deep-foundation/core', 'PromiseReason');
        const client = deep.apolloClient;
        const queryString = `{
    links(where: { 
      in: {
        type_id: { _eq: ${resultTypeId} }, # Resolved/Rejected
        from: { 
          type_id: { _eq: ${promiseTypeId} }, # Promise
          in: { 
            type_id: { _eq: ${thenTypeId} } # Then
            from_id: { _eq: ${linkId} } # linkId
          }
        }
      },
    }) {
      id
      object {
        id
        value
      }
      in(where: { type_id: { _eq: ${resultTypeId} } }) {
        id
        from {
          id
          in(where: { type_id: { _eq: ${thenTypeId} } }) {
            id
          }
        }
        out(where: { type_id: { _eq: ${promiseReasonTypeId} } }) {
          id
        }
      }
    }
  }`;
        return (_b = (_a = (yield client.query({
            query: (0, graphql_tag_1.default) `${queryString}`,
        }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.links;
    });
}
exports.getPromiseResults = getPromiseResults;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    packageWithPermissions = yield insertPackageWithPermissions();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    deletePackageWithPermissions(packageWithPermissions);
}));
describe('Async handlers', () => {
    describe('sync function handle by type with resolve', () => {
        it(`handle insert`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const numberToReturn = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const handler = yield (0, handlers_1.insertHandler)(handleInsertTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            const linkId = (_b = (_a = (yield deep.insert({ type_id: typeId }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0].id;
            yield deep.await(linkId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults = yield getPromiseResults(deep, resolvedTypeId, linkId);
            const promiseResult = promiseResults.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult);
        }));
        it(`handle update when value is inserted`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _c, _d;
            const numberToReturn = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleUpdateTypeId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
            const handler = yield (0, handlers_1.insertHandler)(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
            yield deep.insert({ link_id: linkId, value: numberToReturn }, { table: 'numbers' });
            yield deep.await(linkId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            let promiseResults = yield getPromiseResults(deep, resolvedTypeId, linkId);
            const promiseResult = promiseResults.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult);
        }));
        it(`handle update when value is updated`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _e, _f;
            const numberToReturn = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleUpdateTypeId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
            const handler = yield (0, handlers_1.insertHandler)(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            const linkId = (_f = (_e = (yield deep.insert({ type_id: typeId }))) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f[0].id;
            yield deep.insert({ link_id: linkId, value: numberToReturn }, { table: 'numbers' });
            yield deep.await(linkId);
            yield deep.update({ link_id: linkId }, { value: numberToReturn + 1 }, { table: 'numbers' });
            yield deep.await(linkId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults = yield getPromiseResults(deep, resolvedTypeId, linkId);
            const matchedPromiseResults = promiseResults.filter(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            for (const promiseResult of matchedPromiseResults) {
                yield deletePromiseResult(promiseResult);
            }
            yield deep.delete(linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!matchedPromiseResults);
            chai_1.assert.equal(matchedPromiseResults.length, 2);
        }));
        it(`handle update when value is deleted`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _g, _h;
            const numberToReturn = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleUpdateTypeId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
            const handler = yield (0, handlers_1.insertHandler)(handleUpdateTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            const linkId = (_h = (_g = (yield deep.insert({ type_id: typeId }))) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h[0].id;
            yield deep.insert({ link_id: linkId, value: numberToReturn }, { table: 'numbers' });
            yield deep.await(linkId);
            yield deep.delete({ link_id: { _eq: linkId } }, { table: 'numbers' });
            yield deep.await(linkId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults = yield getPromiseResults(deep, resolvedTypeId, linkId);
            const matchedPromiseResults = promiseResults.filter(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            for (const promiseResult of matchedPromiseResults) {
                yield deletePromiseResult(promiseResult);
            }
            yield deep.delete(linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!matchedPromiseResults);
            chai_1.assert.equal(matchedPromiseResults.length, 2);
        }));
        it(`handle delete`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _j, _k;
            const numberToReturn = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleDeleteTypeId = yield deep.id('@deep-foundation/core', 'HandleDelete');
            const handler = yield (0, handlers_1.insertHandler)(handleDeleteTypeId, typeId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            const linkId = (_k = (_j = (yield deep.insert({ type_id: typeId }))) === null || _j === void 0 ? void 0 : _j.data) === null || _k === void 0 ? void 0 : _k[0].id;
            yield deep.delete(linkId);
            yield deep.await(linkId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults = yield getPromiseResults(deep, resolvedTypeId, linkId);
            const promiseResult = promiseResults.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult);
        }));
    });
    describe('sync function handle by type with reject', () => {
        it(`handle insert`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const errorMessage = 'return is not possible';
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const handler = yield (0, handlers_1.insertHandler)(handleInsertTypeId, typeId, `({deep, data}) => { 
        deep.insert({id: 4444, type_id: 2});
        throw new Error('${errorMessage}');
      }`);
            log('handler', handler);
            const linkId = (_b = (_a = (yield deep.insert({ type_id: typeId }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0].id;
            yield deep.await(linkId);
            const rejectedTypeId = yield deep.id('@deep-foundation/core', 'Rejected');
            const promiseResults = yield getPromiseResults(deep, rejectedTypeId, linkId);
            log('promiseResults', JSON.stringify(promiseResults));
            const promiseResult = promiseResults.find(link => { var _a; return ((_a = link.object) === null || _a === void 0 ? void 0 : _a.value.message) === errorMessage; });
            log('promiseResult', promiseResult);
            yield deep.delete(linkId);
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult);
        }));
        it(`handle delete`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _c, _d;
            const numberToThrow = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleDeleteTypeId = yield deep.id('@deep-foundation/core', 'HandleDelete');
            const handler = yield (0, handlers_1.insertHandler)(handleDeleteTypeId, typeId, `(arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);
            const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
            yield deep.delete(linkId);
            yield deep.await(linkId);
            const rejectedTypeId = yield deep.id('@deep-foundation/core', 'Rejected');
            const promiseResults = yield getPromiseResults(deep, rejectedTypeId, linkId);
            const promiseResult = promiseResults.find(link => { var _a; return ((_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === numberToThrow; });
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult);
        }));
    });
    describe('async function handle by type with reject', () => {
        it(`handle insert`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const numberToThrow = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const handler = yield (0, handlers_1.insertHandler)(handleInsertTypeId, typeId, `async (arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);
            const linkId = (_b = (_a = (yield deep.insert({ type_id: typeId }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0].id;
            yield deep.await(linkId);
            const rejectedTypeId = yield deep.id('@deep-foundation/core', 'Rejected');
            const promiseResults = yield getPromiseResults(deep, rejectedTypeId, linkId);
            const promiseResult = promiseResults.find(link => { var _a; return ((_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === numberToThrow; });
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult);
        }));
        it(`handle delete`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _c, _d;
            const numberToThrow = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleDeleteTypeId = yield deep.id('@deep-foundation/core', 'HandleDelete');
            const handler = yield (0, handlers_1.insertHandler)(handleDeleteTypeId, typeId, `async (arg) => { throw ${numberToThrow}; return { "error": "return is not possible" }; }`);
            const linkId = (_d = (_c = (yield deep.insert({ type_id: typeId }))) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0].id;
            yield deep.delete(linkId);
            yield deep.await(linkId);
            const rejectedTypeId = yield deep.id('@deep-foundation/core', 'Rejected');
            const promiseResults = yield getPromiseResults(deep, rejectedTypeId, linkId);
            const promiseResult = promiseResults.find(link => { var _a; return ((_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === numberToThrow; });
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult);
        }));
    });
    describe('sync function handle by schedule with resolve', () => {
        it(`handle schedule`, () => __awaiter(void 0, void 0, void 0, function* () {
            const numberToReturn = nextHandlerResult();
            const handler = yield insertOperationHandlerForSchedule('* * * * *', `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            yield deep.await(handler.scheduleId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults = yield getPromiseResults(deep, resolvedTypeId, handler.scheduleId);
            const promiseResult = promiseResults.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            yield deletePromiseResult(promiseResult, handler.scheduleId);
            yield (0, exports.deleteScheduleHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult);
        }));
    });
    describe('async function handle by type with resolve using deep client', () => {
        it(`handle insert`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const numberToReturn = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const queryTypeId = yield deep.id('@deep-foundation/core', 'Query');
            const handler = yield (0, handlers_1.insertHandler)(handleInsertTypeId, typeId, `async (arg) => {
        const deep = arg.deep;
        const queryTypeId = await deep.id('@deep-foundation/core', 'Query');
        const queryId = (await deep.insert({ type_id: queryTypeId }))?.data?.[0]?.id;
        //  const queryId = (await deep.insert({ type_id: ${queryTypeId} }))?.data?.[0]?.id;
        return { queryId, result: ${numberToReturn}}
      }`);
            const linkId = (_b = (_a = (yield deep.insert({ type_id: typeId }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0].id;
            yield deep.await(linkId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults = yield getPromiseResults(deep, resolvedTypeId, linkId);
            const promiseResult = promiseResults.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            const queryId = (_d = (_c = promiseResult === null || promiseResult === void 0 ? void 0 : promiseResult.object) === null || _c === void 0 ? void 0 : _c.value) === null || _d === void 0 ? void 0 : _d.queryId;
            const query = (yield deep.select({ id: { _eq: queryId } })).data[0];
            yield deep.delete(queryId);
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.equal(query.id, queryId);
            chai_1.assert.isTrue(!!promiseResult);
        }));
        it(`handle insert with package jwt`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _e, _f, _g, _h;
            const numberToReturn = nextHandlerResult();
            const typeId = yield deep.id('@deep-foundation/core', 'Type');
            const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const handler = yield (0, handlers_1.insertHandler)(handleInsertTypeId, typeId, `async (arg) => {
        const deep = arg.deep;
        const nodeTypeId = await deep.id('@deep-foundation/test-package', 'test-type');
        const nodeId = (await deep.insert({ type_id: nodeTypeId }))?.data?.[0]?.id;
        return { nodeId, result: ${numberToReturn}}
      }`, packageWithPermissions.packageId);
            const linkId = (_f = (_e = (yield deep.insert({ type_id: typeId }))) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f[0].id;
            yield deep.await(linkId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults = yield getPromiseResults(deep, resolvedTypeId, linkId);
            const promiseResult = promiseResults.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            const nodeId = (_h = (_g = promiseResult === null || promiseResult === void 0 ? void 0 : promiseResult.object) === null || _g === void 0 ? void 0 : _g.value) === null || _h === void 0 ? void 0 : _h.nodeId;
            const node = (yield deep.select({ id: { _eq: nodeId } })).data[0];
            yield deep.delete(nodeId);
            yield deletePromiseResult(promiseResult, linkId);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.equal(node.id, nodeId);
            chai_1.assert.isTrue(!!promiseResult);
        }));
    });
    describe('handle port', () => {
        it(`handle port`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const port = yield (0, get_port_1.default)();
            const portTypeId = yield deep.id('@deep-foundation/core', 'Port');
            const portId = (_c = (_b = (_a = (yield deep.insert({
                type_id: portTypeId,
                number: { data: { value: port } }
            }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id;
            const jsDockerIsolationProviderId = yield deep.id('@deep-foundation/core', 'JSDockerIsolationProvider');
            const handlePortTypeId = yield deep.id('@deep-foundation/core', 'HandlePort');
            const hanlePortLinkId = (_f = (_e = (_d = (yield deep.insert({ from_id: portId, type_id: handlePortTypeId, to_id: jsDockerIsolationProviderId }))) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id;
            yield deep.await(hanlePortLinkId);
            log("waiting for container to be created");
            yield (0, wait_on_1.default)({ resources: [`http://localhost:${port}/healthz`] });
            log("container is up");
            yield deep.delete(hanlePortLinkId);
            log("waiting for container to be removed");
            yield (0, wait_on_1.default)({
                resources: [
                    `http://localhost:${port}/healthz`
                ],
                reverse: true,
            });
            log("container is down");
        }));
    });
    describe('handle route', () => {
        it(`handle route`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
            const port = 40005;
            const portTypeId = yield deep.id('@deep-foundation/core', 'Port');
            const portId = (_c = (_b = (_a = (yield deep.insert({
                type_id: portTypeId,
            }))) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id;
            const portValue = (_e = (_d = (yield deep.insert({
                link_id: portId,
                value: port
            }, { table: 'numbers' }))) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0];
            const routeTypeId = yield deep.id('@deep-foundation/core', 'Route');
            const routeId = (_h = (_g = (_f = (yield deep.insert({
                type_id: routeTypeId,
            }))) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.id;
            const routerTypeId = yield deep.id('@deep-foundation/core', 'Router');
            const routerId = (_l = (_k = (_j = (yield deep.insert({
                type_id: routerTypeId,
            }))) === null || _j === void 0 ? void 0 : _j.data) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.id;
            const routerListeningTypeId = yield deep.id('@deep-foundation/core', 'RouterListening');
            const routerListeningId = (_p = (_o = (_m = (yield deep.insert({
                type_id: routerListeningTypeId,
                from_id: routerId,
                to_id: portId,
            }))) === null || _m === void 0 ? void 0 : _m.data) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.id;
            const route = '/passport';
            const routerStringUseTypeId = yield deep.id('@deep-foundation/core', 'RouterStringUse');
            const routerStringUseId = (_s = (_r = (_q = (yield deep.insert({
                type_id: routerStringUseTypeId,
                to_id: routerId,
                from_id: routeId,
                string: { data: { value: route } }
            }))) === null || _q === void 0 ? void 0 : _q.data) === null || _r === void 0 ? void 0 : _r[0]) === null || _s === void 0 ? void 0 : _s.id;
            const syncTextFileTypeId = yield deep.id('@deep-foundation/core', 'SyncTextFile');
            const handlerJSFile = (yield deep.insert({
                type_id: syncTextFileTypeId,
            }, { name: 'INSERT_HANDLER_JS_FILE' })).data[0];
            const handlerJSFileValue = (yield deep.insert({ link_id: handlerJSFile === null || handlerJSFile === void 0 ? void 0 : handlerJSFile.id, value: `async (req, res) => { res.send('ok'); }` }, { table: 'strings' })).data[0];
            const isolationProviderThatSupportsJSExecutionProviderId = yield deep.id('@deep-foundation/core', 'dockerSupportsJs');
            const handlerTypeId = yield deep.id('@deep-foundation/core', 'Handler');
            const handlerId = (_v = (_u = (_t = (yield deep.insert({
                type_id: handlerTypeId,
                from_id: isolationProviderThatSupportsJSExecutionProviderId,
                to_id: handlerJSFile === null || handlerJSFile === void 0 ? void 0 : handlerJSFile.id,
            }))) === null || _t === void 0 ? void 0 : _t.data) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.id;
            const containTypeId = yield deep.id('@deep-foundation/core', 'Contain');
            const ownerId = yield deep.id('deep', 'admin');
            const ownerContainHandler = (yield deep.insert({
                from_id: ownerId,
                type_id: containTypeId,
                to_id: handlerId,
            }, { name: 'INSERT_ADMIN_CONTAIN_HANDLER' })).data[0];
            const handleRouteTypeId = yield deep.id('@deep-foundation/core', 'HandleRoute');
            const handleRouteLinkId = (_y = (_x = (_w = (yield deep.insert({
                from_id: routeId,
                type_id: handleRouteTypeId,
                to_id: handlerId,
            }))) === null || _w === void 0 ? void 0 : _w.data) === null || _x === void 0 ? void 0 : _x[0]) === null || _y === void 0 ? void 0 : _y.id;
            const url = `http://localhost:${port}${route}`;
            log("waiting for route to be created");
            yield (0, wait_on_1.default)({ resources: [url] });
            log("route handler is up");
            const response = yield (0, node_fetch_1.default)(url);
            const text = yield response.text();
            chai_1.assert.equal(text, 'ok');
            yield deep.delete(handleRouteLinkId);
            yield deep.delete(ownerContainHandler.id);
            yield deep.delete(handlerId);
            yield deep.delete(handlerJSFileValue.id, { table: 'strings' });
            yield deep.delete(handlerJSFile.id);
            yield deep.delete(routerStringUseId);
            yield deep.delete(routerListeningId);
            yield deep.delete(routerId);
            yield deep.delete(routeId);
            yield deep.delete(portValue.id, { table: 'numbers' });
            yield deep.delete(portId);
            log("waiting for route to be deleted");
            yield (0, wait_on_1.default)({ resources: [url], reverse: true });
            log("route handler is down");
        }));
        it(`handle route hierarchical insert`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _z, _0, _1, _2;
            const port = 4001;
            const route = '/passport';
            const insertResult = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Port'),
                number: { data: { value: port } },
                in: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'RouterListening'),
                        from: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'Router'),
                                in: { data: {
                                        type_id: yield deep.id('@deep-foundation/core', 'RouterStringUse'),
                                        string: { data: { value: route } },
                                        from: { data: {
                                                type_id: yield deep.id('@deep-foundation/core', 'Route'),
                                                out: { data: {
                                                        type_id: yield deep.id('@deep-foundation/core', 'HandleRoute'),
                                                        to: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'Handler'),
                                                                from_id: yield deep.id('@deep-foundation/core', 'dockerSupportsJs'),
                                                                in: { data: {
                                                                        type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                                                                        from_id: yield deep.id('deep', 'admin'),
                                                                        string: { data: { value: 'passport' } },
                                                                    } },
                                                                to: { data: {
                                                                        type_id: yield deep.id('@deep-foundation/core', 'SyncTextFile'),
                                                                        string: { data: {
                                                                                value: `async (req, res) => { res.send('ok'); }`,
                                                                            } },
                                                                    } },
                                                            } },
                                                    } },
                                            } },
                                    } },
                            } },
                    } },
            }, {
                returning: `
          id
          number {
            id
          }
          in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'RouterListening')}" }}){
            id
            from {
              id
              in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'RouterStringUse')}" }}){
                id
                from {
                  id
                  out(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'HandleRoute')}" }}){
                    id
                    to {
                      id
                      in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'Contain')}" }}){
                        id
                        string {
                          id
                          value
                        }
                      }
                      to {
                        id
                        string {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
                name: 'INSERT_HANDLE_ROUTE_HIERARCHICAL',
            });
            const portLink = (_z = insertResult === null || insertResult === void 0 ? void 0 : insertResult.data) === null || _z === void 0 ? void 0 : _z[0];
            const routerListening = (_0 = portLink === null || portLink === void 0 ? void 0 : portLink.in) === null || _0 === void 0 ? void 0 : _0[0];
            const router = routerListening === null || routerListening === void 0 ? void 0 : routerListening.from;
            const routerStringUse = (_1 = router.in) === null || _1 === void 0 ? void 0 : _1[0];
            const routeLink = routerStringUse === null || routerStringUse === void 0 ? void 0 : routerStringUse.from;
            const handleRoute = (_2 = routeLink === null || routeLink === void 0 ? void 0 : routeLink.out) === null || _2 === void 0 ? void 0 : _2[0];
            const handler = handleRoute === null || handleRoute === void 0 ? void 0 : handleRoute.to;
            const handlerJSFile = handler === null || handler === void 0 ? void 0 : handler.to;
            const ownerContainHandler = handler === null || handler === void 0 ? void 0 : handler.in[0];
            log({ portLink, routerListening, router, routerStringUse, routeLink, handleRoute, handler, handlerJSFile, ownerContainHandler });
            const url = `http://localhost:${port}${route}`;
            log("waiting for route to be created");
            yield (0, wait_on_1.default)({ resources: [url] });
            log("route handler is up");
            const response = yield (0, node_fetch_1.default)(url);
            const text = yield response.text();
            chai_1.assert.equal(text, 'ok');
            yield deep.delete(handleRoute === null || handleRoute === void 0 ? void 0 : handleRoute.id);
            yield deep.delete(ownerContainHandler === null || ownerContainHandler === void 0 ? void 0 : ownerContainHandler.id);
            yield deep.delete(handler === null || handler === void 0 ? void 0 : handler.id);
            yield deep.delete(handlerJSFile === null || handlerJSFile === void 0 ? void 0 : handlerJSFile.id);
            yield deep.delete(routerStringUse === null || routerStringUse === void 0 ? void 0 : routerStringUse.id);
            yield deep.delete(routerListening === null || routerListening === void 0 ? void 0 : routerListening.id);
            yield deep.delete(router === null || router === void 0 ? void 0 : router.id);
            yield deep.delete(routeLink === null || routeLink === void 0 ? void 0 : routeLink.id);
            yield deep.delete(portLink === null || portLink === void 0 ? void 0 : portLink.id);
            log("waiting for route to be deleted");
            yield (0, wait_on_1.default)({ resources: [url], reverse: true });
            log("route handler is down");
        }));
        it(`handle route hierarchical insert with throw error`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _3, _4, _5, _6, _7, _8;
            const port = 4001;
            const route = '/passport';
            const insertResult = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Port'),
                number: { data: { value: port } },
                in: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'RouterListening'),
                        from: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'Router'),
                                in: { data: {
                                        type_id: yield deep.id('@deep-foundation/core', 'RouterStringUse'),
                                        string: { data: { value: route } },
                                        from: { data: {
                                                type_id: yield deep.id('@deep-foundation/core', 'Route'),
                                                out: { data: {
                                                        type_id: yield deep.id('@deep-foundation/core', 'HandleRoute'),
                                                        to: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'Handler'),
                                                                from_id: yield deep.id('@deep-foundation/core', 'dockerSupportsJs'),
                                                                in: { data: {
                                                                        type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                                                                        from_id: yield deep.id('deep', 'admin'),
                                                                        string: { data: { value: 'passport' } },
                                                                    } },
                                                                to: { data: {
                                                                        type_id: yield deep.id('@deep-foundation/core', 'SyncTextFile'),
                                                                        string: { data: {
                                                                                value: `async (req, res) => { throw 'Error'; }`,
                                                                            } },
                                                                    } },
                                                            } },
                                                    } },
                                            } },
                                    } },
                            } },
                    } },
            }, {
                returning: `
          id
          number {
            id
          }
          in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'RouterListening')}" }}){
            id
            from {
              id
              in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'RouterStringUse')}" }}){
                id
                from {
                  id
                  out(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'HandleRoute')}" }}){
                    id
                    to {
                      id
                      in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'Contain')}" }}){
                        id
                        string {
                          id
                          value
                        }
                      }
                      to {
                        id
                        string {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
                name: 'INSERT_HANDLE_ROUTE_HIERARCHICAL',
            });
            const portLink = (_3 = insertResult === null || insertResult === void 0 ? void 0 : insertResult.data) === null || _3 === void 0 ? void 0 : _3[0];
            const routerListening = (_4 = portLink === null || portLink === void 0 ? void 0 : portLink.in) === null || _4 === void 0 ? void 0 : _4[0];
            const router = routerListening === null || routerListening === void 0 ? void 0 : routerListening.from;
            const routerStringUse = (_5 = router.in) === null || _5 === void 0 ? void 0 : _5[0];
            const routeLink = routerStringUse === null || routerStringUse === void 0 ? void 0 : routerStringUse.from;
            const handleRoute = (_6 = routeLink === null || routeLink === void 0 ? void 0 : routeLink.out) === null || _6 === void 0 ? void 0 : _6[0];
            const handler = handleRoute === null || handleRoute === void 0 ? void 0 : handleRoute.to;
            const handlerJSFile = handler === null || handler === void 0 ? void 0 : handler.to;
            const ownerContainHandler = handler === null || handler === void 0 ? void 0 : handler.in[0];
            log({ portLink, routerListening, router, routerStringUse, routeLink, handleRoute, handler, handlerJSFile, ownerContainHandler });
            const url = `http://localhost:${port}${route}`;
            log("waiting for route to be created");
            yield (0, wait_on_1.default)({ resources: [url] });
            log("route handler is up");
            const response = yield (0, node_fetch_1.default)(url);
            const text = yield response.text();
            chai_1.assert.equal(text, '{"rejected":"Error"}');
            yield delay(5000);
            const queryString = `{
        links(where: { 
          type_id: { _eq: ${yield deep.id('@deep-foundation/core', 'HandlingError')} },
        }) {
          id
          object {
            id
          }
          out {
            id
          }
        }
      }`;
            const client = deep.apolloClient;
            const handlingErrorLinks = (_8 = (_7 = (yield client.query({
                query: (0, graphql_tag_1.default) `${queryString}`,
            }))) === null || _7 === void 0 ? void 0 : _7.data) === null || _8 === void 0 ? void 0 : _8.links;
            console.log('handlingErrorLinks', handlingErrorLinks);
            const handlingErrorLink = handlingErrorLinks[0];
            const hanldingErrorValue = handlingErrorLink === null || handlingErrorLink === void 0 ? void 0 : handlingErrorLink.object;
            const handlingErrorReasons = handlingErrorLink === null || handlingErrorLink === void 0 ? void 0 : handlingErrorLink.out;
            for (const reason of handlingErrorReasons) {
                yield deep.delete(reason === null || reason === void 0 ? void 0 : reason.id);
            }
            yield deep.delete(hanldingErrorValue === null || hanldingErrorValue === void 0 ? void 0 : hanldingErrorValue.id, { table: 'objects' });
            yield deep.delete(handlingErrorLink === null || handlingErrorLink === void 0 ? void 0 : handlingErrorLink.id);
            yield deep.delete(handleRoute === null || handleRoute === void 0 ? void 0 : handleRoute.id);
            yield deep.delete(ownerContainHandler === null || ownerContainHandler === void 0 ? void 0 : ownerContainHandler.id);
            yield deep.delete(handler === null || handler === void 0 ? void 0 : handler.id);
            yield deep.delete(handlerJSFile === null || handlerJSFile === void 0 ? void 0 : handlerJSFile.id);
            yield deep.delete(routerStringUse === null || routerStringUse === void 0 ? void 0 : routerStringUse.id);
            yield deep.delete(routerListening === null || routerListening === void 0 ? void 0 : routerListening.id);
            yield deep.delete(router === null || router === void 0 ? void 0 : router.id);
            yield deep.delete(routeLink === null || routeLink === void 0 ? void 0 : routeLink.id);
            yield deep.delete(portLink === null || portLink === void 0 ? void 0 : portLink.id);
            log("waiting for route to be deleted");
            yield (0, wait_on_1.default)({ resources: [url], reverse: true });
            log("route handler is down");
        }));
        it(`handle route gql handler`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _9, _10, _11, _12, _13, _14;
            const port = 4002;
            const field = 'constant';
            const route = `/${field}`;
            const insertResult = yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'Port'),
                number: { data: { value: port } },
                in: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'RouterListening'),
                        from: { data: {
                                type_id: yield deep.id('@deep-foundation/core', 'Router'),
                                in: { data: {
                                        type_id: yield deep.id('@deep-foundation/core', 'RouterStringUse'),
                                        string: { data: { value: route } },
                                        from: { data: {
                                                type_id: yield deep.id('@deep-foundation/core', 'Route'),
                                                out: { data: {
                                                        type_id: yield deep.id('@deep-foundation/core', 'HandleRoute'),
                                                        to: { data: {
                                                                type_id: yield deep.id('@deep-foundation/core', 'Handler'),
                                                                from_id: yield deep.id('@deep-foundation/core', 'dockerSupportsJs'),
                                                                in: { data: {
                                                                        type_id: yield deep.id('@deep-foundation/core', 'Contain'),
                                                                        from_id: yield deep.id('deep', 'admin'),
                                                                        string: { data: { value: 'constant' } },
                                                                    } },
                                                                to: { data: {
                                                                        type_id: yield deep.id('@deep-foundation/core', 'SyncTextFile'),
                                                                        string: { data: {
                                                                                value: `async (req, res, next, { deep, require, gql }) => {
                          const express = require('express');
                          const http = require('http');
                          const ApolloServer = require('apollo-server-express').ApolloServer;
                          const { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');

                          const typeDefs = 'type Query { ${field}: Int }';

                          const resolvers = {
                            Query: { ${field}: () => (42) },
                          };
                          
                          const context = ({ req }) => { return { headers: req.headers }; };
                          
                          const generateApolloServer = () => {
                            return new ApolloServer({
                              introspection: true,
                              typeDefs, 
                              resolvers,
                              context,
                              plugins: [
                                ApolloServerPluginLandingPageGraphQLPlayground()
                              ]});
                            };

                          const router = express.Router();
                          const apolloServer = generateApolloServer();
                          await apolloServer.start();
                          apolloServer.applyMiddleware({ app: router, path: '/' });
                        
                          console.log('js-isolation-provider request')
                          console.log('req.method', req.method);
                          console.log('req.body', req.body);

                          router.handle(req, res);
                        }`,
                                                                            } },
                                                                    } },
                                                            } },
                                                    } },
                                            } },
                                    } },
                            } },
                    } },
            }, {
                returning: `
          id
          number {
            id
          }
          in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'RouterListening')}" }}){
            id
            from {
              id
              in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'RouterStringUse')}" }}){
                id
                from {
                  id
                  out(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'HandleRoute')}" }}){
                    id
                    to {
                      id
                      in(where: { type_id: {_eq: "${yield deep.id('@deep-foundation/core', 'Contain')}" }}){
                        id
                        string {
                          id
                          value
                        }
                      }
                      to {
                        id
                        string {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
                name: 'INSERT_HANDLE_ROUTE_HIERARCHICAL',
            });
            const portLink = (_9 = insertResult === null || insertResult === void 0 ? void 0 : insertResult.data) === null || _9 === void 0 ? void 0 : _9[0];
            const routerListening = (_10 = portLink === null || portLink === void 0 ? void 0 : portLink.in) === null || _10 === void 0 ? void 0 : _10[0];
            const router = routerListening === null || routerListening === void 0 ? void 0 : routerListening.from;
            const routerStringUse = (_11 = router.in) === null || _11 === void 0 ? void 0 : _11[0];
            const routeLink = routerStringUse === null || routerStringUse === void 0 ? void 0 : routerStringUse.from;
            const handleRoute = (_12 = routeLink === null || routeLink === void 0 ? void 0 : routeLink.out) === null || _12 === void 0 ? void 0 : _12[0];
            const handler = handleRoute === null || handleRoute === void 0 ? void 0 : handleRoute.to;
            const handlerJSFile = handler === null || handler === void 0 ? void 0 : handler.to;
            const ownerContainHandler = handler === null || handler === void 0 ? void 0 : handler.in[0];
            log({ portLink, routerListening, router, routerStringUse, routeLink, handleRoute, handler, handlerJSFile, ownerContainHandler });
            const handleGqlLink = (_14 = (_13 = (yield deep.insert({
                type_id: yield deep.id('@deep-foundation/core', 'HandleGql'),
                from_id: yield deep.id('@deep-foundation/core', 'MainGqlEndpoint'),
                to_id: handleRoute.id,
            }, {
                returning: `id`,
                name: 'INSERT_GQL_HANDLER_LINK',
            }))) === null || _13 === void 0 ? void 0 : _13.data) === null || _14 === void 0 ? void 0 : _14[0];
            const waitOnUrl = `http-get://localhost:${port}${route}?query=%7B${field}%7D`;
            log("waiting for route to be created");
            yield (0, wait_on_1.default)({ resources: [waitOnUrl] });
            log("route handler is up");
            yield delay(5000);
            const { data } = yield apolloClient.query({ query: (0, graphql_tag_1.default) `{ ${field} }` });
            chai_1.assert.equal(data === null || data === void 0 ? void 0 : data.constant, 42);
            yield deep.delete(handleGqlLink === null || handleGqlLink === void 0 ? void 0 : handleGqlLink.id);
            yield deep.delete(handleRoute === null || handleRoute === void 0 ? void 0 : handleRoute.id);
            yield deep.delete(ownerContainHandler === null || ownerContainHandler === void 0 ? void 0 : ownerContainHandler.id);
            yield deep.delete(handler === null || handler === void 0 ? void 0 : handler.id);
            yield deep.delete(handlerJSFile === null || handlerJSFile === void 0 ? void 0 : handlerJSFile.id);
            yield deep.delete(routerStringUse === null || routerStringUse === void 0 ? void 0 : routerStringUse.id);
            yield deep.delete(routerListening === null || routerListening === void 0 ? void 0 : routerListening.id);
            yield deep.delete(router === null || router === void 0 ? void 0 : router.id);
            yield deep.delete(routeLink === null || routeLink === void 0 ? void 0 : routeLink.id);
            yield deep.delete(portLink === null || portLink === void 0 ? void 0 : portLink.id);
            log("waiting for route to be deleted");
            yield (0, wait_on_1.default)({ resources: [waitOnUrl], reverse: true });
            log("route handler is down");
        }));
    });
    describe('handle by selector', () => {
        it(`handle insert`, () => __awaiter(void 0, void 0, void 0, function* () {
            const numberToReturn = nextHandlerResult();
            const handleInsertTypeId = yield deep.id('@deep-foundation/core', 'HandleInsert');
            const selector = yield (0, handlers_1.insertSelector)();
            const { nodeTypeId, linkTypeId, treeId, treeIncludesIds, selectorId, selectorIncludeId, selectorTreeId, rootId } = selector;
            const handler = yield (0, handlers_1.insertHandler)(handleInsertTypeId, selectorId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            const selectorItems = yield (0, handlers_1.insertSelectorItems)({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
            log(`awaiting ${selectorItems[1].linkId} link.`);
            yield deep.await(selectorItems[1].linkId);
            log(`awaiting ${selectorItems[0].linkId} link.`);
            yield deep.await(selectorItems[0].linkId);
            const resolvedTypeId1 = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults1 = yield getPromiseResults(deep, resolvedTypeId1, selectorItems[1].linkId);
            log('promiseResults1', JSON.stringify(promiseResults1));
            const promiseResult1 = promiseResults1.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            const resolvedTypeId2 = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults2 = yield getPromiseResults(deep, resolvedTypeId2, selectorItems[0].linkId);
            const promiseResult2 = promiseResults2.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            for (const selectorItem of selectorItems) {
                if (selectorItem === null || selectorItem === void 0 ? void 0 : selectorItem.linkId)
                    yield deep.delete(selectorItem.linkId);
                if (selectorItem === null || selectorItem === void 0 ? void 0 : selectorItem.nodeId)
                    yield deep.delete(selectorItem.nodeId);
            }
            yield (0, handlers_1.deleteSelector)(selector);
            yield deletePromiseResult(promiseResult1);
            yield deletePromiseResult(promiseResult2);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult1);
            chai_1.assert.isTrue(!!promiseResult2);
        }));
        it(`handle delete`, () => __awaiter(void 0, void 0, void 0, function* () {
            const numberToReturn = nextHandlerResult();
            const handleDeleteTypeId = yield deep.id('@deep-foundation/core', 'HandleDelete');
            const selector = yield (0, handlers_1.insertSelector)();
            const { nodeTypeId, linkTypeId, treeId, treeIncludesIds, selectorId, selectorIncludeId, selectorTreeId, rootId } = selector;
            const handler = yield (0, handlers_1.insertHandler)(handleDeleteTypeId, selectorId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            const selectorItems = yield (0, handlers_1.insertSelectorItems)({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
            yield deep.delete(selectorItems[1].linkId);
            yield deep.delete(selectorItems[0].linkId);
            yield deep.await(selectorItems[1].linkId);
            yield deep.await(selectorItems[0].linkId);
            const resolvedTypeId1 = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults1 = yield getPromiseResults(deep, resolvedTypeId1, selectorItems[1].linkId);
            const promiseResult1 = promiseResults1.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            const resolvedTypeId2 = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults2 = yield getPromiseResults(deep, resolvedTypeId2, selectorItems[0].linkId);
            const promiseResult2 = promiseResults2.find(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            for (const selectorItem of selectorItems) {
                yield deep.delete(selectorItem.linkId);
                yield deep.delete(selectorItem.nodeId);
            }
            yield (0, handlers_1.deleteSelector)(selector);
            yield deletePromiseResult(promiseResult1);
            yield deletePromiseResult(promiseResult2);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!promiseResult1);
            chai_1.assert.isTrue(!!promiseResult2);
        }));
        it(`handle update when value is updated`, () => __awaiter(void 0, void 0, void 0, function* () {
            const numberToReturn = nextHandlerResult();
            const handleUpdateTypeId = yield deep.id('@deep-foundation/core', 'HandleUpdate');
            const selector = yield (0, handlers_1.insertSelector)();
            const { nodeTypeId, linkTypeId, treeId, treeIncludesIds, selectorId, selectorIncludeId, selectorTreeId, rootId } = selector;
            const handler = yield (0, handlers_1.insertHandler)(handleUpdateTypeId, selectorId, `(arg) => {console.log(arg); return {result: ${numberToReturn}}}`);
            const selectorItems = yield (0, handlers_1.insertSelectorItems)({ selectorId, nodeTypeId, linkTypeId, treeId, rootId });
            const linkId = selectorItems[1].linkId;
            yield deep.insert({ link_id: linkId, value: numberToReturn }, { table: 'numbers' });
            yield deep.await(linkId);
            yield deep.update({ link_id: linkId }, { value: numberToReturn + 1 }, { table: 'numbers' });
            yield deep.await(linkId);
            const resolvedTypeId = yield deep.id('@deep-foundation/core', 'Resolved');
            const promiseResults = yield getPromiseResults(deep, resolvedTypeId, linkId);
            const matchedPromiseResults = promiseResults.filter(link => { var _a, _b; return ((_b = (_a = link.object) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.result) === numberToReturn; });
            for (const promiseResult of matchedPromiseResults) {
                yield deletePromiseResult(promiseResult);
            }
            for (const selectorItem of selectorItems) {
                yield deep.delete(selectorItem.linkId);
                yield deep.delete(selectorItem.nodeId);
            }
            yield deep.delete(linkId);
            yield (0, handlers_1.deleteSelector)(selector);
            yield (0, handlers_1.deleteHandler)(handler);
            chai_1.assert.isTrue(!!matchedPromiseResults);
            chai_1.assert.equal(matchedPromiseResults.length, 2);
        }));
    });
});
//# sourceMappingURL=handlers.js.map