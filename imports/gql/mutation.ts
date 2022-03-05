import Debug from 'debug';

const debug = Debug('deeplinks:gql:mutation');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const fieldsInputs = (tableName): IGenerateMutationFieldTypes => ({
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

export interface IGenerateMutationOptions {
  tableName: string;
  operation: 'insert' | 'update' | 'delete';
  queryName?: string;
  returning?: string;
  variables?: any;
}

export interface IGenerateMutationBuilder {
  (alias: string, index: number): IGenerateMutationResult
}

export interface IGenerateMutationFieldTypes {
  [field: string]: string;
}

export interface IGenerateMutationResult extends IGenerateMutationOptions {
  resultReturning: string;
  fields: string[];
  fieldTypes: IGenerateMutationFieldTypes;
  defs: string[];
  args: string[];
  alias: string;
  index: number;
  resultAlias: string;
  resultVariables: any;
}

export const generateMutation = ({
  tableName,
  operation,
  queryName = `${operation}_${tableName}`,
  returning = `id`,
  variables,
}: IGenerateMutationOptions): IGenerateMutationBuilder => {
  log('generateMutationOptions', { tableName, operation, queryName, returning, variables });
  const fields =
    operation === 'insert' ? ['objects','on_conflict']
  : operation === 'update' ? ['_inc','_set','where']
  : operation === 'delete' ? ['where']
  : [];
  const fieldTypes = fieldsInputs(tableName);

  return (alias: string, index: number): IGenerateMutationResult => {
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
    const resultAlias = `${alias}${typeof(index) === 'number' ? index : ''}`;
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

export const insertMutation = (tableName: string, variables: any, options?: IGenerateMutationOptions) => {
  return generateMutation({
    tableName, operation: 'insert', variables, ...options,
  });
}

export const updateMutation = (tableName: string, variables: any, options?: IGenerateMutationOptions) => {
  return generateMutation({
    tableName, operation: 'update', variables, ...options,
  });
}

export const deleteMutation = (tableName: string, variables: any, options?: IGenerateMutationOptions) => {
  return generateMutation({
    tableName, operation: 'delete', variables, ...options,
  });
}
