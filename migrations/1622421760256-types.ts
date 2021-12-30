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
    { id: 'Type', type: 'Type', from: 'Any', to: 'Any' }, // 1
    { id: 'Package', type: 'Type' }, // 2
    { id: 'Contain', type: 'Type', from: 'Any', to: 'Any' }, // 3
    { id: 'Value', type: 'Type', from: 'Type', to: 'Type' }, // 4

    { id: 'String', type: 'Type' }, // 5
    { id: 'Number', type: 'Type' }, // 6
    { id: 'Object', type: 'Type' }, // 7
    { id: 'Any', type: 'Type' }, // 8
    { id: 'Promise', type: 'Type' }, // 9
    { id: 'Then', type: 'Type', from: 'Any', to: 'Promise' }, // 10
    { id: 'Resolved', type: 'Type', from: 'Promise', to: 'Any' }, // 11
    { id: 'Rejected', type: 'Type', from: 'Promise', to: 'Any' }, // 12

    // ===

    { id: 'typeValue', type: 'Value', from: 'Type', to: 'String' }, // 13
    { id: 'TEEEEMP', type: 'Any' }, // 14
    { id: 'packageValue', type: 'Value', from: 'Package', to: 'String' }, // 15

    // ===

    // ign
    { id: 'Type', value: { value: 'Type' } },
    { id: 'Package', value: { value: 'Package' } },
    { id: 'Contain', value: { value: 'Contain' } },
    { id: 'Value', value: { value: 'Value' } },
    { id: 'Any', value: { value: 'Any' } },
    
    { id: 'Promise', value: { value: 'Promise' } },
    { id: 'Then', value: { value: 'Then' } },
    { id: 'Resolved', value: { value: 'Resolved' } },
    { id: 'Rejected', value: { value: 'Rejected' } },
    // /ign

    { id: 'Selector', type: 'Type', value: { value: 'Selector' } }, // 16
    { id: 'Selection', type: 'Type', value: { value: 'Selection' }, from: 'Selector', to: 'Any' }, // 17
    
    { id: 'Rule', type: 'Type', value: { value: 'Rule' } }, // 18
    { id: 'RuleSubject', type: 'Type', value: { value: 'RuleSubject' }, from: 'Rule', to: 'Selector' }, // 19
    { id: 'RuleObject', type: 'Type', value: { value: 'RuleObject' }, from: 'Rule', to: 'Selector' }, // 20
    { id: 'RuleAction', type: 'Type', value: { value: 'RuleAction' }, from: 'Rule', to: 'Selector' }, // 21

    { id: 'containValue', type: 'Value', from: 'Contain', to: 'String' }, // 22

    { id: 'User', type: 'Type', value: { value: 'User' } }, // 23
    { id: 'admin', type: 'User' }, // 24

    { id: 'Operation', type: 'Type', value: { value: 'Operation' } }, // 25

    { id: 'operationValue', type: 'Value', from: 'Operation', to: 'String' }, // 26

    { id: 'Insert', type: 'Operation' }, // 27
    { id: 'Update', type: 'Operation' }, // 28
    { id: 'Delete', type: 'Operation' }, // 29
    { id: 'Select', type: 'Operation' }, // 30

    { id: 'File', type: 'Type' }, // 31
    { id: 'SyncTextFile', type: 'File' }, // 32
    { id: 'syncTextFileValueRelationTable', type: 'Value', from: 'SyncTextFile', to: 'String' }, // 33

    { id: 'ExecutionProvider', type: 'Type' }, // 34
    { id: 'JSExecutionProvider', type: 'ExecutionProvider' }, // 35

    { id: 'Allow', type: 'Type', value: { value: 'Allow' }, from: 'Type', to: 'Operation' }, // 36
    { id: 'Handler', type: 'Type', value: { value: 'Handler' }, from: 'ExecutionProvider', to: 'Any' }, // 37

    { id: 'Tree', type: 'Type', value: { value: 'Tree' } }, // 38
    { id: 'TreeIncludeDown', type: 'Type', value: { value: 'TreeIncludeDown' } }, // 39
    { id: 'TreeIncludeUp', type: 'Type', value: { value: 'TreeIncludeUp' } }, // 40
    { id: 'TreeIncludeNode', type: 'Type', value: { value: 'TreeIncludeNode' } }, // 41

    { id: 'userTree', type: 'Tree' }, // 42
    { id: 'userTreeContain', type: 'TreeIncludeDown', from: 'userTree', to: 'Contain' }, // 43
    { id: 'userTreeAny', type: 'TreeIncludeNode', from: 'userTree', to: 'Any' }, // 44

    { id: 'PackageNamespace', type: 'Type', value: { value: 'PackageNamespace' } }, // 45

    { id: 'packageNamespaceValue', type: 'Value', from: 'PackageNamespace', to: 'String' }, // 46

    { id: 'PackageActive', type: 'Type', value: { value: 'PackageActive' }, from: 'PackageNamespace', to: 'Package' }, // 47

    { id: 'PackageVersion', type: 'Type', value: { value: 'PackageVersion' }, from: 'PackageNamespace', to: 'Package' }, // 48
    { id: 'packageVersionValue', type: 'Value', from: 'PackageVersion', to: 'String' }, // 49

    { id: 'HandleOperation', type: 'Type' }, // 50
    { id: 'HandleInsert', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 51
    { id: 'HandleUpdate', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 52
    { id: 'HandleDelete', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 53

    { id: 'PromiseResult', type: 'Type' }, // 54
    { id: 'promiseResultValueRelationTable', type: 'Value', from: 'PromiseResult', to: 'Object' }, // 55
    { id: 'PromiseReason', type: 'Type', from: 'Any', to: 'Any' }, // 56

    { id: 'Focus', type: 'Type', value: { value: 'Focus' }, from: 'Any', to: 'Any' }, // 57
    { id: 'focusValue', type: 'Value', from: 'Focus', to: 'Object' }, // 58
    { id: 'Unfocus', type: 'Type', value: { value: 'Unfocus' }, from: 'Focus', to: 'Focus' }, // 59
    { id: 'Query', type: 'Type', value: { value: 'Query' } }, // 60
    { id: 'queryValue', type: 'Value', from: 'Contain', to: 'Object' }, // 61
    { id: 'Fixed', type: 'Type', value: { value: 'Fixed' } }, // 62
    { id: 'fixedValue', type: 'Value', from: 'Fixed', to: 'Object' }, // 63
    { id: 'Space', type: 'Type', value: { value: 'Space' } }, // 64
    { id: 'spaceValue', type: 'Value', from: 'Space', to: 'String' }, // 65

    { id: 'Auth', type: 'Operation' }, // 66

    { id: 'guests', type: 'Any' }, // 67
    { id: 'Join', type: 'Type' }, // 68
    { 
      id: 'adminContainUser',
      type: 'SyncTextFile',
      value: { value: "console.log('User created');" }
    }, // 69
    { 
      id: 'adminContainerUserHandler',
      from: 'JSExecutionProvider',
      type: 'Handler',
      to: 'adminContainUser'
    }, // 70
    { 
      id: 'helloWorldInsertHandler',
      from: 'Type',
      type: 'HandleInsert',
      to: 'adminContainerUserHandler'
    }, // 71
  ],
  errors: [],
  strict: true,
};

export const up = async () => {
  debug('up');
  const packager = new Packager(client);
  const { errors } = await packager.import(corePckg);
  if (errors.length) {
    console.log(JSON.stringify(errors, null, 2));
    throw new Error('Import error');
  }
};

export const down = async () => {
  debug('down');
  await client.delete({}, { name: 'DELETE_TYPE_TYPE' });
};