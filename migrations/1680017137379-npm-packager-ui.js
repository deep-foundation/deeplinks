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
import npmPackagerUiPckg from '@deep-foundation/npm-packager-ui/deep.json' assert { type: 'json' };
import { importPackage, sharePermissions } from './1664940577200-tsx.js';
const debug = Debug('deeplinks:migrations:npm-packager-ui');
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
    log('up');
    const importResult = yield importPackage(npmPackagerUiPckg);
    log(importResult);
    const packageId = importResult === null || importResult === void 0 ? void 0 : importResult.packageId;
    if (packageId) {
        yield sharePermissions(yield root.id('deep', 'admin'), packageId);
    }
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
});
//# sourceMappingURL=1680017137379-npm-packager-ui.js.map