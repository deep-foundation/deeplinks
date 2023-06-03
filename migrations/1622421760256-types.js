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
import Debug from 'debug';
import { Packager } from '../imports/packager.js';
import { corePckg } from '../imports/core.js';
import { DeepClient } from '../imports/client.js';
const debug = Debug('deeplinks:migrations:types');
const log = debug.extend('log');
const error = debug.extend('error');
const rootClient = generateApolloClient({
    path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
const root = new DeepClient({
    apolloClient: rootClient,
});
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    log('up');
    const packager = new Packager(root);
    const { errors, packageId, namespaceId } = yield packager.import(corePckg);
    if (errors === null || errors === void 0 ? void 0 : errors.length) {
        log(errors);
        log((_c = (_b = (_a = errors[0]) === null || _a === void 0 ? void 0 : _a.graphQLErrors) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message);
        log((_g = (_f = (_e = (_d = errors[0]) === null || _d === void 0 ? void 0 : _d.graphQLErrors) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.extensions) === null || _g === void 0 ? void 0 : _g.internal);
        log((_m = (_l = (_k = (_j = (_h = errors[0]) === null || _h === void 0 ? void 0 : _h.graphQLErrors) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.extensions) === null || _l === void 0 ? void 0 : _l.internal) === null || _m === void 0 ? void 0 : _m.request);
        const error = (_s = (_r = (_q = (_p = (_o = errors[0]) === null || _o === void 0 ? void 0 : _o.graphQLErrors) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.extensions) === null || _r === void 0 ? void 0 : _r.internal) === null || _s === void 0 ? void 0 : _s.error;
        throw new Error(`Import error: ${String(((_v = (_u = (_t = errors[0]) === null || _t === void 0 ? void 0 : _t.graphQLErrors) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.message) || (errors === null || errors === void 0 ? void 0 : errors[0]))}${(error === null || error === void 0 ? void 0 : error.message) ? ` ${error === null || error === void 0 ? void 0 : error.message} ${(_w = error === null || error === void 0 ? void 0 : error.request) === null || _w === void 0 ? void 0 : _w.method} ${(_x = error === null || error === void 0 ? void 0 : error.request) === null || _x === void 0 ? void 0 : _x.host}:${(_y = error === null || error === void 0 ? void 0 : error.request) === null || _y === void 0 ? void 0 : _y.port}${(_z = error === null || error === void 0 ? void 0 : error.request) === null || _z === void 0 ? void 0 : _z.path}` : ''}`);
    }
    else {
        yield root.insert({
            type_id: yield root.id('@deep-foundation/core', 'Package'),
            string: { data: { value: 'deep' } },
        });
        yield root.insert({
            type_id: yield root.id('@deep-foundation/core', 'User'),
            in: { data: [{
                        from_id: yield root.id('deep'),
                        type_id: yield root.id('@deep-foundation/core', 'Contain'),
                        string: { data: { value: 'users' } },
                    }] },
        });
        yield root.insert({
            type_id: yield root.id('@deep-foundation/core', 'User'),
            in: { data: [{
                        from_id: yield root.id('deep', 'users'),
                        type_id: yield root.id('@deep-foundation/core', 'Contain'),
                        string: { data: { value: 'packages' } },
                    }] },
            out: { data: [{
                        to_id: yield root.id('deep', 'users'),
                        type_id: yield root.id('@deep-foundation/core', 'Join'),
                        string: { data: { value: 'packages' } },
                    }] },
        });
        yield root.insert({
            type_id: yield root.id('@deep-foundation/core', 'Contain'),
            to_id: yield root.id('@deep-foundation/core'),
            from_id: yield root.id('deep', 'users', 'packages'),
        });
        yield root.insert({
            type_id: yield root.id('@deep-foundation/core', 'Join'),
            from_id: yield root.id('@deep-foundation/core'),
            to_id: yield root.id('deep', 'users', 'packages'),
        });
        const { data: [{ id: adminId }] } = yield root.insert({
            type_id: yield root.id('@deep-foundation/core', 'User'),
            in: { data: [{
                        from_id: yield root.id('deep', 'users'),
                        type_id: yield root.id('@deep-foundation/core', 'Contain'),
                        string: { data: { value: 'admin' } },
                    }, {
                        from_id: yield root.id('deep'),
                        type_id: yield root.id('@deep-foundation/core', 'Contain'),
                        string: { data: { value: 'admin' } },
                    }, {
                        from_id: yield root.id('deep'),
                        type_id: yield root.id('@deep-foundation/core', 'Join'),
                    }, {
                        from_id: yield root.id('@deep-foundation/core'),
                        type_id: yield root.id('@deep-foundation/core', 'Join'),
                    }] },
            out: { data: [{
                        to_id: yield root.id('deep', 'users'),
                        type_id: yield root.id('@deep-foundation/core', 'Join'),
                    }] },
        });
        console.log('admin', adminId);
        const adminPermission = yield root.insert({
            type_id: yield root.id('@deep-foundation/core', 'Rule'),
            in: { data: [{
                        from_id: yield root.id('deep', 'admin'),
                        type_id: yield root.id('@deep-foundation/core', 'Contain'),
                        string: { data: { value: 'allowAdminRule' } },
                    }] },
            out: {
                data: [
                    {
                        type_id: yield root.id('@deep-foundation/core', 'RuleSubject'),
                        to: {
                            data: {
                                type_id: yield root.id('@deep-foundation/core', 'Selector'),
                                out: {
                                    data: [
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: adminId,
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'joinTree'),
                                                },
                                            },
                                        },
                                    ]
                                },
                            },
                        },
                    },
                    {
                        type_id: yield root.id('@deep-foundation/core', 'RuleObject'),
                        to: {
                            data: {
                                type_id: yield root.id('@deep-foundation/core', 'Selector'),
                                out: {
                                    data: [
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: adminId,
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        type_id: yield root.id('@deep-foundation/core', 'RuleAction'),
                        to: {
                            data: {
                                type_id: yield root.id('@deep-foundation/core', 'Selector'),
                                out: {
                                    data: [
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: yield root.id('@deep-foundation/core', 'AllowAdmin'),
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        });
        const promisePermission = yield root.insert({
            type_id: yield root.id('@deep-foundation/core', 'Rule'),
            in: { data: [{
                        from_id: yield root.id('deep', 'admin'),
                        type_id: yield root.id('@deep-foundation/core', 'Contain'),
                        string: { data: { value: 'allowSelectBasicTypesRule' } },
                    }] },
            out: {
                data: [
                    {
                        type_id: yield root.id('@deep-foundation/core', 'RuleSubject'),
                        to: {
                            data: {
                                type_id: yield root.id('@deep-foundation/core', 'Selector'),
                                out: {
                                    data: [
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: yield root.id('deep', 'users'),
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'joinTree'),
                                                },
                                            },
                                        },
                                    ]
                                },
                            },
                        },
                    },
                    {
                        type_id: yield root.id('@deep-foundation/core', 'RuleObject'),
                        to: {
                            data: {
                                type_id: yield root.id('@deep-foundation/core', 'Selector'),
                                out: {
                                    data: [
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: yield root.id('@deep-foundation/core', 'User'),
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                                                },
                                            },
                                        },
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: yield root.id('@deep-foundation/core', 'Then'),
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                                                },
                                            },
                                        },
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: yield root.id('@deep-foundation/core', 'Promise'),
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                                                },
                                            },
                                        },
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: yield root.id('@deep-foundation/core', 'Resolved'),
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                                                },
                                            },
                                        },
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: yield root.id('@deep-foundation/core', 'Rejected'),
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        type_id: yield root.id('@deep-foundation/core', 'RuleAction'),
                        to: {
                            data: {
                                type_id: yield root.id('@deep-foundation/core', 'Selector'),
                                out: {
                                    data: [
                                        {
                                            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
                                            to_id: yield root.id('@deep-foundation/core', 'AllowSelectType'),
                                            out: {
                                                data: {
                                                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                                                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        });
    }
});
const delay = time => new Promise(res => setTimeout(res, time));
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
    try {
        const handleScheduleId = yield root.id('@deep-foundation/core', 'HandleSchedule');
        const deletedHandlers = yield root.delete({
            type_id: handleScheduleId,
        }, { name: 'DELETE_SCHEDULE_HANDLERS' });
        yield delay(10000);
    }
    catch (e) {
        error(e);
    }
    yield root.delete({}, { name: 'DELETE_TYPE_TYPE' });
});
//# sourceMappingURL=1622421760256-types.js.map