import { HasuraApi } from "@deep-foundation/hasura/api";
import { GLOBAL_ID_ACTION, GLOBAL_ID_CONTAIN, GLOBAL_ID_OBJECT, GLOBAL_ID_PACKAGE, GLOBAL_ID_PACKAGE_NAMESPACE, GLOBAL_ID_PACKAGE_ACTIVE, GLOBAL_ID_RULE, GLOBAL_ID_SELECTION, GLOBAL_ID_SELECTOR, GLOBAL_ID_SUBJECT, GLOBAL_ID_TYPE, GLOBAL_ID_USER, GLOBAL_ID_PROMISE, GLOBAL_ID_THEN, GLOBAL_ID_REJECTED, GLOBAL_ID_RESOLVED } from "./global-ids";

export const generatePermissionWhere = (actionId: number, _or = []) => {
  return {
    _and: [
      {
        _or: [
          { type_id: { _in: [GLOBAL_ID_USER, GLOBAL_ID_TYPE, GLOBAL_ID_PACKAGE, GLOBAL_ID_PACKAGE_ACTIVE, GLOBAL_ID_PACKAGE_NAMESPACE, GLOBAL_ID_PROMISE, GLOBAL_ID_THEN, GLOBAL_ID_REJECTED, GLOBAL_ID_RESOLVED] } },
          { type_id: { _eq: GLOBAL_ID_CONTAIN }, from: { type_id: { _eq: GLOBAL_ID_PACKAGE } } },
          { in: { type_id: { _eq: GLOBAL_ID_CONTAIN }, from: { type_id: { _eq: GLOBAL_ID_PACKAGE } } } },
          {
            _by_item: { // parents
              _and: [
                {
                  path_item: { // each
                    in: { // selection
                      from: { // selector
                        in: { // object
                          type_id: { _eq: GLOBAL_ID_OBJECT },
                          from: { // rule
                            _and: [
                              { type_id: { _eq: GLOBAL_ID_RULE } },
                              {
                                out: {
                                  type_id: { _eq: GLOBAL_ID_ACTION },
                                  to: { out: { to_id: { _eq: actionId } } },
                                },
                              },
                              {
                                out: {
                                  type_id: { _eq: GLOBAL_ID_SUBJECT },
                                  to: { out: { to_id: { _eq: 'X-Hasura-User-Id' } } },
                                },
                              },
                            ],
                          },
                        },
                        type_id: { _eq: GLOBAL_ID_SELECTOR },
                      },
                      type_id: { _eq: GLOBAL_ID_SELECTION },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      { type_id: { _ne: 0 } },
      ..._or,
    ],
  };
};

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
      role: 'guest',
      permission: {
        columns: columns,
        computed_fields,
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