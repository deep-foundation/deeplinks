import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { sql } from '@deep-foundation/hasura/sql.js';
import { down as downRels, up as upRels } from '@deep-foundation/materialized-path/relationships.js';
import { down as downTable, up as upTable } from '@deep-foundation/materialized-path/table.js';
import { Trigger } from '@deep-foundation/materialized-path/trigger.js';
import Debug from 'debug';
import { _ids } from '../imports/client.js';
import { SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links.js';

const debug = Debug('deeplinks:migrations:materialized-path');
const log = debug.extend('log');
const error = debug.extend('error');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const api = new HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+(process.env.MIGRATIONS_HASURA_SSL || 0),
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const MP_TABLE_NAME = 'mp';
export const TREE_TABLE_NAME = 'tree';

const triggerOptionos = {
  mpTableName: MP_TABLE_NAME,
  graphTableName: LINKS_TABLE_NAME,

  id_field: 'id',
  to_field: 'to_id',
  from_field: 'from_id',

  id_type: 'bigint',
  iteratorInsertDeclare: 'groupRow RECORD;',
  iteratorDeleteArgumentSend: 'groupRow',
  iteratorDeleteArgumentGet: 'groupRow RECORD',
  iteratorInsertBegin: `FOR groupRow IN (
    SELECT
    DISTINCT mpGroup."id"
    FROM
    ${LINKS_TABLE_NAME} as mpGroup,
    ${LINKS_TABLE_NAME} as mpInclude
    WHERE
    mpInclude."type_id" IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown},${_ids?.['@deep-foundation/core']?.TreeIncludeUp},${_ids?.['@deep-foundation/core']?.TreeIncludeNode}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom}) AND
    mpInclude."to_id" IN (NEW.type_id, ${_ids?.['@deep-foundation/core']?.Any}) AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = ${_ids?.['@deep-foundation/core']?.Tree} AND
    mpGroup."id" != ${_ids?.['@deep-foundation/core']?.typesTree} AND
    ((groupid != 0 AND groupid = mpGroup."id") OR groupid = 0)
    ) LOOP`,
  iteratorInsertEnd: 'END LOOP;',
  groupInsert: 'groupRow."id"',

  additionalFields: '',
  additionalData: '',

  iteratorDeleteDeclare: 'groupRow RECORD;',
  iteratorDeleteBegin: `FOR groupRow IN (
    SELECT
    mpGroup.*
    FROM
    ${LINKS_TABLE_NAME} as mpGroup,
    ${LINKS_TABLE_NAME} as mpInclude
    WHERE
    mpInclude."type_id" IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown},${_ids?.['@deep-foundation/core']?.TreeIncludeUp},${_ids?.['@deep-foundation/core']?.TreeIncludeNode}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom}) AND
    mpInclude."to_id" IN (OLD.type_id, ${_ids?.['@deep-foundation/core']?.Any}) AND
    mpInclude."from_id" = mpGroup."id" AND
    mpGroup."type_id" = ${_ids?.['@deep-foundation/core']?.Tree} AND
    mpGroup."id" != ${_ids?.['@deep-foundation/core']?.typesTree}
  ) LOOP`,
  iteratorDeleteEnd: 'END LOOP;',
  groupDelete: 'groupRow."id"',

  // TODO optimize duplicating equal selects

  isAllowSpreadFromCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
  )`,
  isAllowSpreadCurrentTo: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
    AND
    EXISTS (SELECT * FROM ${LINKS_TABLE_NAME} as child, ${LINKS_TABLE_NAME} as include WHERE
      child."id" = CURRENT."to_id" AND
      include."type_id" IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown},${_ids?.['@deep-foundation/core']?.TreeIncludeUp},${_ids?.['@deep-foundation/core']?.TreeIncludeNode}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom}) AND
      include."from_id" = groupRow.id AND
      include."to_id" IN (child.type_id, ${_ids?.['@deep-foundation/core']?.Any})
    )
  )`,

  isAllowSpreadToCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${_ids?.['@deep-foundation/core']?.TreeIncludeUp}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
  )`,
  isAllowSpreadCurrentFrom: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${_ids?.['@deep-foundation/core']?.TreeIncludeUp}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (CURRENT.type_id)
    AND
    EXISTS (SELECT * FROM ${LINKS_TABLE_NAME} as child, ${LINKS_TABLE_NAME} as include WHERE
      child."id" = CURRENT."from_id" AND
      include."type_id" IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown},${_ids?.['@deep-foundation/core']?.TreeIncludeUp},${_ids?.['@deep-foundation/core']?.TreeIncludeNode}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom}) AND
      include."from_id" = groupRow.id AND
      include."to_id" IN (child.type_id, ${_ids?.['@deep-foundation/core']?.Any})
    )
  )`,

  isAllowSpreadToInCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${_ids?.['@deep-foundation/core']?.Any})
  )`,
  isAllowSpreadCurrentFromOut: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${_ids?.['@deep-foundation/core']?.Any})
  )`,

  isAllowSpreadFromOutCurrent: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${_ids?.['@deep-foundation/core']?.TreeIncludeUp}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${_ids?.['@deep-foundation/core']?.Any})
  )`,
  isAllowSpreadCurrentToIn: `EXISTS (SELECT l.* FROM ${LINKS_TABLE_NAME} as l WHERE
    l.type_id IN (${_ids?.['@deep-foundation/core']?.TreeIncludeUp}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}) AND
    l.from_id = groupRow.id AND
    l.to_id IN (flowLink.type_id, ${_ids?.['@deep-foundation/core']?.Any})
  )`,

  postfix: '',
};
const trigger = Trigger(triggerOptionos);

const DEFAULT_SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const DEFAULT_TREE_TABLE = TREE_TABLE_NAME;
const DEFAULT_GRAPH_TABLE = LINKS_TABLE_NAME;

export const upTreeSchema = async ({
  SCHEMA = DEFAULT_SCHEMA, TREE_TABLE = DEFAULT_TREE_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE, ID_FIELD = 'id', api
}: {
  SCHEMA?: string; TREE_TABLE?: string; GRAPH_TABLE?: string; ID_FIELD?: string;
  api: HasuraApi;
}) => {
  await api.query({
    type: 'create_select_permission',
    args: {
      table: TREE_TABLE,
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
    type: 'create_select_permission',
    args: {
      table: TREE_TABLE,
      role: 'user',
      permission: {
        columns: '*',
        filter: {},
        limit: 999,
        allow_aggregations: true
      }
    }
  });
  await api.query({
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: 'up',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TREE_TABLE,
          },
          column_mapping: {
            [ID_FIELD]: 'link_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: 'down',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TREE_TABLE,
          },
          column_mapping: {
            [ID_FIELD]: 'parent_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: 'root',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TREE_TABLE,
          },
          column_mapping: {
            [ID_FIELD]: 'root_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: GRAPH_TABLE,
      name: TREE_TABLE_NAME,
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TREE_TABLE,
          },
          column_mapping: {
            [ID_FIELD]: 'tree_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: TREE_TABLE,
      name: 'link',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            link_id: ID_FIELD,
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: TREE_TABLE,
      name: 'parent',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            parent_id: ID_FIELD,
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: TREE_TABLE,
      name: 'root',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            root_id: ID_FIELD,
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: TREE_TABLE,
      name: 'tree',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            tree_id: ID_FIELD,
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TREE_TABLE,
      name: 'by_link',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TREE_TABLE,
          },
          column_mapping: {
            link_id: 'link_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TREE_TABLE,
      name: 'by_parent',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TREE_TABLE,
          },
          column_mapping: {
            parent_id: 'parent_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TREE_TABLE,
      name: 'by_position',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TREE_TABLE,
          },
          column_mapping: {
            position_id: 'position_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_object_relationship',
    args: {
      table: TREE_TABLE,
      name: 'by_tree',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: GRAPH_TABLE,
          },
          column_mapping: {
            tree_id: ID_FIELD,
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });

  await api.query({
    type: 'create_array_relationship',
    args: {
      table: TREE_TABLE,
      name: 'by_root',
      using: {
        manual_configuration: {
          remote_table: {
            schema: SCHEMA,
            name: TREE_TABLE,
          },
          column_mapping: {
            root_id: 'root_id',
          },
          insertion_order: 'after_parent',
        },
      },
    },
  });
};

export const downTreeSchema = async ({
  SCHEMA = DEFAULT_SCHEMA, TREE_TABLE = DEFAULT_TREE_TABLE, GRAPH_TABLE = DEFAULT_GRAPH_TABLE, api
}: {
  SCHEMA?: string; TREE_TABLE?: string; GRAPH_TABLE?: string; ID_FIELD?: string;
  api: HasuraApi;
}) => {
  await api.query({
    type: 'drop_relationship',
    args: {
      table: GRAPH_TABLE,
      relationship: 'up',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: GRAPH_TABLE,
      relationship: 'down',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: GRAPH_TABLE,
      relationship: 'root',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: GRAPH_TABLE,
      relationship: TREE_TABLE_NAME,
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: TREE_TABLE,
      relationship: 'link',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: TREE_TABLE,
      relationship: 'parent',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: TREE_TABLE,
      relationship: 'root',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: TREE_TABLE,
      relationship: 'by_link',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: TREE_TABLE,
      relationship: 'by_parent',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: TREE_TABLE,
      relationship: 'by_position',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: TREE_TABLE,
      relationship: 'by_tree',
      cascade: true,
    },
  });
  await api.query({
    type: 'drop_relationship',
    args: {
      table: TREE_TABLE,
      relationship: 'by_root',
      cascade: true,
    },
  });
};


export const up = async () => {
  log('up');
  await upTable({
    MP_TABLE: MP_TABLE_NAME, customColumns: '',
    api,
  });
  await upRels({
    SCHEMA,
    MP_TABLE: MP_TABLE_NAME,
    GRAPH_TABLE: LINKS_TABLE_NAME,
    api,
  });
  await api.sql(trigger.upFunctionInsertNode());
  await api.sql(trigger.upFunctionUpdateNode());
  await api.sql(trigger.upFunctionDeleteNode());
  await api.sql(trigger.upTriggerDelete());
  await api.sql(trigger.upTriggerUpdate());
  await api.sql(trigger.upTriggerInsert());
  await (() => {
    const {
      mpTableName,
      graphTableName,
    
      id_field,
      to_field,
      from_field,
      id_type,
    
      iteratorInsertDeclare,
      iteratorInsertBegin,
      iteratorInsertEnd,
      iteratorDeleteArgumentSend,
      iteratorDeleteArgumentGet,
      iteratorDeleteDeclare,
      iteratorDeleteBegin,
      iteratorDeleteEnd,
      groupInsert,
      groupDelete,
      additionalFields,
      additionalData,
    
      isAllowSpreadFromCurrent,
      isAllowSpreadCurrentTo,
    
      isAllowSpreadToCurrent,
      isAllowSpreadCurrentFrom,
    
      isAllowSpreadToInCurrent,
      isAllowSpreadCurrentFromOut,
    
      isAllowSpreadFromOutCurrent,
      isAllowSpreadCurrentToIn,
    
      postfix,
    } = triggerOptionos;
  })();
  await api.sql(sql`select create_btree_indexes_for_all_columns('${SCHEMA}', '${MP_TABLE_NAME}');`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__insert__function() RETURNS TRIGGER AS $trigger$ BEGIN
    IF (NEW."type_id" IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown},${_ids?.['@deep-foundation/core']?.TreeIncludeUp},${_ids?.['@deep-foundation/core']?.TreeIncludeNode}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom})) THEN
      PERFORM ${MP_TABLE_NAME}__insert_link__function_core(${LINKS_TABLE_NAME}.*, NEW."from_id")
      FROM ${LINKS_TABLE_NAME} WHERE type_id=NEW."to_id" OR NEW."to_id"=${_ids?.['@deep-foundation/core']?.Any};
    END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__update__function() RETURNS TRIGGER AS $trigger$
  DECLARE groupRow RECORD;
  BEGIN
    IF (NEW."type_id" IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown},${_ids?.['@deep-foundation/core']?.TreeIncludeUp},${_ids?.['@deep-foundation/core']?.TreeIncludeNode}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom})) THEN
      SELECT ${LINKS_TABLE_NAME}.* INTO groupRow FROM ${LINKS_TABLE_NAME} WHERE "id"=OLD."from_id" AND "type_id" = ${_ids?.['@deep-foundation/core']?.Tree};
      PERFORM ${MP_TABLE_NAME}__delete_link__function_core(${LINKS_TABLE_NAME}.*, groupRow)
      FROM ${LINKS_TABLE_NAME} WHERE type_id=OLD."to_id" OR OLD."to_id"=${_ids?.['@deep-foundation/core']?.Any};
    END IF;
    IF (NEW."type_id" IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown},${_ids?.['@deep-foundation/core']?.TreeIncludeUp},${_ids?.['@deep-foundation/core']?.TreeIncludeNode}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom})) THEN
      PERFORM ${MP_TABLE_NAME}__insert_link__function_core(${LINKS_TABLE_NAME}.*, NEW."from_id")
      FROM ${LINKS_TABLE_NAME} WHERE type_id=NEW."to_id" OR NEW."to_id"=${_ids?.['@deep-foundation/core']?.Any};
    END IF;
    RETURN NEW;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__tree_include__delete__function() RETURNS TRIGGER AS $trigger$
  DECLARE groupRow RECORD;
  BEGIN
    -- if delete link - is group include link
    IF (OLD."type_id" IN (${_ids?.['@deep-foundation/core']?.TreeIncludeDown},${_ids?.['@deep-foundation/core']?.TreeIncludeUp},${_ids?.['@deep-foundation/core']?.TreeIncludeNode}, ${_ids?.['@deep-foundation/core']?.TreeIncludeIn}, ${_ids?.['@deep-foundation/core']?.TreeIncludeOut}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrent}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentFrom}, ${_ids?.['@deep-foundation/core']?.TreeIncludeCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeFromCurrentTo}, ${_ids?.['@deep-foundation/core']?.TreeIncludeToCurrentFrom})) THEN
      SELECT ${LINKS_TABLE_NAME}.* INTO groupRow FROM ${LINKS_TABLE_NAME} WHERE "id"=OLD."from_id" AND "type_id" = ${_ids?.['@deep-foundation/core']?.Tree};
      PERFORM ${MP_TABLE_NAME}__delete_link__function_core(${LINKS_TABLE_NAME}.*, groupRow)
      FROM ${LINKS_TABLE_NAME} WHERE type_id=OLD."to_id" OR OLD."to_id"=${_ids?.['@deep-foundation/core']?.Any};
    END IF;
    RETURN OLD;
  END; $trigger$ LANGUAGE plpgsql;`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__insert__trigger AFTER INSERT ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__insert__function();`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__delete__trigger AFTER DELETE ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__delete__function();`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__tree_include__update__trigger AFTER UPDATE ON "${LINKS_TABLE_NAME}" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__tree_include__update__function();`);

  log('tree view')
  await api.sql(sql`
    CREATE VIEW tree AS
    SELECT
      mp."id" as "id",
      mp."item_id" as "link_id",
      mp."path_item_id" as "parent_id",
      mp."path_item_depth" as "depth",
      mp."root_id" as "root_id",
      mp."position_id" as "position_id",
      mp."group_id" as "tree_id",
      (mp."item_id" = mp."path_item_id") as "self"
    FROM
    ${MP_TABLE_NAME} as mp;
  `);
  await api.query({
    type: 'track_table',
    args: {
      schema: SCHEMA,
      name: TREE_TABLE_NAME,
    },
  });
  upTreeSchema({ api });
};

export const down = async () => {
  log('down');
  log('tree view');
  await downTreeSchema({ api });
  await api.query({
    type: 'untrack_table',
    args: {
      table: {
        schema: SCHEMA,
        name: TREE_TABLE_NAME,
      },
      cascade: true,
    },
  });
  await api.sql(sql`
    DROP VIEW IF EXISTS ${SCHEMA}."tree" CASCADE;
  `);
  log('dropInclude');
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__insert__function CASCADE;`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__update__function CASCADE;`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__tree_include__delete__function CASCADE;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__insert__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__update__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__tree_include__delete__trigger ON "${LINKS_TABLE_NAME}";`);
  log('dropRels');
  await downRels({
    MP_TABLE: MP_TABLE_NAME,
    GRAPH_TABLE: LINKS_TABLE_NAME,
    api,
  });
  log('dropTrigger');
  await api.sql(trigger.downFunctionInsertNode());
  await api.sql(trigger.downFunctionUpdateNode());
  await api.sql(trigger.downFunctionDeleteNode());
  await api.sql(trigger.downTriggerDelete());
  await api.sql(trigger.downTriggerUpdate());
  await api.sql(trigger.downTriggerInsert());
  log('dropTable');
  await downTable({
    MP_TABLE: MP_TABLE_NAME,
    api,
  });
};
