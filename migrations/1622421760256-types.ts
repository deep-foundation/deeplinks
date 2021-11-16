import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { generateMutation, generateSerial, insertMutation } from '../imports/gql';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import times from 'lodash/times';
import { time } from 'console';
import { Packager } from '../imports/packager';

const debug = Debug('deeplinks:migrations:types');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const corePckg = {
  package: "@deep-foundation/core@0.0.0",
  data: [
    // 0

    { id: 'Type', type: 'Type' },
    // 1
    { id: 'Package', type: 'Type' },
    { id: 'package', type: 'Package' },
    { id: 'Table', type: 'Type' },
    { id: 'Column', type: 'Type', from: 'Table', to: 'Type' },
    { id: 'Value', type: 'Type', from: 'Table', to: 'Type' },

    { id: 'String', type: 'Type' },
    { id: 'Number', type: 'Type' },
    { id: 'JSON', type: 'Type' },
    { id: 'Any', type: 'Type' },
    // 10
    { id: 'Promise', type: 'Type' },
    { id: 'Then', type: 'Type', from: 'Any', to: 'Promise' },
    { id: 'Resolved', type: 'Type', from: 'Promise', to: 'Any' },
    { id: 'Rejected', type: 'Type', from: 'Promise', to: 'Any' },

    // ===

    { id: 'typeTable', type: 'Table' },
    // 15
    { id: 'typeTableColumn', type: 'Column', from: 'typeTable', to: 'String' },
    { id: 'typeTableValue', type: 'Value', from: 'typeTable', to: 'Type' },
    // 17

    { id: 'tableTable', type: 'Table' },
    { id: 'tableTableColumn', type: 'Column', from: 'tableTable', to: 'String' },
    { id: 'tableTableValue', type: 'Value', from: 'tableTable', to: 'Table' },
    // 20

    { id: 'columnTable', type: 'Table' },
    { id: 'columnTableColumn', type: 'Column', from: 'columnTable', to: 'String' },
    { id: 'columnTableValue', type: 'Value', from: 'columnTable', to: 'Column' },
    // 23

    { id: 'packageTable', type: 'Table' },
    { id: 'packageTableColumnValue', type: 'Column', from: 'packageTable', to: 'String' },
    { id: 'packageTableColumnLocals', type: 'Column', from: 'packageTable', to: 'String', value: { value: 'locals' } },
    { id: 'packageTableValue', type: 'Value', from: 'packageTable', to: 'Package' },
    // 27

    // ===

    // ign
    { id: 'Type', value: { value: 'Type' } },
    { id: 'Package', value: { value: 'Package' } },
    { id: 'Table', value: { value: 'Table' } },
    { id: 'Column', value: { value: 'Column' } },
    { id: 'Value', value: { value: 'Value' } },
    { id: 'Any', value: { value: 'Any' } },
    
    { id: 'Promise', value: { value: 'Promise' } },
    { id: 'Then', value: { value: 'Then' } },
    { id: 'Resolved', value: { value: 'Resolved' } },
    { id: 'Rejected', value: { value: 'Rejected' } },
    // /ign
    
    { id: 'Selector', type: 'Type', value: { value: 'Selector' } },
    // 28
    { id: 'Selection', type: 'Type', value: { value: 'Selection' }, from: 'Selector', to: 'Any' },
    
    { id: 'Rule', type: 'Type', value: { value: 'Rule' } },
    //30
    { id: 'RuleSubject', type: 'Type', value: { value: 'RuleSubject' }, from: 'Rule', to: 'Selector' },
    { id: 'RuleObject', type: 'Type', value: { value: 'RuleObject' }, from: 'Rule', to: 'Selector' },
    { id: 'RuleAction', type: 'Type', value: { value: 'RuleAction' }, from: 'Rule', to: 'Selector' },
    
    { id: 'Contain', type: 'Type', value: { value: 'Contain' }, from: 'Any', to: 'Any' },

    { id: 'containTable', type: 'Table' },
    { id: 'containTableColumn', type: 'Column', from: 'containTable', to: 'String' },
    { id: 'containTableValue', type: 'Value', from: 'containTable', to: 'Contain' },

    { id: 'User', type: 'Type', value: { value: 'User' } },
    { id: 'admin', type: 'User' },

    { id: 'Operation', type: 'Type', value: { value: 'Operation' } },
    // 40

    { id: 'operationTable', type: 'Table' },
    { id: 'operationTableColumn', type: 'Column', from: 'operationTable', to: 'String' },
    { id: 'operationTableValue', type: 'Value', from: 'operationTable', to: 'Operation' },

    { id: 'Insert', type: 'Operation' },
    // 44
    { id: 'Update', type: 'Operation' },
    { id: 'Delete', type: 'Operation' },
    { id: 'Select', type: 'Operation' },

    { id: 'Allow', type: 'Type', value: { value: 'Allow' }, from: 'Type', to: 'Operation' },
    { id: 'Handle', type: 'Type', value: { value: 'Handle' }, from: 'Type', to: 'Operation' },

    { id: 'Tree', type: 'Type', value: { value: 'Tree' } },
    { id: 'TreeIncludeDown', type: 'Type', value: { value: 'TreeIncludeDown' } },
    { id: 'TreeIncludeUp', type: 'Type', value: { value: 'TreeIncludeUp' } },
    { id: 'TreeIncludeNode', type: 'Type', value: { value: 'TreeIncludeNode' } },

    { id: 'userTree', type: 'Tree' },
    { id: 'userTreeContain', type: 'TreeIncludeDown', from: 'userTree', to: 'Contain' },
    { id: 'userTreeAny', type: 'TreeIncludeNode', from: 'userTree', to: 'Any' },
  ],
  errors: [],
  dependencies: {},
  strict: true,
};

export const up = async () => {
  debug('up');
  const packager = new Packager(client);
  const { errors } = await packager.import(corePckg);
  if (errors.length) {
    console.log(errors);
    throw new Error('Import error');
  }
};

export const down = async () => {
  debug('down');
  const mutateResult = await client.mutate(generateSerial({
    actions: [
      generateMutation({
        tableName: LINKS_TABLE_NAME, operation: 'delete',
        variables: { where: {} },
      }),
    ],
    name: 'DELETE_TYPE_TYPE'
  }));
};