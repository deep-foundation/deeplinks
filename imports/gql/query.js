"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuery = exports.generateQueryData = void 0;
const debug_1 = __importDefault(require("debug"));
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const debug = (0, debug_1.default)('deeplinks:gql:query');
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
});
const generateQueryData = ({ tableName, operation = 'query', queryName = `${tableName}`, returning = `id`, variables, }) => {
    log('generateQuery', { tableName, operation, queryName, returning, variables });
    const fields = ['distinct_on', 'limit', 'offset', 'order_by', 'where'];
    const fieldTypes = fieldsInputs(tableName);
    return (alias, index) => {
        log('generateQueryBuilder', { tableName, operation, queryName, returning, variables, alias, index });
        const defs = [];
        const args = [];
        for (let f = 0; f < fields.length; f++) {
            const field = fields[f];
            defs.push(`$${field + index}: ${fieldTypes[field]}`);
            args.push(`${field}: $${field}${index}`);
        }
        const resultAlias = `${alias}${typeof (index) === 'number' ? index : ''}`;
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
            resultReturning: returning,
            fields,
            fieldTypes,
            index,
            defs,
            args,
            alias,
            resultAlias,
            resultVariables,
        };
        log('generateQueryResult', result);
        return result;
    };
};
exports.generateQueryData = generateQueryData;
;
;
const generateQuery = ({ queries = [], operation = 'query', name = 'QUERY', alias = 'q', }) => {
    log('generateQuery', { name, alias, queries });
    const calledQueries = queries.map((m, i) => typeof (m) === 'function' ? m(alias, i) : m);
    const defs = calledQueries.map(m => m.defs.join(',')).join(',');
    const queryString = `${operation} ${name} (${defs}) { ${calledQueries.map(m => `${m.resultAlias}: ${m.queryName}(${m.args.join(',')}) { ${m.resultReturning} }`).join('')} }`;
    const query = (0, graphql_tag_1.default) `${queryString}`;
    const variables = {};
    for (let a = 0; a < calledQueries.length; a++) {
        const action = calledQueries[a];
        for (const v in action.resultVariables) {
            if (Object.prototype.hasOwnProperty.call(action.resultVariables, v)) {
                const variable = action.resultVariables[v];
                variables[v] = variable;
            }
        }
    }
    const result = {
        query,
        variables,
        queryString,
    };
    log('generateQueryResult', JSON.stringify({ query: queryString, variables }, null, 2));
    return result;
};
exports.generateQuery = generateQuery;
//# sourceMappingURL=query.js.map