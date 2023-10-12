import { Packager, Package } from './packager.js';

export const corePckg: Package = {
  package: {
    name: '@deep-foundation/core',
    version: '0.0.2',
    uri: 'deep-foundation/core',
    type: 'git',
  },
  data: [
    { id: 'Type', type: 'Type', from: 'Any', to: 'Any' },
    { id: 'Package', type: 'Type' },
    { id: 'Contain', type: 'Type', from: 'Any', to: 'Any' },

    // TODO NEED_TREE_MP https://github.com/deep-foundation/deeplinks/issues/33
    { id: 'Value', type: 'Type', from: 'Any', to: 'Type' },

    { id: 'String', type: 'Type' },
    { id: 'Number', type: 'Type' },
    { id: 'Object', type: 'Type' },
    { id: 'Any', type: 'Type' },
    { id: 'Promise', type: 'Type' },
    { id: 'Then', type: 'Type', from: 'Any', to: 'Promise' },
    { id: 'Resolved', type: 'Type', from: 'Promise', to: 'Any' },
    { id: 'Rejected', type: 'Type', from: 'Promise', to: 'Any' },

    // ===

    { id: 'typeValue', type: 'Value', from: 'Type', to: 'String' },
    { id: 'packageValue', type: 'Value', from: 'Package', to: 'String' },

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

    { id: 'Selector', type: 'Type' },
    { id: 'SelectorInclude', type: 'Type', from: 'Selector', to: 'Any' },

    { id: 'Rule', type: 'Type' },
    { id: 'RuleSubject', type: 'Type', from: 'Rule', to: 'Selector' },
    { id: 'RuleObject', type: 'Type', from: 'Rule', to: 'Selector' },
    { id: 'RuleAction', type: 'Type', from: 'Rule', to: 'Selector' },

    { id: 'containValue', type: 'Value', from: 'Contain', to: 'String' },

    { id: 'User', type: 'Type' },

    { id: 'Operation', type: 'Type' },

    { id: 'operationValue', type: 'Value', from: 'Operation', to: 'String' },

    { id: 'AllowInsert', type: 'Operation' },
    { id: 'AllowUpdate', type: 'Operation' },
    { id: 'AllowDelete', type: 'Operation' },
    { id: 'AllowSelect', type: 'Operation' },

    { id: 'File', type: 'Type' },
    { id: 'SyncTextFile', type: 'File' },
    { id: 'syncTextFileValue', type: 'Value', from: 'SyncTextFile', to: 'String' },

    { id: 'ExecutionProvider', type: 'Type' },
    { id: 'JSExecutionProvider', type: 'ExecutionProvider' },

    { id: 'TreeInclude', type: 'Type', from: 'Type', to: 'Any' },
    { id: 'Handler', type: 'Type', from: 'Supports', to: 'Any' },

    { id: 'Tree', type: 'Type' },

    { id: 'TreeIncludeDown', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeUp', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeNode', type: 'TreeInclude', from: 'Tree', to: 'Any' },

    { id: 'containTree', type: 'Tree' },
    { id: 'containTreeContain', type: 'TreeIncludeDown', from: 'containTree', to: 'Contain' },
    { id: 'containTreeAny', type: 'TreeIncludeNode', from: 'containTree', to: 'Any' },

    { id: 'PackageNamespace', type: 'Type' },

    { id: 'packageNamespaceValue', type: 'Value', from: 'PackageNamespace', to: 'String' },

    { id: 'PackageActive', type: 'Type', from: 'PackageNamespace', to: 'Package' },

    { id: 'PackageVersion', type: 'Type', from: 'PackageNamespace', to: 'Package' },
    { id: 'packageVersionValue', type: 'Value', from: 'PackageVersion', to: 'String' },

    { id: 'HandleOperation', type: 'Type', from: 'Type', to: 'Type' },
    { id: 'HandleInsert', type: 'HandleOperation', from: 'Any', to: 'Handler' },
    { id: 'HandleUpdate', type: 'HandleOperation', from: 'Any', to: 'Handler' },
    { id: 'HandleDelete', type: 'HandleOperation', from: 'Any', to: 'Handler' },

    { id: 'PromiseResult', type: 'Type' },
    { id: 'promiseResultValueRelationTable', type: 'Value', from: 'PromiseResult', to: 'Object' },
    { id: 'PromiseReason', type: 'Type', from: 'Any', to: 'Any' },

    { id: 'Focus', type: 'Type', from: 'Any', to: 'Any' },
    { id: 'focusValue', type: 'Value', from: 'Focus', to: 'Object' },
    { id: 'AsyncFile', type: 'File' },
    { id: 'Query', type: 'Type' },
    { id: 'queryValue', type: 'Value', from: 'Query', to: 'Object' },
    { id: 'Fixed', type: 'Type' }, // TODO
    { id: 'fixedValue', type: 'Value', from: 'Fixed', to: 'Object' }, // TODO
    { id: 'Space', type: 'Type' },
    { id: 'spaceValue', type: 'Value', from: 'Space', to: 'String' },

    { id: 'AllowLogin', type: 'Operation' },

    { id: 'guests', type: 'Any' },
    { id: 'Join', type: 'Type', from: 'Any', to: 'Any' },

    { id: 'joinTree', type: 'Tree' },
    { id: 'joinTreeJoin', type: 'TreeIncludeUp', from: 'joinTree', to: 'Join' },
    { id: 'joinTreeAny', type: 'TreeIncludeNode', from: 'joinTree', to: 'Any' },

    { id: 'SelectorTree', type: 'Type', from: 'Any', to: 'Tree' },

    { id: 'AllowAdmin', type: 'Operation' },
    // { id: 'system', type: 'Package' },

    { id: 'SelectorExclude', type: 'Type', from: 'Selector', to: 'Any' },

    { id: 'SelectorFilter', type: 'Type', from: 'Selector', to: 'Query' },

    { id: 'HandleSchedule', type: 'HandleOperation', from: 'Any', to: 'Handler' },

    { id: 'Schedule', type: 'Type' },

    { id: 'scheduleValue', type: 'Value', from: 'Schedule', to: 'String' },

    { id: 'Router', type: 'Type', value: { value: 'Router' } },

    { id: 'IsolationProvider', type: 'Type' },
    { id: 'DockerIsolationProvider', type: 'IsolationProvider' },

    { id: 'dockerIsolationProviderValue', type: 'Value', from: 'DockerIsolationProvider', to: 'String' },
    { id: 'JSDockerIsolationProvider', type: 'DockerIsolationProvider', value: { value: 'deepf/js-docker-isolation-provider:main' } },
    { id: 'Supports', type: 'Type', from: 'Any', to: 'Any' },
    { id: 'dockerSupportsJs', type: 'Supports', from: 'JSDockerIsolationProvider', to: 'JSExecutionProvider' },

    { id: 'PackageInstall', type: 'Type', from: 'Any', to: 'PackageQuery' },
    { id: 'PackagePublish', type: 'Type', from: 'Package', to: 'PackageQuery' },

    { id: 'packageInstallCode', type: 'SyncTextFile', value: { value: /*javascript*/`
async ({ deep, require, gql, data: { newLink } }) => {
  const { data: [pq] } = await deep.select({ id: newLink.to_id });
  const { data: { packager_install: imported }, error } = await deep.apolloClient.query({
    query: gql\`query PACKAGE_INSTALL($address: String!) {
      packager_install(input: { address: $address }) {
        ids
        packageId
        errors
      }
    }\`,
    variables: {
      address: pq?.value?.value,
    },
  });
  if (error) throw error;
  if (imported?.errors?.length) throw imported.errors;
  await deep.insert({
    type_id: await deep.id('@deep-foundation/core', 'Contain'),
    from_id: newLink.from_id,
    to_id: imported.packageId,
  });
  return imported;
}
    ` } },
    { id: 'packageInstallCodeHandler', type: 'Handler', from: 'dockerSupportsJs', to: 'packageInstallCode' },
    { id: 'packageInstallCodeHandleInsert', type: 'HandleInsert', from: 'PackageInstall', to: 'packageInstallCodeHandler' },

    { id: 'packagePublishCode', type: 'SyncTextFile', value: { value: /*javascript*/`
async ({ deep, require, gql, data: { newLink } }) => {
  const { data: [pq] } = await deep.select({ id: newLink.to_id });
  const { data: { packager_publish: exported }, error } = await deep.apolloClient.query({
    query: gql\`query PACKAGE_PUBLISH($address: String!, $id: Int) {
      packager_publish(input: { address: $address, id: $id }) {
        address
        errors
      }
    }\`,
    variables: {
      address: pq?.value?.value,
      id: newLink.from_id,
    },
  });
  if (error) throw error;
  if (exported?.errors?.length) throw exported.errors;
  return exported;
}
    ` } },
    { id: 'packagePublishCodeHandler', type: 'Handler', from: 'dockerSupportsJs', to: 'packagePublishCode' },
    { id: 'packagePublishCodeHandleInsert', type: 'HandleInsert', from: 'PackagePublish', to: 'packagePublishCodeHandler' },

    { id: 'Active', type: 'Type', from: 'Any', to: 'Any' },

    { id: 'AllowPackageInstall', type: 'Operation' },
    { id: 'AllowPackagePublish', type: 'Operation' },

    { id: 'PromiseOut', type: 'Type', from: 'Promise', to: 'Any' },
    { id: 'promiseOutValue', type: 'Value', from: 'PromiseOut', to: 'String' },

    { id: 'PackageQuery', type: 'Type' },
    { id: 'packageQueryValue', type: 'Value', from: 'PackageQuery', to: 'String' },

    { id: 'Port', type: 'Type', value: { value: 'Port' } },
    { id: 'portValue', type: 'Value', from: 'Port', to: 'Number' },
    { id: 'HandlePort', type: 'HandleOperation', from: 'Port', to: 'Any' },

    { id: 'PackageInstalled', type: 'Type', from: 'Package', to: 'PackageQuery' }, // #TODO
    { id: 'PackagePublished', type: 'Type', from: 'Package', to: 'PackageQuery' }, // #TODO

    // Route
    { id: 'Route', type: 'Type' },
    // RouterListening from Router to Port
    { id: 'RouterListening', type: 'Type', from: 'Router', to: 'Port' },
    // RouterStringUse from Route to Router
    { id: 'RouterStringUse', type: 'Type', from: 'Route', to: 'Router' },
    // RouterStringUse value string
    { id: 'routerStringUseValue', type: 'Value', from: 'RouterStringUse', to: 'String' },
    // HandleRoute from Route to Handler
    { id: 'HandleRoute', type: 'HandleOperation', from: 'Route', to: 'Handler' },
    // routeTree
    { id: 'routeTree', type: 'Tree' },
    // routeTreePort
    { id: 'routeTreePort', type: 'TreeIncludeNode', from: 'routeTree', to: 'Port' },
    // routeTreeRouter
    { id: 'routeTreeRouter', type: 'TreeIncludeNode', from: 'routeTree', to: 'Router' },
    // routeTreeRoute
    { id: 'routeTreeRoute', type: 'TreeIncludeNode', from: 'routeTree', to: 'Route' },
    // routeTreeHandler
    { id: 'routeTreeHandler', type: 'TreeIncludeNode', from: 'routeTree', to: 'Handler' },
    // routeTreeRouterListening
    { id: 'routeTreeRouterListening', type: 'TreeIncludeUp', from: 'routeTree', to: 'RouterListening' },
    // routeTreeRouterStringUse
    { id: 'routeTreeRouterStringUse', type: 'TreeIncludeUp', from: 'routeTree', to: 'RouterStringUse' },
    // routeTreeHandleRoute
    { id: 'routeTreeHandleRoute', type: 'TreeIncludeDown', from: 'routeTree', to: 'HandleRoute' },

    { id: 'TreeIncludeIn', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeOut', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeFromCurrent', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeToCurrent', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeCurrentFrom', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeCurrentTo', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeFromCurrentTo', type: 'TreeInclude', from: 'Tree', to: 'Any' },
    { id: 'TreeIncludeToCurrentFrom', type: 'TreeInclude', from: 'Tree', to: 'Any' },

    { id: 'AllowInsertType', type: 'Operation' },
    { id: 'AllowUpdateType', type: 'Operation' },
    { id: 'AllowDeleteType', type: 'Operation' },
    { id: 'AllowSelectType', type: 'Operation' },

    { id: 'ruleTree', type: 'Tree' },
    { id: 'ruleTreeRule', type: 'TreeIncludeNode', from: 'ruleTree', to: 'Rule' },
    { id: 'ruleTreeRuleAction', type: 'TreeIncludeDown', from: 'ruleTree', to: 'RuleAction' },
    { id: 'ruleTreeRuleObject', type: 'TreeIncludeDown', from: 'ruleTree', to: 'RuleObject' },
    { id: 'ruleTreeRuleSubject', type: 'TreeIncludeDown', from: 'ruleTree', to: 'RuleSubject' },
    { id: 'ruleTreeRuleSelector', type: 'TreeIncludeNode', from: 'ruleTree', to: 'Selector' },
    { id: 'ruleTreeRuleQuery', type: 'TreeIncludeNode', from: 'ruleTree', to: 'Query' },
    { id: 'ruleTreeRuleSelectorInclude', type: 'TreeIncludeDown', from: 'ruleTree', to: 'SelectorInclude' },
    { id: 'ruleTreeRuleSelectorExclude', type: 'TreeIncludeDown', from: 'ruleTree', to: 'SelectorExclude' },
    { id: 'ruleTreeRuleSelectorFilter', type: 'TreeIncludeDown', from: 'ruleTree', to: 'SelectorFilter' },

    { id: 'Plv8IsolationProvider', type: 'IsolationProvider' },
    { id: 'JSminiExecutionProvider', type: 'ExecutionProvider' },
    { id: 'plv8SupportsJs', type: 'Supports', from: 'Plv8IsolationProvider', to: 'JSminiExecutionProvider' },

    { id: 'Authorization', type: 'Type', from: 'Any', to: 'Any' },
    { id: 'GeneratedFrom', type: 'Type', from: 'Any', to: 'Any' },

    { id: 'ClientJSIsolationProvider', type: 'IsolationProvider' },
    { id: 'clientSupportsJs', type: 'Supports', from: 'ClientJSIsolationProvider', to: 'JSExecutionProvider' },

    { id: 'Symbol', type: 'Type', from: 'Any', to: 'Any' },
    { id: 'symbolValue', type: 'Value', from: 'Symbol', to: 'String' },
    { id: 'containTreeSymbol', type: 'TreeIncludeToCurrent', from: 'containTree', to: 'Symbol' },

    { id: 'containTreeThen', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Then' },
    { id: 'containTreeResolved', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Resolved' },
    { id: 'containTreeRejected', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Rejected' },

    { id: 'handlersTree', type: 'Tree' },
    { id: 'handlersTreeHandler', type: 'TreeIncludeUp', from: 'handlersTree', to: 'Handler' },
    { id: 'handlersTreeSupports', type: 'TreeIncludeOut', from: 'handlersTree', to: 'Supports' },
    { id: 'handlersTreeHandleOperation', type: 'TreeIncludeUp', from: 'handlersTree', to: 'HandleOperation' },

    { id: 'HandleClient', type: 'HandleOperation', from: 'Any', to: 'Handler' },

    { id: 'HandlingError', type: 'Type' },
    { id: 'handlingErrorValue', type: 'Value', from: 'HandlingError', to: 'Object' },
    { id: 'HandlingErrorReason', type: 'Type', from: 'HandlingError', to: 'Any' },
    { id: 'HandlingErrorLink', type: 'Type', from: 'HandlingError', to: 'Any' },

    { id: 'GqlEndpoint', type: 'Type' },
    { id: 'MainGqlEndpoint', type: 'GqlEndpoint' },

    { id: 'HandleGql', type: 'Type', from: 'GqlEndpoint', to: 'HandleRoute' },

    { id: 'SupportsCompatable', type: 'Type', from: 'Supports', to: 'HandleOperation' },

    { id: 'plv8JSSupportsCompatableHandleInsert', type: 'SupportsCompatable', from: 'plv8SupportsJs', to: 'HandleInsert' },
    { id: 'plv8JSSupportsCompatableHandleUpdate', type: 'SupportsCompatable', from: 'plv8SupportsJs', to: 'HandleUpdate' },
    { id: 'plv8JSSupportsCompatableHandleDelete', type: 'SupportsCompatable', from: 'plv8SupportsJs', to: 'HandleDelete' },

    { id: 'dockerJSSupportsCompatableHandleInsert', type: 'SupportsCompatable', from: 'dockerSupportsJs', to: 'HandleInsert' },
    { id: 'dockerJSSupportsCompatableHandleUpdate', type: 'SupportsCompatable', from: 'dockerSupportsJs', to: 'HandleUpdate' },
    { id: 'dockerJSSupportsCompatableHandleDelete', type: 'SupportsCompatable', from: 'dockerSupportsJs', to: 'HandleDelete' },
    { id: 'dockerJSSupportsCompatableHandleSchedule', type: 'SupportsCompatable', from: 'dockerSupportsJs', to: 'HandleSchedule' },
    { id: 'dockerJSSupportsCompatableHandlePort', type: 'SupportsCompatable', from: 'dockerSupportsJs', to: 'HandlePort' },
    { id: 'dockerJSSupportsCompatableHandleRoute', type: 'SupportsCompatable', from: 'dockerSupportsJs', to: 'HandleRoute' },

    { id: 'clientJSSupportsCompatableHandleClient', type: 'SupportsCompatable', from: 'clientSupportsJs', to: 'HandleClient' },

    { id: 'promiseTree', type: 'Tree' },
    { id: 'promiseTreeAny', type: 'TreeIncludeNode', from: 'promiseTree', to: 'Any' },
    { id: 'promiseTreeThen', type: 'TreeIncludeDown', from: 'promiseTree', to: 'Then' },
    { id: 'promiseTreePromise', type: 'TreeIncludeNode', from: 'promiseTree', to: 'Promise' },
    { id: 'promiseTreeResolved', type: 'TreeIncludeDown', from: 'promiseTree', to: 'Resolved' },
    { id: 'promiseTreeRejected', type: 'TreeIncludeDown', from: 'promiseTree', to: 'Rejected' },
    { id: 'promiseTreePromiseResult', type: 'TreeIncludeNode', from: 'promiseTree', to: 'PromiseResult' },

    { id: 'MigrationsEnd', type: 'Type' },

    { id: 'typesTree', type: 'Tree' },
  ],
  errors: [],
  strict: true,
};