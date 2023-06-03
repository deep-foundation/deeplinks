var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Debug from 'debug';
import { api, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const debug = Debug('deeplinks:migrations:plv8');
const log = debug.extend('log');
const error = debug.extend('error');
const mathjsPackage = require('../bundles/mathjs.js').code;
const jsonschemaPackage = require('../bundles/jsonschema.js').code;
export const createMathjsFabric = sql `CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__handlers__mathjs__package() RETURNS jsonb AS $package$ const sync__handlers__package = ${mathjsPackage}; return sync__handlers__package(); $package$ LANGUAGE plv8;`;
export const dropMathjsFabric = sql `DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__handlers__mathjs__package CASCADE;`;
export const createJsonschemaFabric = sql `CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__handlers__jsonschema__package() RETURNS jsonb AS $package$ const sync__handlers__package = ${jsonschemaPackage}; return sync__handlers__package(); $package$ LANGUAGE plv8;`;
export const dropJsonschemaFabric = sql `DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__handlers__jsonschema__package CASCADE;`;
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    yield api.sql(createMathjsFabric);
    yield api.sql(createJsonschemaFabric);
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
    yield api.sql(dropJsonschemaFabric);
    yield api.sql(dropMathjsFabric);
});
//# sourceMappingURL=1682327540225-mathjs-schema-packages.js.map