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
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { generateUp, generateDown } from '../imports/type-table.js';
export const BOOL_EXP_TABLE_NAME = 'bool_exp';
const debug = Debug('deeplinks:migrations:values');
const log = debug.extend('log');
const error = debug.extend('error');
const apolloClient = generateApolloClient({
    path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
export const api = new HasuraApi({
    path: process.env.MIGRATIONS_HASURA_PATH,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
const deep = new DeepClient({ apolloClient });
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    yield (generateUp({
        schemaName: 'public',
        tableName: 'strings',
        valueType: 'TEXT NOT NULL DEFAULT ""',
        customColumnsSql: 'value text',
        linkRelation: 'string',
        linksTableName: 'links',
        api,
        deep,
    })());
    yield (generateUp({
        schemaName: 'public',
        tableName: 'numbers',
        valueType: 'numeric NOT NULL DEFAULT 0',
        customColumnsSql: 'value numeric',
        linkRelation: 'number',
        linksTableName: 'links',
        api,
        deep,
    })());
    yield (generateUp({
        schemaName: 'public',
        tableName: 'objects',
        valueType: 'jsonb NOT NULL DEFAULT \'{}\'::jsonb',
        customColumnsSql: 'value jsonb',
        linkRelation: 'object',
        linksTableName: 'links',
        api,
        deep,
    })());
    yield (generateUp({
        schemaName: 'public',
        tableName: BOOL_EXP_TABLE_NAME,
        valueType: 'TEXT',
        customColumnsSql: 'value text',
        api,
        deep,
    })());
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
    yield (generateDown({
        schemaName: 'public',
        tableName: 'strings',
        valueType: 'TEXT',
        customColumnsSql: 'value text',
        linkRelation: 'string',
        linksTableName: 'links',
        api,
        deep,
    })());
    yield (generateDown({
        schemaName: 'public',
        tableName: 'numbers',
        valueType: 'float8',
        customColumnsSql: 'value bigint',
        linkRelation: 'number',
        linksTableName: 'links',
        api,
        deep,
    })());
    yield (generateDown({
        schemaName: 'public',
        tableName: 'objects',
        valueType: 'jsonb',
        customColumnsSql: 'value jsonb',
        linkRelation: 'object',
        linksTableName: 'links',
        api,
        deep,
    })());
    yield (generateDown({
        schemaName: 'public',
        tableName: BOOL_EXP_TABLE_NAME,
        valueType: 'TEXT',
        customColumnsSql: 'value text',
        api,
        deep,
    })());
});
//# sourceMappingURL=1622421760250-values.js.map