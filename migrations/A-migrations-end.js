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
const debug = Debug('deeplinks:migrations:migratios-end');
const log = debug.extend('log');
const error = debug.extend('error');
const apolloClient = generateApolloClient({
    path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
const deep = new DeepClient({ apolloClient });
export const awaitAllLinks = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield deep.select({});
    for (const link of result.data) {
        yield deep.await(link.id);
    }
});
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    yield awaitAllLinks();
    yield awaitAllLinks();
    yield deep.insert({ type_id: yield deep.id("@deep-foundation/core", "MigrationsEnd") });
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
});
//# sourceMappingURL=A-migrations-end.js.map