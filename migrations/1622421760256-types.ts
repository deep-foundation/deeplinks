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
    { id: 'packageValue', type: 'Value', from: 'Package', to: 'String' }, // 14

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

    { id: 'Selector', type: 'Type', value: { value: 'Selector' } }, // 15
    { id: 'Selection', type: 'Type', value: { value: 'Selection' }, from: 'Selector', to: 'Any' }, // 16
    
    { id: 'Rule', type: 'Type', value: { value: 'Rule' } }, // 17
    { id: 'RuleSubject', type: 'Type', value: { value: 'RuleSubject' }, from: 'Rule', to: 'Selector' }, // 18
    { id: 'RuleObject', type: 'Type', value: { value: 'RuleObject' }, from: 'Rule', to: 'Selector' }, // 19
    { id: 'RuleAction', type: 'Type', value: { value: 'RuleAction' }, from: 'Rule', to: 'Selector' }, // 20

    { id: 'containValue', type: 'Value', from: 'Contain', to: 'String' }, // 21

    { id: 'User', type: 'Type', value: { value: 'User' } }, // 22

    { id: 'Operation', type: 'Type', value: { value: 'Operation' } }, // 23

    { id: 'operationValue', type: 'Value', from: 'Operation', to: 'String' }, // 24

    { id: 'Insert', type: 'Operation' }, // 25
    { id: 'Update', type: 'Operation' }, // 26
    { id: 'Delete', type: 'Operation' }, // 27
    { id: 'Select', type: 'Operation' }, // 28

    { id: 'File', type: 'Type' }, // 29
    { id: 'SyncTextFile', type: 'File' }, // 30
    { id: 'syncTextFileValueRelationTable', type: 'Value', from: 'SyncTextFile', to: 'String' }, // 31

    { id: 'ExecutionProvider', type: 'Type' }, // 32
    { id: 'JSExecutionProvider', type: 'ExecutionProvider' }, // 33

    { id: 'Allow', type: 'Type', value: { value: 'Allow' }, from: 'Type', to: 'Operation' }, // 34
    { id: 'Handler', type: 'Type', value: { value: 'Handler' }, from: 'ExecutionProvider', to: 'Any' }, // 35

    { id: 'Tree', type: 'Type', value: { value: 'Tree' } }, // 36
    // TODO NEED_TREE_MP https://github.com/deep-foundation/deeplinks/issues/33
    { id: 'TreeIncludeDown', type: 'Type', from: 'Tree', to: 'Any', value: { value: 'TreeIncludeDown' } }, // 37
    { id: 'TreeIncludeUp', type: 'Type', from: 'Tree', to: 'Any', value: { value: 'TreeIncludeUp' } }, // 38
    { id: 'TreeIncludeNode', type: 'Type', from: 'Tree', to: 'Any', value: { value: 'TreeIncludeNode' } }, // 39

    { id: 'containTree', type: 'Tree' }, // 40
    { id: 'containTreeContain', type: 'TreeIncludeDown', from: 'containTree', to: 'Contain' }, // 41
    { id: 'containTreeAny', type: 'TreeIncludeNode', from: 'containTree', to: 'Any' }, // 42

    { id: 'PackageNamespace', type: 'Type', value: { value: 'PackageNamespace' } }, // 43

    { id: 'packageNamespaceValue', type: 'Value', from: 'PackageNamespace', to: 'String' }, // 44

    { id: 'PackageActive', type: 'Type', value: { value: 'PackageActive' }, from: 'PackageNamespace', to: 'Package' }, // 45

    { id: 'PackageVersion', type: 'Type', value: { value: 'PackageVersion' }, from: 'PackageNamespace', to: 'Package' }, // 46
    { id: 'packageVersionValue', type: 'Value', from: 'PackageVersion', to: 'String' }, // 47

    { id: 'HandleOperation', type: 'Type', from: 'Type', to: 'Type' }, // 48
    { id: 'HandleInsert', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 49
    { id: 'HandleUpdate', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 50
    { id: 'HandleDelete', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 51

    { id: 'PromiseResult', type: 'Type' }, // 52
    { id: 'promiseResultValueRelationTable', type: 'Value', from: 'PromiseResult', to: 'Object' }, // 53
    { id: 'PromiseReason', type: 'Type', from: 'Any', to: 'Any' }, // 54

    { id: 'Focus', type: 'Type', value: { value: 'Focus' }, from: 'Any', to: 'Any' }, // 55
    { id: 'focusValue', type: 'Value', from: 'Focus', to: 'Object' }, // 56
    { id: 'Unfocus', type: 'Type', value: { value: 'Unfocus' }, from: 'Focus', to: 'Focus' }, // 57
    { id: 'Query', type: 'Type', value: { value: 'Query' } }, // 58
    { id: 'queryValue', type: 'Value', from: 'Contain', to: 'Object' }, // 59
    { id: 'Fixed', type: 'Type', value: { value: 'Fixed' } }, // 60
    { id: 'fixedValue', type: 'Value', from: 'Fixed', to: 'Object' }, // 61
    { id: 'Space', type: 'Type', value: { value: 'Space' } }, // 62
    { id: 'spaceValue', type: 'Value', from: 'Space', to: 'String' }, // 63

    { id: 'Auth', type: 'Operation' }, // 64

    { id: 'guests', type: 'Any' }, // 65
    { id: 'Join', type: 'Type' }, // 66

    { id: 'joinTree', type: 'Tree' }, // 67
    { id: 'joinTreeContain', type: 'TreeIncludeDown', from: 'joinTree', to: 'Join' }, // 68
    { id: 'joinTreeAny', type: 'TreeIncludeNode', from: 'joinTree', to: 'Any' }, // 69

    {
      id: 'adminContainUser',
      type: 'SyncTextFile',
      value: { value: "console.log('User created');" }
    }, // 70
    { 
      id: 'adminContainerUserHandler',
      from: 'JSExecutionProvider',
      type: 'Handler',
      to: 'adminContainUser'
    }, // 71
    { 
      id: 'helloWorldInsertHandler',
      from: 'Type',
      type: 'HandleInsert',
      to: 'adminContainerUserHandler'
    }, // 72
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