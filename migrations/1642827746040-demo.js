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
import { DeepClient } from '../imports/client.js';
const debug = Debug('deeplinks:migrations:demo');
const log = debug.extend('log');
const error = debug.extend('error');
const client = generateApolloClient({
    path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
const deep = new DeepClient({
    apolloClient: client,
});
let i = 0;
const insertRule = (containName, admin, options) => __awaiter(void 0, void 0, void 0, function* () {
    i++;
    const { data: [{ id: ruleId }] } = yield admin.insert({
        type_id: yield admin.id('@deep-foundation/core', 'Rule'),
        in: { data: [
                {
                    type_id: yield admin.id('@deep-foundation/core', 'Contain'),
                    from_id: yield admin.id('deep', 'admin'),
                    string: { data: { value: containName } },
                },
            ] },
        out: { data: [
                {
                    type_id: yield admin.id('@deep-foundation/core', 'RuleSubject'),
                    to: { data: {
                            type_id: yield admin.id('@deep-foundation/core', 'Selector'),
                            out: { data: options.subject },
                        } }
                },
                {
                    type_id: yield admin.id('@deep-foundation/core', 'RuleObject'),
                    to: { data: {
                            type_id: yield admin.id('@deep-foundation/core', 'Selector'),
                            out: { data: options.object },
                        } }
                },
                {
                    type_id: yield admin.id('@deep-foundation/core', 'RuleAction'),
                    to: { data: {
                            type_id: yield admin.id('@deep-foundation/core', 'Selector'),
                            out: { data: options.action },
                        } }
                },
            ] },
    });
});
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    const { linkId, token } = yield deep.jwt({ linkId: yield deep.id('deep', 'admin') });
    const admin = new DeepClient({ deep, token, linkId });
    const usersWhere = {
        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: yield deep.id('deep', 'users'),
        out: { data: {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                to_id: yield deep.id('@deep-foundation/core', 'joinTree'),
            } },
    };
    const adminWhere = {
        type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
        to_id: yield deep.id('deep', 'admin'),
        out: { data: {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                to_id: yield deep.id('@deep-foundation/core', 'containTree'),
            } },
    };
    yield insertRule('adminPackageInstallPublish', admin, {
        subject: adminWhere,
        object: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowPackageInstall'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowPackagePublish'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
        ],
        action: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowPackageInstall'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowPackagePublish'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
        ],
    });
    yield insertRule('usersCanSeeAll', admin, {
        subject: usersWhere,
        object: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('deep'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
        ],
        action: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowSelect'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
        ],
    });
    yield insertRule('usersCanLoginAdmin', admin, {
        subject: usersWhere,
        object: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('deep', 'admin'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            }
        ],
        action: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowLogin'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
        ],
    });
    const types = [
        {
            type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: yield deep.id('@deep-foundation/core', 'Active'),
            out: { data: {
                    type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                } },
        },
        {
            type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: yield deep.id('@deep-foundation/core', 'Focus'),
            out: { data: {
                    type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                } },
        },
        {
            type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: yield deep.id('@deep-foundation/core', 'Contain'),
            out: { data: {
                    type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                } },
        },
        {
            type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: yield deep.id('@deep-foundation/core', 'Space'),
            out: { data: {
                    type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                } },
        },
        {
            type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: yield deep.id('@deep-foundation/core', 'Query'),
            out: { data: {
                    type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                } },
        },
        {
            type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: yield deep.id('@deep-foundation/core', 'SyncTextFile'),
            out: { data: {
                    type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                } },
        },
    ];
    yield insertRule('usersCanInsertSafeLinks', admin, {
        subject: usersWhere,
        object: [
            ...types,
        ],
        action: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowInsertType'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
        ],
    });
    yield insertRule('usersCanUpdateSafeLinks', admin, {
        subject: usersWhere,
        object: [
            ...types,
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorFilter'),
                to: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'Query'),
                        object: { data: { value: {
                                    _by_item: {
                                        group_id: { _eq: yield deep.id('@deep-foundation/core', 'containTree') },
                                        path_item_id: { _eq: 'X-Deep-User-Id' },
                                    },
                                } } }
                    } },
            },
        ],
        action: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowUpdateType'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
        ],
    });
    yield insertRule('usersCanDeleteSafeLinks', admin, {
        subject: usersWhere,
        object: [
            ...types,
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorFilter'),
                to: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'Query'),
                        object: { data: { value: {
                                    _by_item: {
                                        group_id: { _eq: yield deep.id('@deep-foundation/core', 'containTree') },
                                        path_item_id: { _eq: 'X-Deep-User-Id' },
                                    },
                                } } }
                    } },
            },
        ],
        action: [
            {
                type_id: yield deep.id('@deep-foundation/core', 'SelectorInclude'),
                to_id: yield deep.id('@deep-foundation/core', 'AllowDeleteType'),
                out: { data: {
                        type_id: yield deep.id('@deep-foundation/core', 'SelectorTree'),
                        to_id: yield deep.id('@deep-foundation/core', 'containTree'),
                    } },
            },
        ],
    });
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
});
//# sourceMappingURL=1642827746040-demo.js.map