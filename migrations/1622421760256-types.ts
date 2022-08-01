import { generateApolloClient } from '@deep-foundation/hasura/client';
import Debug from 'debug';
import { generateMutation, generateSerial, insertMutation } from '../imports/gql';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import times from 'lodash/times';
import { time } from 'console';
import { Packager, Package } from '../imports/packager';
import { DeepClient } from '../imports/client';

const debug = Debug('deeplinks:migrations:types');
const log = debug.extend('log');
const error = debug.extend('error');

const rootClient = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const root = new DeepClient({
  apolloClient: rootClient,
});

const corePckg: Package = {
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
    { id: 'Type' },
    { id: 'Package' },
    { id: 'Contain' },
    { id: 'Value' },
    { id: 'Any' },
    
    { id: 'Promise' },
    { id: 'Then' },
    { id: 'Resolved' },
    { id: 'Rejected' },
    // /ign

    { id: 'Selector', type: 'Type' }, // 15
    { id: 'SelectorInclude', type: 'Type', from: 'Selector', to: 'Any' }, // 16

    { id: 'Rule', type: 'Type' }, // 17
    { id: 'RuleSubject', type: 'Type', from: 'Rule', to: 'Selector' }, // 18
    { id: 'RuleObject', type: 'Type', from: 'Rule', to: 'Selector' }, // 19
    { id: 'RuleAction', type: 'Type', from: 'Rule', to: 'Selector' }, // 20

    { id: 'containValue', type: 'Value', from: 'Contain', to: 'String' }, // 21

    { id: 'User', type: 'Type' }, // 22

    { id: 'Operation', type: 'Type' }, // 23

    { id: 'operationValue', type: 'Value', from: 'Operation', to: 'String' }, // 24

    { id: 'AllowInsert', type: 'Operation' }, // 25
    { id: 'AllowUpdate', type: 'Operation' }, // 26
    { id: 'AllowDelete', type: 'Operation' }, // 27
    { id: 'AllowSelect', type: 'Operation' }, // 28

    { id: 'File', type: 'Type' }, // 29
    { id: 'SyncTextFile', type: 'File' }, // 30
    { id: 'syncTextFileValue', type: 'Value', from: 'SyncTextFile', to: 'String' }, // 31

    { id: 'ExecutionProvider', type: 'Type' }, // 32
    { id: 'JSExecutionProvider', type: 'ExecutionProvider' }, // 33

    { id: 'TreeInclude', type: 'Type', from: 'Type', to: 'Any' }, // 34
    { id: 'Handler', type: 'Type', from: 'Supports', to: 'Any' }, // 35

    { id: 'Tree', type: 'Type' }, // 36

    { id: 'TreeIncludeDown', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 37
    { id: 'TreeIncludeUp', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 38
    { id: 'TreeIncludeNode', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 39

    { id: 'containTree', type: 'Tree' }, // 40
    { id: 'containTreeContain', type: 'TreeIncludeDown', from: 'containTree', to: 'Contain' }, // 41
    { id: 'containTreeAny', type: 'TreeIncludeNode', from: 'containTree', to: 'Any' }, // 42

    { id: 'PackageNamespace', type: 'Type' }, // 43

    { id: 'packageNamespaceValue', type: 'Value', from: 'PackageNamespace', to: 'String' }, // 44

    { id: 'PackageActive', type: 'Type', from: 'PackageNamespace', to: 'Package' }, // 45

    { id: 'PackageVersion', type: 'Type', from: 'PackageNamespace', to: 'Package' }, // 46
    { id: 'packageVersionValue', type: 'Value', from: 'PackageVersion', to: 'String' }, // 47

    { id: 'HandleOperation', type: 'Type', from: 'Type', to: 'Type' }, // 48
    { id: 'HandleInsert', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 49
    { id: 'HandleUpdate', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 50
    { id: 'HandleDelete', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 51

    { id: 'PromiseResult', type: 'Type' }, // 52
    { id: 'promiseResultValueRelationTable', type: 'Value', from: 'PromiseResult', to: 'Object' }, // 53
    { id: 'PromiseReason', type: 'Type', from: 'Any', to: 'Any' }, // 54

    { id: 'Focus', type: 'Type', from: 'Any', to: 'Any' }, // 55
    { id: 'focusValue', type: 'Value', from: 'Focus', to: 'Object' }, // 56
    { id: 'AsyncFile', type: 'File' }, // 57
    { id: 'Query', type: 'Type' }, // 58
    { id: 'queryValue', type: 'Value', from: 'Query', to: 'Object' }, // 59
    { id: 'Fixed', type: 'Type' }, // 60 // TODO
    { id: 'fixedValue', type: 'Value', from: 'Fixed', to: 'Object' }, // 61 // TODO
    { id: 'Space', type: 'Type' }, // 62
    { id: 'spaceValue', type: 'Value', from: 'Space', to: 'String' }, // 63

    { id: 'AllowLogin', type: 'Operation' }, // 64

    { id: 'guests', type: 'Any' }, // 65
    { id: 'Join', type: 'Type', from: 'Any', to: 'Any' }, // 66

    { id: 'joinTree', type: 'Tree' }, // 67
    { id: 'joinTreeJoin', type: 'TreeIncludeUp', from: 'joinTree', to: 'Join' }, // 68
    { id: 'joinTreeAny', type: 'TreeIncludeNode', from: 'joinTree', to: 'Any' }, // 69

    { id: 'SelectorTree', type: 'Type', from: 'Any', to: 'Tree' }, // 70

    { id: 'AllowAdmin', type: 'Operation' }, // 71
    // { id: 'system', type: 'Package' }, // 71

    { id: 'SelectorExclude', type: 'Type', from: 'Selector', to: 'Any' }, // 72

    { id: 'BoolExp', type: 'Type' }, // 73
    { id: 'boolExpValue', type: 'Value', from: 'BoolExp', to: 'Object' }, // 74

    { id: 'SelectorFilter', type: 'Type', from: 'Selector', to: 'BoolExp' }, // 75

    { id: 'HandleSchedule', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 76

    { id: 'Schedule', type: 'Type' }, // 77

    { id: 'scheduleValue', type: 'Value', from: 'Schedule', to: 'String' }, // 78

    { id: 'Router', type: 'Type', value: { value: 'Router' } }, // 79

    { id: 'IsolationProvider', type: 'Type' }, // 80
    { id: 'DockerIsolationProvider', type: 'IsolationProvider' }, // 81

    { id: 'dockerIsolationProviderValue', type: 'Value', from: 'DockerIsolationProvider', to: 'String' }, // 82
    { id: 'JSDockerIsolationProvider', type: 'DockerIsolationProvider', value: { value: 'deepf/js-docker-isolation-provider:main' } }, // 83
    { id: 'Supports', type: 'Type', from: 'Any', to: 'Any' }, // 84
    { id: 'dockerSupportsJs', type: 'Supports', from: 'JSDockerIsolationProvider', to: 'JSExecutionProvider' }, // 85

    { id: 'PackagerInstall', type: 'Type', from: 'Any', to: 'PackagerQuery' }, // 86
    { id: 'PackagerPublish', type: 'Type', from: 'Package', to: 'PackagerQuery' }, // 87

    { id: 'Active', type: 'Type', from: 'Any', to: 'Any' }, // 88

    { id: 'AllowPackagerInstall', type: 'Operation' }, // 89
    { id: 'AllowPackagerPublish', type: 'Operation' }, // 90

    { id: 'PromiseOut', type: 'Type', from: 'Promise', to: 'Any' }, // 91
    { id: 'promiseOutValue', type: 'Value', from: 'PromiseOut', to: 'String' }, // 92

    { id: 'PackagerQuery', type: 'Type' }, // 93
    { id: 'packagerQueryValue', type: 'Value', from: 'PackagerQuery', to: 'String' }, // 94

    { id: 'Port', type: 'Type', value: { value: 'Port' } }, // 95
    { id: 'portValue', type: 'Value', from: 'Port', to: 'Number' }, // 96
    { id: 'HandlePort', type: 'HandleOperation', from: 'Port', to: 'Any' }, // 97

    { id: 'PackagerInstalled', type: 'Type', from: 'Package', to: 'PackagerQuery' }, // 98 // #TODO
    { id: 'PackagerPublished', type: 'Type', from: 'Package', to: 'PackagerQuery' }, // 99 // #TODO

    // Route
    { id: 'Route', type: 'Type' }, // 100
    // RouterListening from Router to Port
    { id: 'RouterListening', type: 'Type', from: 'Router', to: 'Port' }, // 101
    // RouterStringUse from Route to Router
    { id: 'RouterStringUse', type: 'Type', from: 'Route', to: 'Router' }, // 102
    // RouterStringUse value string
    { id: 'routerStringUseValue', type: 'Value', from: 'RouterStringUse', to: 'String' }, // 103
    // HandleRoute from Route to Handler
    { id: 'HandleRoute', type: 'HandleOperation', from: 'Route', to: 'Handler' }, // 104
    // routeTree
    { id: 'routeTree', type: 'Tree' }, // 105
    // routeTreePort
    { id: 'routeTreePort', type: 'TreeIncludeNode', from: 'routeTree', to: 'Port' }, // 106
    // routeTreeRouter
    { id: 'routeTreeRouter', type: 'TreeIncludeNode', from: 'routeTree', to: 'Router' }, // 107
    // routeTreeRoute
    { id: 'routeTreeRoute', type: 'TreeIncludeNode', from: 'routeTree', to: 'Route' }, // 108
    // routeTreeHandler
    { id: 'routeTreeHandler', type: 'TreeIncludeNode', from: 'routeTree', to: 'Handler' }, // 109
    // routeTreeRouterListening
    { id: 'routeTreeRouterListening', type: 'TreeIncludeUp', from: 'routeTree', to: 'RouterListening' }, // 110
    // routeTreeRouterStringUse
    { id: 'routeTreeRouterStringUse', type: 'TreeIncludeUp', from: 'routeTree', to: 'RouterStringUse' }, // 111
    // routeTreeHandleRoute
    { id: 'routeTreeHandleRoute', type: 'TreeIncludeDown', from: 'routeTree', to: 'HandleRoute' }, // 112

    { id: 'TreeIncludeIn', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 113
    { id: 'TreeIncludeOut', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 114
    { id: 'TreeIncludeFromCurrent', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 115
    { id: 'TreeIncludeToCurrent', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 116
    { id: 'TreeIncludeCurrentFrom', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 117
    { id: 'TreeIncludeCurrentTo', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 118
    { id: 'TreeIncludeFromCurrentTo', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 119
    { id: 'TreeIncludeToCurrentFrom', type: 'TreeInclude', from: 'Tree', to: 'Any' }, // 120

    { id: 'AllowInsertType', type: 'Operation' }, // 121
    { id: 'AllowUpdateType', type: 'Operation' }, // 122
    { id: 'AllowDeleteType', type: 'Operation' }, // 123
    { id: 'AllowSelectType', type: 'Operation' }, // 124

    { id: 'ruleTree', type: 'Tree' }, // 125
    { id: 'ruleTreeRule', type: 'TreeIncludeNode', from: 'ruleTree', to: 'Rule' }, // 126
    { id: 'ruleTreeRuleAction', type: 'TreeIncludeDown', from: 'ruleTree', to: 'RuleAction' }, // 127
    { id: 'ruleTreeRuleObject', type: 'TreeIncludeDown', from: 'ruleTree', to: 'RuleObject' }, // 128
    { id: 'ruleTreeRuleSubject', type: 'TreeIncludeDown', from: 'ruleTree', to: 'RuleSubject' }, // 129
    { id: 'ruleTreeRuleSelector', type: 'TreeIncludeNode', from: 'ruleTree', to: 'Selector' }, // 130
    { id: 'ruleTreeRuleBoolExp', type: 'TreeIncludeNode', from: 'ruleTree', to: 'BoolExp' }, // 131
    { id: 'ruleTreeRuleSelectorInclude', type: 'TreeIncludeDown', from: 'ruleTree', to: 'SelectorInclude' }, // 132
    { id: 'ruleTreeRuleSelectorExclude', type: 'TreeIncludeDown', from: 'ruleTree', to: 'SelectorExclude' }, // 133
    { id: 'ruleTreeRuleSelectorFilter', type: 'TreeIncludeDown', from: 'ruleTree', to: 'SelectorFilter' }, // 134

    { id: 'Plv8IsolationProvider', type: 'IsolationProvider' }, // 140
    { id: 'JSminiExecutionProvider', type: 'ExecutionProvider' }, // 141
    { id: 'plv8SupportsJs', type: 'Supports', from: 'Plv8IsolationProvider', to: 'JSminiExecutionProvider' },  // 142

    { id: 'Authorization', type: 'Type', from: 'Any', to: 'Any' }, // 143
    { id: 'GeneratedFrom', type: 'Type', from: 'Any', to: 'Any' }, // 144

    { id: 'ClientJSIsolationProvider', type: 'IsolationProvider' }, // 145
    { id: 'clientSupportsJs', type: 'Supports', from: 'ClientJSIsolationProvider', to: 'JSExecutionProvider' },  // 146

    { id: 'Symbol', type: 'Type', from: 'Any', to: 'Any' }, // 147
    { id: 'symbolValue', type: 'Value', from: 'Symbol', to: 'String' }, // 148
    { id: 'containTreeSymbol', type: 'TreeIncludeToCurrent', from: 'containTree', to: 'Any' }, // 149

    { id: 'containTreeThen', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Then' }, // 150
    { id: 'containTreeResolved', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Resolved' }, // 151
    { id: 'containTreeRejected', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Rejected' }, // 152

    { id: 'HandleClient', type: 'HandleOperation', from: 'Any', to: 'Handler' }, // 154

    { id: 'TypeSymbol', type: 'Symbol', from: 'Type', to: 'Type', value: { value: '⭐️' } },
    { id: 'PackageSymbol', type: 'Symbol', from: 'Package', to: 'Package', value: { value: '📦' } },
    { id: 'ContainSymbol', type: 'Symbol', from: 'Contain', to: 'Contain', value: { value: '🗂' } },
    { id: 'ValueSymbol', type: 'Symbol', from: 'Value', to: 'Value', value: { value: '📎' } },
    { id: 'PromiseSymbol', type: 'Symbol', from: 'Promise', to: 'Promise', value: { value: '⏳' } },
    { id: 'ThenSymbol', type: 'Symbol', from: 'Then', to: 'Then', value: { value: '🔗' } },
    { id: 'ResolvedSymbol', type: 'Symbol', from: 'Resolved', to: 'Resolved', value: { value: '🟢' } },
    { id: 'RejectedSymbol', type: 'Symbol', from: 'Rejected', to: 'Rejected', value: { value: '🔴' } },
    { id: 'SelectorSymbol', type: 'Symbol', from: 'Selector', to: 'Selector', value: { value: '🪢' } },
    { id: 'SelectorIncludeSymbol', type: 'Symbol', from: 'SelectorInclude', to: 'SelectorInclude', value: { value: '🪢🪡' } },
    { id: 'SelectorExcludeSymbol', type: 'Symbol', from: 'SelectorExclude', to: 'SelectorExclude', value: { value: '🪢🪡' } },
    { id: 'RuleSymbol', type: 'Symbol', from: 'Rule', to: 'Rule', value: { value: '📜' } },
    { id: 'RuleSubjectSymbol', type: 'Symbol', from: 'RuleSubject', to: 'RuleSubject', value: { value: '📜👤' } },
    { id: 'RuleObjectSymbol', type: 'Symbol', from: 'RuleObject', to: 'RuleObject', value: { value: '📜🍏' } },
    { id: 'RuleActionSymbol', type: 'Symbol', from: 'Rule', to: 'Rule', value: { value: '📜🔥' } },
    { id: 'UserSymbol', type: 'Symbol', from: 'User', to: 'User', value: { value: '👤' } },
    { id: 'OperationSymbol', type: 'Symbol', from: 'Operation', to: 'Operation', value: { value: '🔥' } },
    { id: 'FileSymbol', type: 'Symbol', from: 'File', to: 'File', value: { value: '💾' } },
    { id: 'SyncTextFileSymbol', type: 'Symbol', from: 'SyncTextFile', to: 'SyncTextFile', value: { value: '📄' } },
    { id: 'ExecutionProviderSymbol', type: 'Symbol', from: 'ExecutionProvider', to: 'ExecutionProvider', value: { value: '🔌' } },
    { id: 'IsolationProviderSymbol', type: 'Symbol', from: 'IsolationProvider', to: 'IsolationProvider', value: { value: '📡' } },
    { id: 'AsyncFileSymbol', type: 'Symbol', from: 'AsyncFile', to: 'AsyncFile', value: { value: '💽' } },
    { id: 'HandlerSymbol', type: 'Symbol', from: 'Handler', to: 'Handler', value: { value: '💡' } },
    { id: 'TreeSymbol', type: 'Symbol', from: 'Tree', to: 'Tree', value: { value: '🌲' } },
    { id: 'TreeIncludeSymbol', type: 'Symbol', from: 'TreeInclude', to: 'TreeInclude', value: { value: '🌿' } },
    { id: 'PackageNamespaceSymbol', type: 'Symbol', from: 'PackageNamespace', to: 'PackageNamespace', value: { value: '🎁' } },
    { id: 'PackageActiveSymbol', type: 'Symbol', from: 'PackageActive', to: 'PackageActive', value: { value: '📯' } },
    { id: 'PackageVersionSymbol', type: 'Symbol', from: 'PackageVersion', to: 'PackageVersion', value: { value: '🏷' } },
    { id: 'HandleOperationSymbol', type: 'Symbol', from: 'HandleOperation', to: 'HandleOperation', value: { value: '🛠' } },
    { id: 'PromiseResultSymbol', type: 'Symbol', from: 'PromiseResult', to: 'PromiseResult', value: { value: '🔖' } },
    { id: 'PromiseReasonSymbol', type: 'Symbol', from: 'PromiseReason', to: 'PromiseReason', value: { value: '🧲' } },
    { id: 'FocusSymbol', type: 'Symbol', from: 'Focus', to: 'Focus', value: { value: '📌' } },
    { id: 'QuerySymbol', type: 'Symbol', from: 'Query', to: 'Query', value: { value: '🔎' } },
    { id: 'SpaceSymbol', type: 'Symbol', from: 'Space', to: 'Space', value: { value: '🔮' } },
    { id: 'JoinSymbol', type: 'Symbol', from: 'Join', to: 'Join', value: { value: '🤝' } },
    { id: 'SelectorTreeSymbol', type: 'Symbol', from: 'SelectorTree', to: 'SelectorTree', value: { value: '🪢🌲' } },
    { id: 'SelectorFilterSymbol', type: 'Symbol', from: 'SelectorFilter', to: 'SelectorFilter', value: { value: '🪢🔎' } },
    { id: 'BoolExpSymbol', type: 'Symbol', from: 'BoolExp', to: 'BoolExp', value: { value: '🔎' } },
    { id: 'ScheduleSymbol', type: 'Symbol', from: 'Schedule', to: 'Schedule', value: { value: '⏲' } },
    { id: 'RouterSymbol', type: 'Symbol', from: 'Router', to: 'Router', value: { value: '🚦' } },
    { id: 'SupportsSymbol', type: 'Symbol', from: 'Supports', to: 'Supports', value: { value: '🔋' } },
    { id: 'PackagerInstallSymbol', type: 'Symbol', from: 'PackagerInstall', to: 'PackagerInstall', value: { value: '📥' } },
    { id: 'PackagerPublishSymbol', type: 'Symbol', from: 'PackagerPublish', to: 'PackagerPublish', value: { value: '📤' } },
    { id: 'ActiveSymbol', type: 'Symbol', from: 'Active', to: 'Active', value: { value: '💡' } },
    { id: 'PromiseOutSymbol', type: 'Symbol', from: 'PromiseOut', to: 'PromiseOut', value: { value: '🧷' } },
    { id: 'PackagerQuerySymbol', type: 'Symbol', from: 'PackagerQuery', to: 'PackagerQuery', value: { value: '📦🏷' } },
    { id: 'PortSymbol', type: 'Symbol', from: 'Port', to: 'Port', value: { value: '🗜' } },
    { id: 'RouteSymbol', type: 'Symbol', from: 'Route', to: 'Route', value: { value: '🚏' } },
    { id: 'RouterListeningSymbol', type: 'Symbol', from: 'RouterListening', to: 'RouterListening', value: { value: '🔗' } },
    { id: 'RouterStringUseSymbol', type: 'Symbol', from: 'RouterStringUse', to: 'RouterStringUse', value: { value: '🔗' } },
    { id: 'AuthorizationSymbol', type: 'Symbol', from: 'Authorization', to: 'Authorization', value: { value: '🔑' } },
    { id: 'GeneratedFromSymbol', type: 'Symbol', from: 'GeneratedFrom', to: 'GeneratedFrom', value: { value: '🏗' } },
    { id: 'SymbolSymbol', type: 'Symbol', from: 'Symbol', to: 'Symbol', value: { value: '🙂' } },
  ],
  errors: [],
  strict: true,
};

export const up = async () => {
  log('up');
  const packager = new Packager(root);
  const { errors, packageId, namespaceId } = await packager.import(corePckg);
  if (errors?.length) {
    log(errors);
    log(errors[0]?.graphQLErrors?.[0]?.message);
    log(errors[0]?.graphQLErrors?.[0]?.extensions?.internal);
    log(errors[0]?.graphQLErrors?.[0]?.extensions?.internal?.request);
    const error = errors[0]?.graphQLErrors?.[0]?.extensions?.internal?.error;
    throw new Error(`Import error: ${String(errors[0]?.graphQLErrors?.[0]?.message || errors?.[0])}${error?.message ? ` ${error?.message} ${error?.request?.method} ${error?.request?.host}${error?.request?.port}${error?.request?.path}` : ''}`);
  } else {
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Package'),
      string: { data: { value: 'deep' } },
    });
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'User'),
      in: { data: [{
        from_id: await root.id('deep'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'users' } },
      }] },
    });
    // Packages
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'User'),
      in: { data: [{
        from_id: await root.id('deep', 'users'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'packages' } },
      }] },
      out: { data: [{
        to_id: await root.id('deep', 'users'),
        type_id: await root.id('@deep-foundation/core', 'Join'),
        string: { data: { value: 'packages' } },
      }] },
    });
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Contain'),
      to_id: await root.id('@deep-foundation/core'),
      from_id: await root.id('deep', 'users', 'packages'),
    });
    await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Join'),
      from_id: await root.id('@deep-foundation/core'),
      to_id: await root.id('deep', 'users', 'packages'),
    });
    // System
    const { data: [{ id: adminId }] } = await root.insert({
      type_id: await root.id('@deep-foundation/core', 'User'),
      in: { data: [{
        from_id: await root.id('deep', 'users'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'admin' } },
      },{
        from_id: await root.id('deep'),
        type_id: await root.id('@deep-foundation/core', 'Contain'),
        string: { data: { value: 'admin' } },
      }] },
      out: { data: [{
        to_id: await root.id('deep', 'users'),
        type_id: await root.id('@deep-foundation/core', 'Join'),
        string: { data: { value: 'admin' } },
      }] },
    });
    console.log('admin', adminId);
    const adminPermission = await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Rule'),
      out: {
        data: [
          {
            type_id: await root.id('@deep-foundation/core', 'RuleSubject'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: adminId,
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'joinTree'),
                        },
                      },
                    },
                  ]
                },
              },
            },
          },
          {
            type_id: await root.id('@deep-foundation/core', 'RuleObject'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: adminId,
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            type_id: await root.id('@deep-foundation/core', 'RuleAction'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'AllowAdmin'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });
    const promisePermission = await root.insert({
      type_id: await root.id('@deep-foundation/core', 'Rule'),
      out: {
        data: [
          {
            type_id: await root.id('@deep-foundation/core', 'RuleSubject'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('deep', 'users'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'joinTree'),
                        },
                      },
                    },
                  ]
                },
              },
            },
          },
          {
            type_id: await root.id('@deep-foundation/core', 'RuleObject'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'Then'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'Promise'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'Resolved'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'Rejected'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            type_id: await root.id('@deep-foundation/core', 'RuleAction'),
            to: {
              data: {
                type_id: await root.id('@deep-foundation/core', 'Selector'),
                out: {
                  data: [
                    {
                      type_id: await root.id('@deep-foundation/core', 'SelectorInclude'),
                      to_id: await root.id('@deep-foundation/core', 'AllowSelectType'),
                      out: {
                        data: {
                          type_id: await root.id('@deep-foundation/core', 'SelectorTree'),
                          to_id: await root.id('@deep-foundation/core', 'containTree'),
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });
  }
};

const delay = time => new Promise(res => setTimeout(res, time));

export const down = async () => {
  log('down');
  try {
    const handleScheduleId = await root.id('@deep-foundation/core', 'HandleSchedule');
    const deletedHandlers = await root.delete({ 
      type_id: handleScheduleId,
    }, { name: 'DELETE_SCHEDULE_HANDLERS' });
    await delay(10000);
  } catch(e) {
    error(e);
  }
  await root.delete({}, { name: 'DELETE_TYPE_TYPE' });
};