import { Packager, Package } from './packager';

export const corePckg: Package = {
  package: {
    name: '@deep-foundation/core',
    version: '0.0.0',
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

    { id: 'PackagerInstall', type: 'Type', from: 'Any', to: 'PackagerQuery' },
    { id: 'PackagerPublish', type: 'Type', from: 'Package', to: 'PackagerQuery' },

    { id: 'packagerInstallCode', type: 'SyncTextFile', value: { value: /*javascript*/`
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
    { id: 'packagerInstallCodeHandler', type: 'Handler', from: 'dockerSupportsJs', to: 'packagerInstallCode' },
    { id: 'packagerInstallCodeHandleInsert', type: 'HandleInsert', from: 'PackagerInstall', to: 'packagerInstallCodeHandler' },

    { id: 'packagerPublishCode', type: 'SyncTextFile', value: { value: /*javascript*/`
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
    { id: 'packagerPublishCodeHandler', type: 'Handler', from: 'dockerSupportsJs', to: 'packagerPublishCode' },
    { id: 'packagerPublishCodeHandleInsert', type: 'HandleInsert', from: 'PackagerPublish', to: 'packagerPublishCodeHandler' },

    { id: 'Active', type: 'Type', from: 'Any', to: 'Any' },

    { id: 'AllowPackagerInstall', type: 'Operation' },
    { id: 'AllowPackagerPublish', type: 'Operation' },

    { id: 'PromiseOut', type: 'Type', from: 'Promise', to: 'Any' },
    { id: 'promiseOutValue', type: 'Value', from: 'PromiseOut', to: 'String' },

    { id: 'PackagerQuery', type: 'Type' },
    { id: 'packagerQueryValue', type: 'Value', from: 'PackagerQuery', to: 'String' },

    { id: 'Port', type: 'Type', value: { value: 'Port' } },
    { id: 'portValue', type: 'Value', from: 'Port', to: 'Number' },
    { id: 'HandlePort', type: 'HandleOperation', from: 'Port', to: 'Any' },

    { id: 'PackagerInstalled', type: 'Type', from: 'Package', to: 'PackagerQuery' }, // #TODO
    { id: 'PackagerPublished', type: 'Type', from: 'Package', to: 'PackagerQuery' }, // #TODO

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
    { id: 'containTreeSymbol', type: 'TreeIncludeToCurrent', from: 'containTree', to: 'Any' },

    { id: 'containTreeThen', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Then' },
    { id: 'containTreeResolved', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Resolved' },
    { id: 'containTreeRejected', type: 'TreeIncludeFromCurrentTo', from: 'containTree', to: 'Rejected' },

    { id: 'handlersTree', type: 'Tree' },
    { id: 'handlersTreeHandler', type: 'TreeIncludeUp', from: 'handlersTree', to: 'Handler' },
    { id: 'handlersTreeSupports', type: 'TreeIncludeOut', from: 'handlersTree', to: 'Supports' },
    { id: 'handlersTreeHandleOperation', type: 'TreeIncludeUp', from: 'handlersTree', to: 'HandleOperation' },

    { id: 'HandleClient', type: 'HandleOperation', from: 'Any', to: 'Handler' },

    { id: 'TypeSymbol', type: 'Symbol', from: 'Type', to: 'Type', value: { value: '⭐️' } },
    { id: 'PackageSymbol', type: 'Symbol', from: 'Package', to: 'Package', value: { value: '📦' } },
    { id: 'ContainSymbol', type: 'Symbol', from: 'Contain', to: 'Contain', value: { value: '🗂' } },
    { id: 'ValueSymbol', type: 'Symbol', from: 'Value', to: 'Value', value: { value: '📎' } },
    { id: 'PromiseSymbol', type: 'Symbol', from: 'Promise', to: 'Promise', value: { value: '⏳' } },
    { id: 'ThenSymbol', type: 'Symbol', from: 'Then', to: 'Then', value: { value: '🔗' } },
    { id: 'ResolvedSymbol', type: 'Symbol', from: 'Resolved', to: 'Resolved', value: { value: '🟢' } },
    { id: 'RejectedSymbol', type: 'Symbol', from: 'Rejected', to: 'Rejected', value: { value: '🔴' } },
    { id: 'SelectorSymbol', type: 'Symbol', from: 'Selector', to: 'Selector', value: { value: '🪢' } },
    { id: 'SelectorIncludeSymbol', type: 'Symbol', from: 'SelectorInclude', to: 'SelectorInclude', value: { value: '🪡' } },
    { id: 'SelectorExcludeSymbol', type: 'Symbol', from: 'SelectorExclude', to: 'SelectorExclude', value: { value: '🪡' } },
    { id: 'RuleSymbol', type: 'Symbol', from: 'Rule', to: 'Rule', value: { value: '📜' } },
    { id: 'RuleSubjectSymbol', type: 'Symbol', from: 'RuleSubject', to: 'RuleSubject', value: { value: '👤' } },
    { id: 'RuleObjectSymbol', type: 'Symbol', from: 'RuleObject', to: 'RuleObject', value: { value: '🍏' } },
    { id: 'RuleActionSymbol', type: 'Symbol', from: 'Rule', to: 'Rule', value: { value: '🔥' } },
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
    { id: 'SelectorTreeSymbol', type: 'Symbol', from: 'SelectorTree', to: 'SelectorTree', value: { value: '🌲' } },
    { id: 'SelectorFilterSymbol', type: 'Symbol', from: 'SelectorFilter', to: 'SelectorFilter', value: { value: '🔎' } },
    { id: 'ScheduleSymbol', type: 'Symbol', from: 'Schedule', to: 'Schedule', value: { value: '⏲' } },
    { id: 'RouterSymbol', type: 'Symbol', from: 'Router', to: 'Router', value: { value: '🚦' } },
    { id: 'SupportsSymbol', type: 'Symbol', from: 'Supports', to: 'Supports', value: { value: '🔋' } },
    { id: 'PackagerInstallSymbol', type: 'Symbol', from: 'PackagerInstall', to: 'PackagerInstall', value: { value: '📥' } },
    { id: 'PackagerPublishSymbol', type: 'Symbol', from: 'PackagerPublish', to: 'PackagerPublish', value: { value: '📤' } },
    { id: 'ActiveSymbol', type: 'Symbol', from: 'Active', to: 'Active', value: { value: '💡' } },
    { id: 'PromiseOutSymbol', type: 'Symbol', from: 'PromiseOut', to: 'PromiseOut', value: { value: '🧷' } },
    { id: 'PackagerQuerySymbol', type: 'Symbol', from: 'PackagerQuery', to: 'PackagerQuery', value: { value: '🏷' } },
    { id: 'PortSymbol', type: 'Symbol', from: 'Port', to: 'Port', value: { value: '🗜' } },
    { id: 'RouteSymbol', type: 'Symbol', from: 'Route', to: 'Route', value: { value: '🚏' } },
    { id: 'RouterListeningSymbol', type: 'Symbol', from: 'RouterListening', to: 'RouterListening', value: { value: '🔗' } },
    { id: 'RouterStringUseSymbol', type: 'Symbol', from: 'RouterStringUse', to: 'RouterStringUse', value: { value: '🔗' } },
    { id: 'AuthorizationSymbol', type: 'Symbol', from: 'Authorization', to: 'Authorization', value: { value: '🔑' } },
    { id: 'GeneratedFromSymbol', type: 'Symbol', from: 'GeneratedFrom', to: 'GeneratedFrom', value: { value: '🏗' } },
    { id: 'SymbolSymbol', type: 'Symbol', from: 'Symbol', to: 'Symbol', value: { value: '🙂' } },

    // HandlingError
    { id: 'HandlingError', type: 'Type' },
    // HandlingErrorValue
    { id: 'handlingErrorValue', type: 'Value', from: 'HandlingError', to: 'Object' },
    // HandlingErrorReason
    { id: 'HandlingErrorReason', type: 'Type', from: 'HandlingError', to: 'Any' },
    // HandlingErrorLink
    { id: 'HandlingErrorLink', type: 'Type', from: 'HandlingError', to: 'Any' },
  ],
  errors: [],
  strict: true,
};