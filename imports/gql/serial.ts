import Debug from 'debug';
import gql from 'graphql-tag';
import { SerialOperationType, Table, SerialOperation, SerialOperationDetails } from '../client.js';

const debug = Debug('deeplinks:gql:serial');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

export interface ISerialOptions {
  actions: any[];
  name?: string;
  alias?: string;
  [key: string]: any;
};

export interface ISerialResult {
  mutation: any;
  mutationString: any;
  variables: any;
};

export const generateSerial = ({
  actions = [],
  name = 'SERIAL',
  alias = 'm',
  ...options
}: ISerialOptions): ISerialResult => {
  log('generateSerial', { name, alias, actions });
  const calledActions = actions.map((m,i) => typeof(m) === 'function' ? m(alias, i) : m);
  const defs = calledActions.map(m => m.defs.join(',')).join(',');
  const mutationString = `mutation ${name} (${defs}) { ${calledActions.map(m => `${m.resultAlias}: ${m.queryName}(${m.args.join(',')}) { ${m.resultReturning} }`).join('')} }`;
  const mutation = gql`${mutationString}`;
  const variables = {};
  for (let a = 0; a < calledActions.length; a++) {
    const action = calledActions[a];
    for (const v in action.resultVariables) {
      if (Object.prototype.hasOwnProperty.call(action.resultVariables, v)) {
        const variable = action.resultVariables[v];
        variables[v] = variable;
      }
    }
  }
  const result = {
    mutation,
    variables,
    mutationString,
    ...options
  };
  log('generateSerialResult', JSON.stringify({ mutation: mutationString, variables }, null, 2));
  return result;
};

export function createSerialOperation<
  TSerialOperationType extends SerialOperationType,
  TTable extends Table<TSerialOperationType>
>(params: {
  type: TSerialOperationType;
  table: TTable;
} & SerialOperationDetails<TSerialOperationType, TTable>): SerialOperation<TSerialOperationType, TTable> {
  return params;
}