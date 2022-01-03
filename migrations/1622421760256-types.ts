import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { generateMutation, generateSerial, insertMutation } from '../imports/gql';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import times from 'lodash/times';
import { time } from 'console';
import { Packager, PackagerPackage } from '../imports/packager';
import { DeepClient } from '../imports/client';

const debug = Debug('deeplinks:migrations:types');

export const TABLE_NAME = 'links';
export const REPLACE_PATTERN_ID = '777777777777';

const rootClient = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const root = new DeepClient({
  apolloClient: rootClient,
});

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

    // TODO NEED_TREE_MP https://github.com/deep-foundation/deeplinks/issues/33
    { id: 'Value', type: 'Type', from: 'Any', to: 'Type' }, // 4

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

    { id: 'Operation', type: 'Type', value: { value: 'Operation' } }, // 24

    { id: 'operationValue', type: 'Value', from: 'Operation', to: 'String' }, // 25

    { id: 'Insert', type: 'Operation' }, // 26
    { id: 'Update', type: 'Operation' }, // 27
    { id: 'Delete', type: 'Operation' }, // 28
    { id: 'Select', type: 'Operation' }, // 29

    { id: 'File', type: 'Type' }, // 30
    { id: 'SyncTextFile', type: 'File' }, // 31
    { id: 'syncTextFileValueRelationTable', type: 'Value', from: 'SyncTextFile', to: 'String' }, // 32

    { id: 'ExecutionProvider', type: 'Type' }, // 33
    { id: 'JSExecutionProvider', type: 'ExecutionProvider' }, // 34

    { id: 'Allow', type: 'Type', value: { value: 'Allow' }, from: 'Type', to: 'Operation' }, // 35
    { id: 'Handler', type: 'Type', value: { value: 'Handler' }, from: 'ExecutionProvider', to: 'Any' }, // 36

    { id: 'Tree', type: 'Type', value: { value: 'Tree' } }, // 37
    // TODO NEED_TREE_MP https://github.com/deep-foundation/deeplinks/issues/33
    { id: 'TreeIncludeDown', type: 'Type', from: 'Tree', to: 'Any', value: { value: 'TreeIncludeDown' } }, // 38
    { id: 'TreeIncludeUp', type: 'Type', from: 'Tree', to: 'Any', value: { value: 'TreeIncludeUp' } }, // 39
    { id: 'TreeIncludeNode', type: 'Type', from: 'Tree', to: 'Any', value: { value: 'TreeIncludeNode' } }, // 40

    { id: 'containTree', type: 'Tree' }, // 41
    { id: 'containTreeContain', type: 'TreeIncludeDown', from: 'containTree', to: 'Contain' }, // 42
    { id: 'containTreeAny', type: 'TreeIncludeNode', from: 'containTree', to: 'Any' }, // 43

    { id: 'PackageNamespace', type: 'Type', value: { value: 'PackageNamespace' } }, // 44

    { id: 'packageNamespaceValue', type: 'Value', from: 'PackageNamespace', to: 'String' }, // 45

    { id: 'PackageActive', type: 'Type', value: { value: 'PackageActive' }, from: 'PackageNamespace', to: 'Package' }, // 46

    { id: 'PackageVersion', type: 'Type', value: { value: 'PackageVersion' }, from: 'PackageNamespace', to: 'Package' }, // 47
    { id: 'packageVersionValue', type: 'Value', from: 'PackageVersion', to: 'String' }, // 48

    { id: 'HandleOperation', type: 'Type', from: 'Type', to: 'Type' }, // 49
    { id: 'HandleInsert', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 50
    { id: 'HandleUpdate', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 51
    { id: 'HandleDelete', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 52

    { id: 'PromiseResult', type: 'Type' }, // 53
    { id: 'promiseResultValueRelationTable', type: 'Value', from: 'PromiseResult', to: 'Object' }, // 54
    { id: 'PromiseReason', type: 'Type' }, // 55

    { id: 'Focus', type: 'Type', value: { value: 'Focus' }, from: 'Any', to: 'Any' }, // 56
    { id: 'focusValue', type: 'Value', from: 'Focus', to: 'Object' }, // 57
    { id: 'Unfocus', type: 'Type', value: { value: 'Unfocus' }, from: 'Focus', to: 'Focus' }, // 58
    { id: 'Query', type: 'Type', value: { value: 'Query' } }, // 59
    { id: 'queryValue', type: 'Value', from: 'Contain', to: 'Object' }, // 60
    { id: 'Fixed', type: 'Type', value: { value: 'Fixed' } }, // 61
    { id: 'fixedValue', type: 'Value', from: 'Fixed', to: 'Object' }, // 62
    { id: 'Space', type: 'Type', value: { value: 'Space' } }, // 63
    { id: 'spaceValue', type: 'Value', from: 'Space', to: 'String' }, // 64

    { id: 'Auth', type: 'Operation' }, // 65

    { id: 'guests', type: 'Any' }, // 66
    { id: 'Join', type: 'Type' }, // 67

    { id: 'joinTree', type: 'Tree' }, // 68
    { id: 'joinTreeContain', type: 'TreeIncludeDown', from: 'joinTree', to: 'Join' }, // 69
    { id: 'joinTreeAny', type: 'TreeIncludeNode', from: 'joinTree', to: 'Any' }, // 70

    {
      id: 'adminContainUser',
      type: 'SyncTextFile',
      value: { value: "console.log('User created');" }
    }, // 71
    { 
      id: 'adminContainerUserHandler',
      from: 'JSExecutionProvider',
      type: 'Handler',
      to: 'adminContainUser'
    }, // 72
    { 
      id: 'helloWorldInsertHandler',
      from: 'Type',
      type: 'HandleInsert',
      to: 'adminContainerUserHandler'
    }, // 73
  ],
  errors: [],
  strict: true,
};

export const up = async () => {
  debug('up');
  const packager = new Packager(root);
  const { errors, packageId, namespaceId } = await packager.import(corePckg);
  if (errors.length) {
    console.log(errors);
    throw new Error('Import error');
  } else {
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'User'),
      out: { data: [
        {
          type_id: await root.id('@deep-foundation/core', 'Contain'),
          to_id: packageId,
        },
        {
          type_id: await root.id('@deep-foundation/core', 'Contain'),
          to_id: namespaceId,
        },
      ] },
    });
  }
};

export const down = async () => {
  debug('down');
  await root.delete({}, { name: 'DELETE_TYPE_TYPE' });
};