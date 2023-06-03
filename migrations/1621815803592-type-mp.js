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
import { Trigger } from '@deep-foundation/materialized-path/trigger.js';
import Debug from 'debug';
import { DeepClient } from '../imports/client.js';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
const debug = Debug('deeplinks:migrations:type-mp');
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
const api = new HasuraApi({
    path: process.env.MIGRATIONS_HASURA_PATH,
    ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
    secret: process.env.MIGRATIONS_HASURA_SECRET,
});
export const MP_TABLE_NAME = 'mp';
const createTrigger = () => __awaiter(void 0, void 0, void 0, function* () {
    return Trigger({
        from_field: 'type_id',
        mpTableName: MP_TABLE_NAME,
        graphTableName: LINKS_TABLE_NAME,
        id_type: 'bigint',
        iteratorInsertDeclare: `groupRow bigint DEFAULT 0;`,
        iteratorDeleteArgumentSend: 'groupRow',
        iteratorDeleteArgumentGet: `groupRow bigint = 0`,
        iteratorInsertBegin: ``,
        iteratorInsertEnd: '',
        groupInsert: 'groupRow',
        iteratorDeleteDeclare: `groupRow bigint DEFAULT 0;`,
        iteratorDeleteBegin: ``,
        iteratorDeleteEnd: '',
        groupDelete: 'groupRow',
        isAllowSpreadFromCurrent: `TRUE`,
        isAllowSpreadCurrentTo: `FALSE`,
        isAllowSpreadToCurrent: `FALSE`,
        isAllowSpreadCurrentFrom: `FALSE`,
        isAllowSpreadToInCurrent: `FALSE`,
        isAllowSpreadCurrentFromOut: `FALSE`,
        isAllowSpreadFromOutCurrent: `FALSE`,
        isAllowSpreadCurrentToIn: `FALSE`,
        postfix: '__type',
    });
});
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    const trigger = yield createTrigger();
    yield api.sql(trigger.upFunctionInsertNode());
    yield api.sql(trigger.upFunctionDeleteNode());
    yield api.sql(trigger.upTriggerDelete());
    yield api.sql(trigger.upTriggerInsert());
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    const trigger = yield createTrigger();
    log('down');
    log('dropTrigger');
    yield api.sql(trigger.downFunctionInsertNode());
    yield api.sql(trigger.downFunctionDeleteNode());
    yield api.sql(trigger.downTriggerDelete());
    yield api.sql(trigger.downTriggerInsert());
});
//# sourceMappingURL=1621815803592-type-mp.js.map