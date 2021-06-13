import { HasuraApi } from "@deepcase/hasura/api";

export const permissions = async (api: HasuraApi, table: string, where: any = {}) => {
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
        filter: where,
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
        check: where,
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
        filter: where,
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
        filter: where,
      }
    }
  });
};