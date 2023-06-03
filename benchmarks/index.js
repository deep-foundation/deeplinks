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
import { Suite } from 'benchmark';
import { DeepClient } from '../imports/client.js';
import _ from 'lodash';
import Debug from 'debug';
const debug = Debug('deeplinks:benchmarks');
const log = debug.extend('log');
const error = debug.extend('error');
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);
const delay = time => new Promise(res => setTimeout(res, time));
const apolloClient = generateApolloClient({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const deep = new DeepClient({ apolloClient });
(() => __awaiter(void 0, void 0, void 0, function* () {
    var suite = new Suite();
    const admin = yield deep.jwt({ linkId: yield deep.id('deep', 'admin') });
    const deepAdmin = new DeepClient({ deep: deep, token: admin.token, linkId: admin.linkId });
    const Query = yield deep.id('@deep-foundation/core', 'Query');
    const guest = yield deep.guest({});
    const deepGuest = new DeepClient(Object.assign({ deep: deepAdmin }, guest));
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
                    yield deepAdmin.insert(_.times(100, (t) => ({ type_id: Query })));
                    deferred.resolve();
                });
            } });
        suite.add('deepAdmin.insert { type: Any } x1000/1tr', { defer: true, fn: function (deferred) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield deepAdmin.insert(_.times(1000, (t) => ({ type_id: Query })));
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