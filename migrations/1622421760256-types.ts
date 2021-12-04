import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { generateMutation, generateSerial, insertMutation } from '../imports/gql';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import times from 'lodash/times';
import { time } from 'console';
import { Packager, PackagerPackage } from '../imports/packager';
import { DeepClient } from '../imports/client';

const debug = Debug('deeplinks:migrations:types');

const apolloClient = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const client = new DeepClient({ apolloClient });

const corePckg: PackagerPackage = {
  package: {
    name: '@deep-foundation/core',
    version: '0.0.0',
    uri: 'deep-foundation/core',
    type: 'git',
  },
  data: [
    // 0

    { id: 'Type', type: 'Type' },
    // 1
    { id: 'Package', type: 'Type' },
    { id: 'Table', type: 'Type' },
    { id: 'Column', type: 'Type', from: 'Table', to: 'Type' },
    { id: 'Value', type: 'Type', from: 'Table', to: 'Type' },

    { id: 'String', type: 'Type' },
    { id: 'Number', type: 'Type' },
    { id: 'JSON', type: 'Type' },
    { id: 'Any', type: 'Type' },
    // 9
    { id: 'Promise', type: 'Type' },
    { id: 'Then', type: 'Type', from: 'Any', to: 'Promise' },
    { id: 'Resolved', type: 'Type', from: 'Promise', to: 'Any' },
    { id: 'Rejected', type: 'Type', from: 'Promise', to: 'Any' },

    // ===

    { id: 'typeTable', type: 'Table' },
    // 14
    { id: 'typeTableColumn', type: 'Column', from: 'typeTable', to: 'String' },
    { id: 'typeTableValue', type: 'Value', from: 'typeTable', to: 'Type' },
    // 16

    { id: 'tableTable', type: 'Table' },
    { id: 'tableTableColumn', type: 'Column', from: 'tableTable', to: 'String' },
    { id: 'tableTableValue', type: 'Value', from: 'tableTable', to: 'Table' },
    // 19

    { id: 'columnTable', type: 'Table' },
    { id: 'columnTableColumn', type: 'Column', from: 'columnTable', to: 'String' },
    { id: 'columnTableValue', type: 'Value', from: 'columnTable', to: 'Column' },
    // 22

    { id: 'packageTable', type: 'Table' },
    { id: 'packageTableColumnValue', type: 'Column', from: 'packageTable', to: 'String' },
    { id: 'packageTableColumnIdentifier', type: 'Column', from: 'packageTable', to: 'JSON', value: { value: 'identifier' } },
    { id: 'packageTableValue', type: 'Value', from: 'packageTable', to: 'Package' },
    // 26

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
    // 27
    { id: 'Selection', type: 'Type', value: { value: 'Selection' }, from: 'Selector', to: 'Any' },
    
    { id: 'Rule', type: 'Type', value: { value: 'Rule' } },
    // 29
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
    // 39

    { id: 'operationTable', type: 'Table' },
    { id: 'operationTableColumn', type: 'Column', from: 'operationTable', to: 'String' },
    { id: 'operationTableValue', type: 'Value', from: 'operationTable', to: 'Operation' },

    { id: 'Insert', type: 'Operation' },
    // 43
    { id: 'Update', type: 'Operation' }, // 44
    { id: 'Delete', type: 'Operation' }, // 45
    { id: 'Select', type: 'Operation' }, // 46

    { id: 'Allow', type: 'Type', value: { value: 'Allow' }, from: 'Type', to: 'Operation' }, // 47
    { id: 'Handler', type: 'Type', value: { value: 'Handler' }, from: 'Type', to: 'Operation' }, // 48

    { id: 'Tree', type: 'Type', value: { value: 'Tree' } },
    { id: 'TreeIncludeDown', type: 'Type', value: { value: 'TreeIncludeDown' } },
    // 50
    { id: 'TreeIncludeUp', type: 'Type', value: { value: 'TreeIncludeUp' } },
    { id: 'TreeIncludeNode', type: 'Type', value: { value: 'TreeIncludeNode' } },

    { id: 'userTree', type: 'Tree' },
    { id: 'userTreeContain', type: 'TreeIncludeDown', from: 'userTree', to: 'Contain' },
    { id: 'userTreeAny', type: 'TreeIncludeNode', from: 'userTree', to: 'Any' },
    // 55
    { id: 'PackageNamespace', type: 'Type', value: { value: 'PackageNamespace' } },

    { id: 'packageNamespaceTable', type: 'Table' },
    { id: 'packageNamespaceTableColumnValue', type: 'Column', from: 'packageNamespaceTable', to: 'String' },
    { id: 'packageNamespaceTableValue', type: 'Value', from: 'packageNamespaceTable', to: 'PackageNamespace' },
    // 59

    { id: 'PackageActive', type: 'Type', value: { value: 'PackageActive' }, from: 'PackageNamespace', to: 'Package' }, // 60

    { id: 'PackageVersion', type: 'Type', value: { value: 'PackageVersion' }, from: 'PackageNamespace', to: 'Package' }, // 61

    { id: 'packageVersionTable', type: 'Table' }, // 62
    { id: 'packageVersionTableColumnValue', type: 'Column', from: 'packageVersionTable', to: 'String' }, // 63
    { id: 'packageVersionTableValue', type: 'Value', from: 'packageVersionTable', to: 'PackageVersion' }, // 64

    { id: 'SyncTextFile', type: 'Type' }, // 65

    { id: 'syncTextFileTable', type: 'Table' }, // 66
    { id: 'syncTextFileTableColumnValue', type: 'Column', from: 'syncTextFileTable', to: 'String' }, // 67
    { id: 'syncTextFileValueRelationTable', type: 'Value', from: 'syncTextFileTable', to: 'SyncTextFile' }, // 68

    { id: 'JSExecutionProvider', type: 'Type' }, // 69

    { id: 'HandleInsert', type: 'Table' }, // 70
    { id: 'HandleUpdate', type: 'Table' }, // 71
    { id: 'HandleCreate', type: 'Table' }, // 72

    { 
      id: 'helloWorldJsFile',
      type: 'SyncTextFile',
      value: { value: "console.log('hello from insert handler');" }
    }, // 73
    { 
      id: 'helloWorldHandler',
      from: 'JSExecutionProvider',
      type: 'Handler',
      to: 'helloWorldJsFile'
    }, // 74
    { 
      id: 'helloWorldInsertHandler',
      from: 'Type',
      type: 'HandleInsert',
      to: 'helloWorldHandler'
    } // 75

  ],
  errors: [],
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
  await client.delete({}, { name: 'DELETE_TYPE_TYPE' });
};