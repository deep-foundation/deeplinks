import Debug from 'debug';

const debug = Debug('deepcase:deepgraph:gql:query');

const fieldsInputs = (tableName): IGenerateQueryFieldTypes => ({
  'distinct_on': `[${tableName}_select_column!]`,
  'limit': `Int`,
  'offset': `Int`,
  'order_by': `[${tableName}_order_by!]`,
  'where': `${tableName}_bool_exp!`,
});

export interface IGenerateQueryOptions {
  tableName: string;
  operation: 'query' | 'subscription';
  queryName: string;
  returning?: string;
  variables: any; // TODO
}

export interface IGenerateQueryBuilder {
  (alias: string, index: number): IGenerateQueryResult
}

export interface IGenerateQueryFieldTypes {
  [field: string]: string;
}

export interface IGenerateQueryResult extends IGenerateQueryOptions {
  resultReturning: string;
  fields: string[];
  fieldTypes: IGenerateQueryFieldTypes;
  defs: string[];
  args: string[];
  alias: string;
  index: number;
  resultAlias: string;
  resultVariables: any;
}

export const generateQuery = ({
  tableName,
  operation = 'query',
  queryName = `${tableName}`,
  returning = `id`,
  variables,
}: IGenerateQueryOptions): IGenerateQueryBuilder => {
  debug('generateQuery', { tableName, operation, queryName, returning, variables });
  const fields = ['distinct_on', 'limit', 'offset', 'order_by', 'where'];
  const fieldTypes = fieldsInputs(tableName);

  return (alias: string, index: number): IGenerateQueryResult => {
    debug('generateQueryBuilder', { tableName, operation, queryName, returning, variables, alias, index });
    const defs = [];
    const args = [];
    for (let f = 0; f < fields.length; f++) {
      const field = fields[f];
      defs.push(`$${field + index}: ${fieldTypes[field]}`);
      args.push(`${field}: $${field}${index}`);
    }
    const resultAlias = `${alias}${typeof(index) === 'number' ? index : ''}`;
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
    debug('generateQueryResult', result);
    return result
  };
};
