"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMutation = exports.updateMutation = exports.insertMutation = exports.generateMutation = void 0;
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('deeplinks:gql:mutation');
const log = debug.extend('log');
const error = debug.extend('error');
const namespaces = debug_1.default.disable();
debug_1.default.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);
const fieldsInputs = (tableName) => ({
    'distinct_on': `[${tableName}_select_column!]`,
    'limit': `Int`,
    'offset': `Int`,
    'order_by': `[${tableName}_order_by!]`,
    'where': `${tableName}_bool_exp!`,
    'objects': `[${tableName}_insert_input!]!`,
    'object': `${tableName}_insert_input!`,
    '_inc': `${tableName}_inc_input`,
    '_set': `${tableName}_set_input`,
    'on_conflict': `${tableName}_on_conflict`,
});
const generateMutation = ({ tableName, operation, queryName = `${operation}_${tableName}`, returning = `id`, variables, }) => {
    log('generateMutationOptions', { tableName, operation, queryName, returning, variables });
    const fields = operation === 'insert' ? ['objects', 'on_conflict']
        : operation === 'update' ? ['_inc', '_set', 'where']
            : operation === 'delete' ? ['where']
                : [];
    const fieldTypes = fieldsInputs(tableName);
    return (alias, index) => {
        log('generateMutationBuilder', { tableName, operation, queryName, returning, variables, alias, index });
        const defs = [];
        const args = [];
        for (let f = 0; f < fields.length; f++) {
            const field = fields[f];
            if (variables[field]) {
                defs.push(`$${field + index}: ${fieldTypes[field]}`);
                args.push(`${field}: $${field}${index}`);
            }
        }
        const resultAlias = `${alias}${typeof (index) === 'number' ? index : ''}`;
        const resultReturning = `returning { ${returning} }`;
        const resultVariables = {};
        for (const v in variables) {
            if (Object.prototype.hasOwnProperty.call(variables, v)) {
                const variable = variables[v];
                resultVariables[v + index] = variable;
            }
        }
        const result = {
            tableName,
            operation,
            queryName,
            returning,
            variables,
            resultReturning,
            fields,
            fieldTypes,
            index,
            defs,
            args,
            alias,
            resultAlias,
            resultVariables,
        };
        log('generateMutationResult', result);
        return result;
    };
};
exports.generateMutation = generateMutation;
const insertMutation = (tableName, variables, options) => {
    return (0, exports.generateMutation)(Object.assign({ tableName, operation: 'insert', variables }, options));
};
exports.insertMutation = insertMutation;
const updateMutation = (tableName, variables, options) => {
    return (0, exports.generateMutation)(Object.assign({ tableName, operation: 'update', variables }, options));
};
exports.updateMutation = updateMutation;
const deleteMutation = (tableName, variables, options) => {
    return (0, exports.generateMutation)(Object.assign({ tableName, operation: 'delete', variables }, options));
};
exports.deleteMutation = deleteMutation;
//# sourceMappingURL=mutation.js.map