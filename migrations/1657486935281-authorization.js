var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import Debug from 'debug';
import { typeDefsString as as } from '../imports/router/authorization.js';
const debug = Debug('deeplinks:migrations:authorization');
const log = debug.extend('log');
const error = debug.extend('error');
const api = new HasuraApi({
    path: process.env.MIGRATIONS_HASURA_PATH,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    yield api.query({
        type: 'add_remote_schema',
        args: {
            name: 'authorization',
            definition: {
                url: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/authorization`,
                headers: [{ name: 'x-hasura-client', value: 'deeplinks-authorization' }],
                forward_client_headers: true,
                timeout_seconds: 120
            },
        }
    });
    yield api.metadata({
        type: "add_remote_schema_permissions",
        args: {
            remote_schema: 'authorization',
            role: 'link',
            definition: {
                schema: as,
            },
        },
    });
    yield api.metadata({
        type: "add_remote_schema_permissions",
        args: {
            remote_schema: 'authorization',
            role: 'undefined',
            definition: {
                schema: as,
            },
        },
    });
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
    yield api.query({
        type: 'remove_remote_schema',
        args: {
            name: 'authorization',
        },
    });
});
//# sourceMappingURL=1657486935281-authorization.js.map