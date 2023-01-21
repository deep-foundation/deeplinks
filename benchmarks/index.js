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
const benchmark_1 = require("benchmark");
const client_2 = require("../imports/client");
const lodash_1 = __importDefault(require("lodash"));
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('deeplinks:benchmarks');
const log = debug.extend('log');
const error = debug.extend('error');
const namespaces = debug_1.default.disable();
debug_1.default.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);
const delay = time => new Promise(res => setTimeout(res, time));
const apolloClient = (0, client_1.generateApolloClient)({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const deep = new client_2.DeepClient({ apolloClient });
(() => __awaiter(void 0, void 0, void 0, function* () {
    var suite = new benchmark_1.Suite();
    const admin = yield deep.jwt({ linkId: yield deep.id('deep', 'admin') });
    const deepAdmin = new client_2.DeepClient({ deep: deep, token: admin.token, linkId: admin.linkId });
    const Query = yield deep.id('@deep-foundation/core', 'Query');
    const guest = yield deep.guest({});
    const deepGuest = new client_2.DeepClient(Object.assign({ deep: deepAdmin }, guest));
    yield deepAdmin.insert({
        type_id: yield deep.id('@deep-foundation/core', 'Rule'),
        out: { data: [
                {
                    type_id: yield deep.id('@deep-foundation/core', 'RuleSubject'),
                    to: { data: {
                            type_id: yield deep.id('@deep-foundation/core', 'Selector'),
                            out: { data: [
                                    {
                                        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                                        to_id: guest.linkId,
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
    yield (new Promise((res) => {
        suite.add('3000', { defer: true, fn: function (deferred) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield delay(3000);
                    deferred.resolve();
                });
            } });
        suite.add('by deepRoot.id', { defer: true, fn: function (deferred) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield deep.id('@deep-foundation/core', 'Promise');
                    deferred.resolve();
                });
            } });
        suite.add('deepAdmin.insert { type: Any } x1/1tr', { defer: true, fn: function (deferred) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield deepAdmin.insert({ type_id: Query });
                    deferred.resolve();
                });
            } });
        suite.add('deepAdmin.insert { type: Any } x100/1tr', { defer: true, fn: function (deferred) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield deepAdmin.insert(lodash_1.default.times(100, (t) => ({ type_id: Query })));
                    deferred.resolve();
                });
            } });
        suite.add('deepAdmin.insert { type: Any } x1000/1tr', { defer: true, fn: function (deferred) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield deepAdmin.insert(lodash_1.default.times(1000, (t) => ({ type_id: Query })));
                    deferred.resolve();
                });
            } });
        suite.on('cycle', function (event) {
            log(String(event.target));
        });
        suite.on('complete', function () {
            log('Fastest is ' + this.filter('fastest').map('name'));
            res(undefined);
        });
        suite.run({ 'async': false });
    }));
}))();
//# sourceMappingURL=index.js.map