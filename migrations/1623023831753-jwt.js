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
import { typeDefsString as gs } from '../imports/router/guest.js';
import { typeDefsString as js } from '../imports/router/jwt.js';
const debug = Debug('deeplinks:migrations:jwt');
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
            name: 'jwt',
            definition: {
                url: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/jwt`,
                headers: [{ name: 'x-hasura-client', value: 'deeplinks-jwt' }],
                forward_client_headers: true,
                timeout_seconds: 120
            },
        }
    });
    yield api.query({
        type: 'add_remote_schema',
        args: {
            name: 'guest',
            definition: {
                url: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/guest`,
                headers: [{ name: 'x-hasura-client', value: 'deeplinks-guest' }],
                forward_client_headers: true,
                timeout_seconds: 60
            },
        }
    });
    yield api.metadata({
        type: "add_remote_schema_permissions",
        args: {
            remote_schema: 'guest',
            role: 'link',
            definition: {
                schema: gs,
            },
        },
    });
    yield api.metadata({
        type: "add_remote_schema_permissions",
        args: {
            remote_schema: 'guest',
            role: 'undefined',
            definition: {
                schema: gs,
            },
        },
    });
    yield api.metadata({
        type: "add_remote_schema_permissions",
        args: {
            remote_schema: 'jwt',
            role: 'link',
            definition: {
                schema: js,
            },
        },
    });
    yield api.metadata({
        type: "add_remote_schema_permissions",
        args: {
            remote_schema: 'jwt',
            role: 'undefined',
            definition: {
                schema: js,
            },
        },
    });
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
    yield api.query({
        type: 'remove_remote_schema',
        args: {
            name: 'jwt',
        },
    });
    yield api.query({
        type: 'remove_remote_schema',
        args: {
            name: 'guest',
        },
    });
});
//# sourceMappingURL=1623023831753-jwt.js.map