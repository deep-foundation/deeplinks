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
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { typeDefsString } from '../imports/router/packager.js';
const debug = Debug('deeplinks:migrations:packager');
const log = debug.extend('log');
const error = debug.extend('error');
const api = new HasuraApi({
    path: process.env.MIGRATIONS_HASURA_PATH,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
const client = generateApolloClient({
    path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
const deep = new DeepClient({
    apolloClient: client,
});
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    yield api.query({
        type: 'add_remote_schema',
        args: {
            name: 'packager',
            definition: {
                url: `${process.env.MIGRATIONS_DEEPLINKS_URL}/api/packager`,
                headers: [{ name: 'x-hasura-client', value: 'deeplinks-packager' }],
                forward_client_headers: true,
                timeout_seconds: 60
            },
        }
    });
    yield api.metadata({
        type: "add_remote_schema_permissions",
        args: {
            remote_schema: 'packager',
            role: 'link',
            definition: {
                schema: typeDefsString,
            },
        },
    });
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
    yield api.query({
        type: 'remove_remote_schema',
        args: {
            name: 'packager',
        },
    });
});
//# sourceMappingURL=1637975150573-packager.js.map