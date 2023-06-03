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
import deepcasePckg from '@deep-foundation/deepcase/deep.json' assert { type: 'json' };
import { importPackage, sharePermissions } from './1664940577200-tsx.js';
const debug = Debug('deeplinks:migrations:deepcase');
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    log('up');
    const importResult = yield importPackage(deepcasePckg);
    log(importResult);
    const packageId = importResult === null || importResult === void 0 ? void 0 : importResult.packageId;
    if (packageId) {
        yield sharePermissions(yield root.id('deep', 'admin'), packageId);
    }
    const usersCanInsertSafeLinks = yield root.id('deep', 'admin', 'usersCanInsertSafeLinks');
    const usersCanUpdateSafeLinks = yield root.id('deep', 'admin', 'usersCanUpdateSafeLinks');
    const usersCanDeleteSafeLinks = yield root.id('deep', 'admin', 'usersCanDeleteSafeLinks');
    const { data: rules } = yield root.select({
        'up': {
            'parent_id': { _in: [usersCanInsertSafeLinks, usersCanUpdateSafeLinks, usersCanDeleteSafeLinks] },
        }
    });
    root.minilinks.apply([...rules]);
    const insertSelector = (_e = (_d = (_c = (_b = (_a = root.minilinks.byId[usersCanInsertSafeLinks]) === null || _a === void 0 ? void 0 : _a.outByType) === null || _b === void 0 ? void 0 : _b[root.idLocal('@deep-foundation/core', 'RuleObject')]) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.to) === null || _e === void 0 ? void 0 : _e.id;
    const updateSelector = (_k = (_j = (_h = (_g = (_f = root.minilinks.byId[usersCanUpdateSafeLinks]) === null || _f === void 0 ? void 0 : _f.outByType) === null || _g === void 0 ? void 0 : _g[root.idLocal('@deep-foundation/core', 'RuleObject')]) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.to) === null || _k === void 0 ? void 0 : _k.id;
    const deleteSelector = (_q = (_p = (_o = (_m = (_l = root.minilinks.byId[usersCanDeleteSafeLinks]) === null || _l === void 0 ? void 0 : _l.outByType) === null || _m === void 0 ? void 0 : _m[root.idLocal('@deep-foundation/core', 'RuleObject')]) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.to) === null || _q === void 0 ? void 0 : _q.id;
    yield root.insert([
        {
            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
            from_id: insertSelector,
            to_id: yield root.id('@deep-foundation/deepcase', 'Traveler'),
            out: { data: {
                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                } },
        },
        {
            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
            from_id: updateSelector,
            to_id: yield root.id('@deep-foundation/deepcase', 'Traveler'),
            out: { data: {
                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                } },
        },
        {
            type_id: yield root.id('@deep-foundation/core', 'SelectorInclude'),
            from_id: deleteSelector,
            to_id: yield root.id('@deep-foundation/deepcase', 'Traveler'),
            out: { data: {
                    type_id: yield root.id('@deep-foundation/core', 'SelectorTree'),
                    to_id: yield root.id('@deep-foundation/core', 'containTree'),
                } },
        },
    ]);
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
});
//# sourceMappingURL=1664940577209-deepcase.js.map