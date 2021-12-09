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
    { id: 'Type', type: 'Type' }, // 1
    { id: 'Package', type: 'Type' }, // 2
    { id: 'Table', type: 'Type' }, // 3
    { id: 'Column', type: 'Type', from: 'Table', to: 'Type' }, // 4
    { id: 'Value', type: 'Type', from: 'Table', to: 'Type' }, // 5

    { id: 'String', type: 'Type' }, // 6
    { id: 'Number', type: 'Type' }, // 7
    { id: 'JSON', type: 'Type' }, // 8
    { id: 'Any', type: 'Type' }, // 9
    { id: 'Promise', type: 'Type' }, // 10
    { id: 'Then', type: 'Type', from: 'Any', to: 'Promise' }, // 11
    { id: 'Resolved', type: 'Type', from: 'Promise', to: 'Any' }, // 12
    { id: 'Rejected', type: 'Type', from: 'Promise', to: 'Any' }, // 13

    // ===

    { id: 'typeTable', type: 'Table' }, // 14
    { id: 'typeTableColumn', type: 'Column', from: 'typeTable', to: 'String' }, // 15
    { id: 'typeTableValue', type: 'Value', from: 'typeTable', to: 'Type' }, // 16

    { id: 'tableTable', type: 'Table' }, // 17
    { id: 'tableTableColumn', type: 'Column', from: 'tableTable', to: 'String' }, // 18
    { id: 'tableTableValue', type: 'Value', from: 'tableTable', to: 'Table' }, // 19

    { id: 'columnTable', type: 'Table' }, // 20
    { id: 'columnTableColumn', type: 'Column', from: 'columnTable', to: 'String' }, // 21
    { id: 'columnTableValue', type: 'Value', from: 'columnTable', to: 'Column' }, // 22

    { id: 'packageTable', type: 'Table' }, // 23
    { id: 'packageTableColumnValue', type: 'Column', from: 'packageTable', to: 'String' }, // 24
    // { id: 'packageTableColumnIdentifier', type: 'Column', from: 'packageTable', to: 'JSON', value: { value: 'identifier' } },
    { id: 'packageTableValue', type: 'Value', from: 'packageTable', to: 'Package' },
    // 25

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

    { id: 'Selector', type: 'Type', value: { value: 'Selector' } }, // 26
    { id: 'Selection', type: 'Type', value: { value: 'Selection' }, from: 'Selector', to: 'Any' }, // 27
    
    { id: 'Rule', type: 'Type', value: { value: 'Rule' } }, // 28
    { id: 'RuleSubject', type: 'Type', value: { value: 'RuleSubject' }, from: 'Rule', to: 'Selector' }, // 29
    { id: 'RuleObject', type: 'Type', value: { value: 'RuleObject' }, from: 'Rule', to: 'Selector' }, // 30
    { id: 'RuleAction', type: 'Type', value: { value: 'RuleAction' }, from: 'Rule', to: 'Selector' }, // 31
    
    { id: 'Contain', type: 'Type', value: { value: 'Contain' }, from: 'Any', to: 'Any' }, // 32

    { id: 'containTable', type: 'Table' }, // 33
    { id: 'containTableColumn', type: 'Column', from: 'containTable', to: 'String' }, // 34
    { id: 'containTableValue', type: 'Value', from: 'containTable', to: 'Contain' }, // 35

    { id: 'User', type: 'Type', value: { value: 'User' } }, // 36
    { id: 'admin', type: 'User' }, // 37

    { id: 'Operation', type: 'Type', value: { value: 'Operation' } }, // 38

    { id: 'operationTable', type: 'Table' }, // 39
    { id: 'operationTableColumn', type: 'Column', from: 'operationTable', to: 'String' }, // 40
    { id: 'operationTableValue', type: 'Value', from: 'operationTable', to: 'Operation' }, // 41

    { id: 'Insert', type: 'Operation' }, // 42
    { id: 'Update', type: 'Operation' }, // 43
    { id: 'Delete', type: 'Operation' }, // 44
    { id: 'Select', type: 'Operation' }, // 45

    { id: 'Allow', type: 'Type', value: { value: 'Allow' }, from: 'Type', to: 'Operation' }, // 46
    { id: 'Handler', type: 'Type', value: { value: 'Handler' }, from: 'Type', to: 'Operation' }, // 47

    { id: 'Tree', type: 'Type', value: { value: 'Tree' } }, // 48
    { id: 'TreeIncludeDown', type: 'Type', value: { value: 'TreeIncludeDown' } }, // 49
    { id: 'TreeIncludeUp', type: 'Type', value: { value: 'TreeIncludeUp' } }, // 50
    { id: 'TreeIncludeNode', type: 'Type', value: { value: 'TreeIncludeNode' } }, // 51

    { id: 'userTree', type: 'Tree' }, // 52
    { id: 'userTreeContain', type: 'TreeIncludeDown', from: 'userTree', to: 'Contain' }, // 53
    { id: 'userTreeAny', type: 'TreeIncludeNode', from: 'userTree', to: 'Any' }, // 54

    { id: 'PackageNamespace', type: 'Type', value: { value: 'PackageNamespace' } }, // 55

    { id: 'packageNamespaceTable', type: 'Table' }, // 56
    { id: 'packageNamespaceTableColumnValue', type: 'Column', from: 'packageNamespaceTable', to: 'String' }, // 57
    { id: 'packageNamespaceTableValue', type: 'Value', from: 'packageNamespaceTable', to: 'PackageNamespace' }, // 58

    { id: 'PackageActive', type: 'Type', value: { value: 'PackageActive' }, from: 'PackageNamespace', to: 'Package' }, // 59

    { id: 'PackageVersion', type: 'Type', value: { value: 'PackageVersion' }, from: 'PackageNamespace', to: 'Package' }, // 60

    { id: 'packageVersionTable', type: 'Table' }, // 61
    { id: 'packageVersionTableColumnValue', type: 'Column', from: 'packageVersionTable', to: 'String' }, // 62
    { id: 'packageVersionTableValue', type: 'Value', from: 'packageVersionTable', to: 'PackageVersion' }, // 63

    { id: 'SyncTextFile', type: 'Type' }, // 64

    { id: 'syncTextFileTable', type: 'Table' }, // 65
    { id: 'syncTextFileTableColumnValue', type: 'Column', from: 'syncTextFileTable', to: 'String' }, // 66
    { id: 'syncTextFileValueRelationTable', type: 'Value', from: 'syncTextFileTable', to: 'SyncTextFile' }, // 67

    { id: 'JSExecutionProvider', type: 'Type' }, // 68

    { id: 'HandleInsert', type: 'Type' }, // 69
    { id: 'HandleUpdate', type: 'Type' }, // 70
    { id: 'HandleDelete', type: 'Type' }, // 71

    { 
      id: 'helloWorldJsFile',
      type: 'SyncTextFile',
      value: { value: "console.log('hello from insert handler'); return 123;" }
    }, // 72
    { 
      id: 'helloWorldHandler',
      from: 'JSExecutionProvider',
      type: 'Handler',
      to: 'helloWorldJsFile'
    }, // 73
    { 
      id: 'helloWorldInsertHandler',
      from: 'Type',
      type: 'HandleInsert',
      to: 'helloWorldHandler'
    }, // 74
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