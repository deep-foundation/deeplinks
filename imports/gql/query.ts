import Debug from 'debug';
import gql from 'graphql-tag';

const debug = Debug('deeplinks:gql:query');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output

const fieldsInputs = (tableName): IGenerateQueryFieldTypes => ({
  'distinct_on': `[${tableName}_select_column!]`,
  'limit': `Int`,
  'offset': `Int`,
  'order_by': `[${tableName}_order_by!]`,
  'where': `${tableName}_bool_exp!`,
});

const manyRelations = {
  'from': false,
  'to': false,
  'type': false,
  'in': true,
  'out': true,
  'typed': true,
};

export type IReturningGenerator = (tableName: string) => string;

export interface IGenerateQueryDataOptions {
  tableNamePostfix?: string;
  tableName: string;
  operation?: 'query' | 'subscription';
  queryName?: string;
  returning?: (string | IReturningGenerator);
  variables?: any; // TODO
}

export interface IGenerateQueryDataBuilder {
  (alias: string, index: number): IGenerateQueryDataResult
}

export interface IGenerateQueryFieldTypes {
  [field: string]: string;
}

export interface IGenerateQueryDataResult extends IGenerateQueryDataOptions {
  resultReturning: string;
  fields: string[];
  defs: string[];
  args: string[];
  alias: string;
  index: number;
  resultAlias: string;
  resultVariables: any;
}

export const generateQueryData = ({
  tableName,
  tableNamePostfix = '',
  operation = 'query',
  queryName = `${tableName}`,
  returning = `id`,
  variables: _variables,
}: IGenerateQueryDataOptions): IGenerateQueryDataBuilder => {
  log('generateQuery', { tableName, tableNamePostfix, operation, queryName, returning, _variables });
  const fields = ['distinct_on', 'limit', 'offset', 'order_by', 'where'];
  const _returning: (tableName: string) => string = typeof(returning) === 'string' ? (tableName: string) => returning : returning;

  return (alias: string, index: number): IGenerateQueryDataResult => {
    const { where: { return: customReturn, ...where }, ...__variables } = _variables;
    const variables = { ...__variables, where };
    log('generateQueryBuilder', { tableName, tableNamePostfix, operation, queryName, returning, variables, alias, index });
    const generateDefs = (fields, index, tableName, postfix = '') => {
      const fieldTypes = fieldsInputs(tableName);
      const defs = [];
      const args = [];
      for (let f = 0; f < fields.length; f++) {
        const field = fields[f];
        const key = field + index + postfix;
        defs.push(`$${key}: ${fieldTypes[field]}`);
        args.push(`${field}: $${key}`);
      }
      return { defs, args };
    };
    const { defs, args } = generateDefs(fields, index, tableName);
    const resultAlias = `${alias}${typeof(index) === 'number' ? index : ''}`;
    const resultVariables = {};
    for (const v in variables) {
      if (Object.prototype.hasOwnProperty.call(variables, v)) {
        const variable = variables[v];
        resultVariables[v + index] = variable;
      }
    }
    let customReturnAliases = ``;
    const generateCustomArgsAndVariables = (customReturn, prefix = '') => {
      let result = '';
      for (let r in customReturn) {
        const { return: _return, relation, table, ...customWhere } = customReturn[r];
        console.log('generateCustomArgsAndVariables', table);
        const _table = table || tableName;
        const postfix = `${prefix}_${r}`;
        let customReturning = '';
        if (_return) {
          customReturning += generateCustomArgsAndVariables(_return, postfix);
        }
        if (manyRelations[relation]) {
          const { defs: _defs, args: _args } = generateDefs(fields, index, _table, postfix);
          defs.push(..._defs);
          const variable = customWhere;
          resultVariables['where' + index + postfix] = variable;
          result += ` ${r}: ${customReturn[r].relation}(${_args.join(',')}) { ${_returning(_table)} ${customReturning} }`;
        } else {
          const variable = customWhere;
          resultVariables['where' + index + postfix] = variable;
          result += ` ${r}: ${customReturn[r].relation} { ${_returning(_table)} ${customReturning} }`;
        }
      }
      return result;
    };
    customReturnAliases += generateCustomArgsAndVariables(customReturn, '');
    const result = {
      tableName,
      tableNamePostfix,
      operation,
      queryName: queryName+tableNamePostfix,
      returning,
      variables,
      resultReturning: `${_returning(tableName)}${customReturnAliases || ''}`,
      fields,
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
export interface IGenerateQueryOptions {
  queries: any[];
  name: string;
  operation?: 'query' | 'subscription';
  alias?: string;
};

export interface IGenerateQueryResult {
  query: any;
  queryString: any;
  variables: any;
};

export const generateQuery = ({
  queries = [],
  operation = 'query',
  name = 'QUERY',
  alias = 'q',
}: IGenerateQueryOptions): IGenerateQueryResult => {
  log('generateQuery', { name, alias, queries });
  const calledQueries = queries.map((m,i) => typeof(m) === 'function' ? m(alias, i) : m);
  const defs = calledQueries.map(m => m.defs.join(',')).join(',');
  const queryString = `${operation} ${name} (${defs}) { ${calledQueries.map(m => `${m.resultAlias}: ${m.queryName}(${m.args.join(',')}) { ${m.resultReturning} }`).join('')} }`;
  let query;
  try {
    query = gql`${queryString}`;
  } catch (e) {
    throw e;
  }
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

