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
import tsxPckg from '@deep-foundation/tsx/deep.json' assert { type: 'json' };
import { Packager } from '../imports/packager.js';
const debug = Debug('deeplinks:migrations:tsx');
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
export const importPackage = (pckg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const packager = new Packager(root);
    const importResult = yield packager.import(pckg);
    const { errors, packageId, namespaceId } = importResult;
    if (errors === null || errors === void 0 ? void 0 : errors.length) {
        console.log(JSON.stringify(errors, null, 2));
        const error = (_e = (_d = (_c = (_b = (_a = errors[0]) === null || _a === void 0 ? void 0 : _a.graphQLErrors) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.extensions) === null || _d === void 0 ? void 0 : _d.internal) === null || _e === void 0 ? void 0 : _e.error;
        throw new Error(`Import error: ${String(((_h = (_g = (_f = errors[0]) === null || _f === void 0 ? void 0 : _f.graphQLErrors) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.message) || (errors === null || errors === void 0 ? void 0 : errors[0]))}${(error === null || error === void 0 ? void 0 : error.message) ? ` ${error === null || error === void 0 ? void 0 : error.message} ${(_j = error === null || error === void 0 ? void 0 : error.request) === null || _j === void 0 ? void 0 : _j.method} ${(_k = error === null || error === void 0 ? void 0 : error.request) === null || _k === void 0 ? void 0 : _k.host}:${(_l = error === null || error === void 0 ? void 0 : error.request) === null || _l === void 0 ? void 0 : _l.port}${(_m = error === null || error === void 0 ? void 0 : error.request) === null || _m === void 0 ? void 0 : _m.path}` : ''}`);
    }
    return importResult;
});
export const sharePermissions = (userId, packageId) => __awaiter(void 0, void 0, void 0, function* () {
    yield root.insert([
        {
            type_id: yield root.id('@deep-foundation/core', 'Contain'),
            from_id: userId,
            to_id: packageId,
        },
        {
            type_id: yield root.id('@deep-foundation/core', 'Join'),
            from_id: packageId,
            to_id: userId,
        },
    ]);
});
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    const importResult = yield importPackage(tsxPckg);
    log(importResult);
    const packageId = importResult === null || importResult === void 0 ? void 0 : importResult.packageId;
    if (packageId) {
        yield sharePermissions(yield root.id('deep', 'admin'), packageId);
    }
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
});
//# sourceMappingURL=1664940577200-tsx.js.map