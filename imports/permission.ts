import { HasuraApi } from "@deep-foundation/hasura/api";

export const permissions = async (api: HasuraApi, table: string, actions: {
  select: any;
  insert: any;
  update: any;
  delete: any;

  columns?: string | string[];
  computed_fields?: string[];
} = {
  select: {},
  insert: {},
  update: {},
  delete: {},
  
  columns: '*',
  computed_fields: [],
}) => {
  const columns = actions.columns || '*';
  const computed_fields = actions.computed_fields || [];
  await api.metadata({
    type: 'pg_create_select_permission',
    args: {
      table: table,
      role: 'link',
      permission: {
        columns: columns,
        computed_fields,
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