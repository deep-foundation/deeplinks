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
    { id: 'Contain', type: 'Type', from: 'Any', to: 'Any' }, // 3
    { id: 'Value', type: 'Type', from: 'Type', to: 'Type' }, // 4

    { id: 'String', type: 'Type' }, // 5
    { id: 'Number', type: 'Type' }, // 6
    { id: 'JSON', type: 'Type' }, // 7
    { id: 'Any', type: 'Type' }, // 8
    { id: 'Promise', type: 'Type' }, // 9
    { id: 'Then', type: 'Type', from: 'Any', to: 'Promise' }, // 10
    { id: 'Resolved', type: 'Type', from: 'Promise', to: 'Any' }, // 11
    { id: 'Rejected', type: 'Type', from: 'Promise', to: 'Any' }, // 12

    // ===

    { id: 'typeValue', type: 'Value', from: 'Type', to: 'String' }, // 13
    { id: 'columnValue', type: 'Value', from: 'Column', to: 'String' }, // 14
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

    { id: 'containValue', type: 'Value', from: 'Contain', to: 'String' }, // 24

    { id: 'User', type: 'Type', value: { value: 'User' } }, // 25
    { id: 'admin', type: 'User' }, // 26

    { id: 'Operation', type: 'Type', value: { value: 'Operation' } }, // 27

    { id: 'operationValue', type: 'Value', from: 'Operation', to: 'String' }, // 28

    { id: 'Insert', type: 'Operation' }, // 29
    { id: 'Update', type: 'Operation' }, // 30
    { id: 'Delete', type: 'Operation' }, // 31
    { id: 'Select', type: 'Operation' }, // 32

    { id: 'Allow', type: 'Type', value: { value: 'Allow' }, from: 'Type', to: 'Operation' }, // 33
    { id: 'Handler', type: 'Type', value: { value: 'Handler' }, from: 'Type', to: 'Operation' }, // 34

    { id: 'Tree', type: 'Type', value: { value: 'Tree' } }, // 35
    { id: 'TreeIncludeDown', type: 'Type', value: { value: 'TreeIncludeDown' } }, // 36
    { id: 'TreeIncludeUp', type: 'Type', value: { value: 'TreeIncludeUp' } }, // 37
    { id: 'TreeIncludeNode', type: 'Type', value: { value: 'TreeIncludeNode' } }, // 38

    { id: 'userTree', type: 'Tree' }, // 39
    { id: 'userTreeContain', type: 'TreeIncludeDown', from: 'userTree', to: 'Contain' }, // 40
    { id: 'userTreeAny', type: 'TreeIncludeNode', from: 'userTree', to: 'Any' }, // 41

    { id: 'PackageNamespace', type: 'Type', value: { value: 'PackageNamespace' } }, // 42

    { id: 'packageNamespaceValue', type: 'Value', from: 'PackageNamespace', to: 'String' }, // 43

    { id: 'PackageActive', type: 'Type', value: { value: 'PackageActive' }, from: 'PackageNamespace', to: 'Package' }, // 44

    { id: 'PackageVersion', type: 'Type', value: { value: 'PackageVersion' }, from: 'PackageNamespace', to: 'Package' }, // 45
    { id: 'packageVersionValue', type: 'Value', from: 'PackageVersion', to: 'String' }, // 46

    { id: 'SyncTextFile', type: 'Type' }, // 47
    { id: 'syncTextFileValueRelationTable', type: 'Value', from: 'SyncTextFile', to: 'String' }, // 48

    { id: 'JSExecutionProvider', type: 'Type' }, // 49

    { id: 'HandleInsert', type: 'Type' }, // 50
    { id: 'HandleUpdate', type: 'Type' }, // 51
    { id: 'HandleCreate', type: 'Type' }, // 52

    { 
      id: 'helloWorldJsFile',
      type: 'SyncTextFile',
      value: { value: "console.log('hello from insert handler');" }
    }, // 53
    { 
      id: 'helloWorldHandler',
      from: 'JSExecutionProvider',
      type: 'Handler',
      to: 'helloWorldJsFile'
    }, // 54
    { 
      id: 'helloWorldInsertHandler',
      from: 'Type',
      type: 'HandleInsert',
      to: 'helloWorldHandler'
    }, // 55
  ],
  errors: [],
  strict: true,
};

export const up = async () => {
  debug('up');
  const packager = new Packager(client);
  const { errors } = await packager.import(corePckg);
  if (errors.length) {
    console.log(errors[0]?.graphQLErrors[0]?.message);
    console.log(errors[0]?.graphQLErrors[0]?.extensions?.internal);
    console.log(errors[0]?.graphQLErrors[0]?.extensions?.internal?.request);
    throw new Error('Import error');
  }
};

export const down = async () => {
  debug('down');
  await client.delete({}, { name: 'DELETE_TYPE_TYPE' });
};