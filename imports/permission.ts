import { HasuraApi } from "@deepcase/hasura/api";

export const generatePermissionWhere = (actionId: number) => {
  return {"_or":[{"type_id":{"_eq":14}},{"type_id":{"_eq":1}},{"_by_item":{"_and":[{"path_item":{"in":{"from":{"in":{"from":{"_and":[{"type_id":{"_eq":9}},{"out":{"to":{"out":{"to_id":{"_eq":40}}},"type_id":{"_eq":10}}},{"out":{"to":{"out":{"to_id":{"_eq":actionId}}},"type_id":{"_eq":12}}}]},"type_id":{"_eq":11}},"type_id":{"_eq":7}},"type_id":{"_eq":8}}}}]}},{"_by_item":{"path_item_id":{"_eq":40}}}]};
};

export const permissions = async (api: HasuraApi, table: string, actions: {
  select: any;
  insert: any;
  update: any;
  delete: any;
} = {
  select: {},
  insert: {},
  update: {},
  delete: {},
}) => {
  await api.query({
    type: 'create_select_permission',
    args: {
      table: table,
      role: 'guest',
      permission: {
        columns: '*',
        filter: {},
        limit: 999,
        allow_aggregations: true
      }
    }
  });
  await api.query({
    type: 'create_insert_permission',
    args: {
      table: table,
      role: 'guest',
      permission: {
        check: {},
        columns: '*',
      }
    }
  });
  await api.query({
    type: 'create_update_permission',
    args: {
      table: table,
      role: 'guest',
      permission: {
        columns: '*',
        filter: {},
        check: {},
      }
    }
  });
  await api.query({
    type: 'create_delete_permission',
    args: {
      table: table,
      role: 'guest',
      permission: {
        filter: {},
      }
    }
  });
  await api.query({
    type: 'create_select_permission',
    args: {
      table: table,
      role: 'link',
      permission: {
        columns: '*',
        filter: actions.select,
        limit: 999,
        allow_aggregations: true
      }
    }
  });
  await api.query({
    type: 'create_insert_permission',
    args: {
      table: table,
      role: 'link',
      permission: {
        check: actions.insert,
        columns: '*',
      }
    }
  });
  await api.query({
    type: 'create_update_permission',
    args: {
      table: table,
      role: 'link',
      permission: {
        columns: '*',
        filter: actions.update,
        check: {},
      }
    }
  });
  await api.query({
    type: 'create_delete_permission',
    args: {
      table: table,
      role: 'link',
      permission: {
        filter: actions.delete,
      }
    }
  });
};