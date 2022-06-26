
import Debug from 'debug';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from '../imports/client';;
import { api, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { sql } from '@deep-foundation/hasura/sql';

const debug = Debug('deeplinks:migrations:plv8');
const log = debug.extend('log');
const error = debug.extend('error');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

export const up = async () => {
  log('up');

  const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');
  const handleUpdateTypeId = await deep.id('@deep-foundation/core', 'HandleUpdate');
  const handleDeleteTypeId = await deep.id('@deep-foundation/core', 'HandleDelete');

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__in__trasaction__handler__prepare__function(link json, handleTypeId bigint) RETURNS JSON AS $$
  var typeHandlers = plv8.execute('SELECT * FROM links WHERE "from_id" = $1 AND "type_id" = $2', [ link.type_id, handleTypeId ]);
  var selectorHandlers = [];
  var selectors = plv8.execute(
    'SELECT s.selector_id, h.id as handle_operation_id, s.bool_exp_id
      FROM selectors s, links h
      WHERE
          s.item_id = $1
      AND s.selector_id = h.from_id
      AND h.type_id = $2',
    [ link.id, handleTypeId ]
  );
  
  var hasura_session = plv8.execute("select current_setting('hasura.user', 't')");
  var user_id = JSON.parse(hasura_session[0].current_setting)['x-hasura-role'];

  for (var i = 0; i < selectors.length; i++){
    if (!selectors[i].bool_exp_id || plv8.execute('bool_exp_execute($1,$2,$3)', [link.id, selectors[i].bool_exp_id, user_id])) selectorHandlers.push(selectors[i]);
  }
  return { typeHandlers, selectorHandlers };
  $$ LANGUAGE plv8;`);

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__in__trasaction__insert__handler__function() RETURNS TRIGGER AS $$ 
    var prepare = plv8.find_function("${LINKS_TABLE_NAME}__in__trasaction__handler__prepare__function");
    var prepared = prepare(NEW, ${handleInsertTypeId});

    return NEW;
  $$ LANGUAGE plv8;`);
  
  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__in__trasaction__update__handler__function() RETURNS TRIGGER AS $$ 
    var prepare = plv8.find_function("${LINKS_TABLE_NAME}__in__trasaction__handler__prepare__function");
    var prepared = prepare(NEW, ${handleUpdateTypeId});

    return NEW;
  $$ LANGUAGE plv8;`);

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__in__trasaction__delete__handler__function() RETURNS TRIGGER AS $$ 
    var prepare = plv8.find_function("${LINKS_TABLE_NAME}__in__trasaction__handler__prepare__function");
    var prepared = prepare(OLD, ${handleDeleteTypeId});

    return NEW;
  $$ LANGUAGE plv8;`);

  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__in__trasaction__insert__handler__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__insert__function();`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__in__trasaction__update__handler__trigger AFTER UPDATE ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__update__function();`);
  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__in__trasaction__delete__handler__trigger AFTER DELETE ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__promise__delete__function();`);

};

export const down = async () => {
  log('down');

  // await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__in__trasaction__handler__trigger ON "${LINKS_TABLE_NAME}";`);
  // await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__in__trasaction__handler__function CASCADE;`);
};
