
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

  await api.sql(sql`CREATE EXTENSION IF NOT EXISTS plv8;`);

  const handleInsertTypeId = await deep.id('@deep-foundation/core', 'HandleInsert');

  const deepClient = `{
    id: (start, ...path) => {
      const pathToWhere = (start, path) => {
        const pckg = typeof(start) === 'string' ? \`SELECT links.id as id FROM links, strings WHERE links.type_id=2 AND strings.link_id=links.id AND strings.value='\${start}'\` : \`SELECT links.id as id FROM WHERE links.id=\${start}\`;
        let query_id = plv8.execute(pckg)[0].id;
        for (let p = 0; p < path.length; p++) {
          const item = path[p]
          if (typeof(item) !== 'boolean') {
            const newSelect = plv8.execute(\`SELECT links.id as id, links.to_id as to_id FROM links, strings WHERE links.type_id=3 AND strings.link_id=links.id AND strings.value='\${item}' AND links.from_id=\${query_id}\`)[0];
            return p === path.length-1 ? newSelect.to_id : newSelect.id;
            if (!query_id) return undefined;
          }
        }
        return query_id;
      }
      const result = pathToWhere(start, path);
      if (!result && path[path.length - 1] !== true) {
        return({error: \`Id not found by [\${JSON.stringify([start, ...path])}]\`});
      }
      return result;
    },
    insert: (options) => {
      const { id, type_id, from_id, to_id, number, string, object } = options;
      const ids = {};
      let insertString = \`INSERT INTO links (type_id\${id ? ', id' : ''}\${from_id ? ', from_id' : ''}\${to_id ? ', to_id' : ''}) VALUES (\${type_id}\${id ? \`, \${id}\` : ''}\${from_id ? \`, \${from_id}\` : ''}\${to_id ? \`, \${to_id}\` : ''}) RETURNING id\`;
      const link = plv8.execute(insertString)[0].id;
      ids.link = link;
      const value = number || string || object;
      if (!value) return ids;
      const insertValue = \`; INSERT INTO \${number ? 'number' : string ? 'string' : object ? 'object' : ''}s ( link_id, value ) VALUES (\${link} , '\${value}') RETURNING ID\`
      ids.value = plv8.execute(insertValue)[0].id;
      return ids;
    }
  }`;

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__in__transaction__handler__prepare__function(link json, handletypeid bigint) RETURNS jsonb AS $$
  const typeHandlers = plv8.execute(\`SELECT coalesce(json_agg("root"), '[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_4_e" FROM ( SELECT "_3_root.base"."value" AS "value" ) AS "_4_e" ) ) AS "root" FROM ( SELECT * FROM "public"."strings" WHERE ( EXISTS ( SELECT 1 FROM "public"."links" AS "_0__be_0_links" WHERE ( ( ( ("_0__be_0_links"."id") = ("public"."strings"."link_id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_1__be_1_links" WHERE ( ( ( ("_1__be_1_links"."to_id") = ("_0__be_0_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_2__be_2_links" WHERE ( ( ( ("_2__be_2_links"."to_id") = ("_1__be_1_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( (("_2__be_2_links"."from_id") = ($1 :: bigint)) AND ('true') ) AND ( ( (("_2__be_2_links"."type_id") = ($2 :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ( ( (("_1__be_1_links"."type_id") = (('35') :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ( ( (("_0__be_0_links"."type_id") = (('30') :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) ) AS "_3_root.base" ) AS "_5_root"\`, [ link.type_id, handletypeid ])[0].root.map((handler)=>handler?.value);

  const testedSelectors = [];
  const selectors = plv8.execute( 'SELECT s.selector_id, h.id as handle_operation_id, s.bool_exp_id FROM selectors s, links h WHERE s.item_id = $1 AND s.selector_id = h.from_id AND h.type_id = $2', [ link.id, handletypeid ] );
  
  const hasura_session = plv8.execute("select current_setting('hasura.user', 't')");
  const user_id = JSON.parse(hasura_session[0].current_setting)['x-hasura-user-id'];

  for (let i = 0; i < selectors.length; i++){
    if (!selectors[i].bool_exp_id || plv8.execute('bool_exp_execute($1,$2,$3)', [link.id, selectors[i].bool_exp_id, user_id])) testedSelectors.push(selectors[i].selector_id);
  }

  const selectorHandlers = plv8.execute(\`SELECT coalesce(json_agg("root"), '[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_4_e" FROM ( SELECT "_3_root.base"."value" AS "value" ) AS "_4_e" ) ) AS "root" FROM ( SELECT * FROM "public"."strings" WHERE ( EXISTS ( SELECT 1 FROM "public"."links" AS "_0__be_0_links" WHERE ( ( ( ("_0__be_0_links"."id") = ("public"."strings"."link_id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_1__be_1_links" WHERE ( ( ( ("_1__be_1_links"."to_id") = ("_0__be_0_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_2__be_2_links" WHERE ( ( ( ("_2__be_2_links"."to_id") = ("_1__be_1_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( ( ("_2__be_2_links"."from_id") = ANY($1 :: bigint array) ) AND ('true') ) AND ( ( (("_2__be_2_links"."type_id") = ($2 :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ( ( (("_1__be_1_links"."type_id") = (('35') :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ( ( (("_0__be_0_links"."type_id") = (('30') :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) ) AS "_3_root.base" ) AS "_5_root"\`, [ testedSelectors, handletypeid ])[0].root.map((handler)=>handler?.value);

  return typeHandlers.concat(selectorHandlers);
  $$ LANGUAGE plv8;`);

  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__deep__client(operation text, args json) RETURNS JSON AS $$
    const deep = ${deepClient};
    return deep[operation](args.start, ...args.path);
  $$ LANGUAGE plv8;`);


  await api.sql(sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__in__transaction__insert__handler__function() RETURNS TRIGGER AS $$ 
    const prepare = plv8.find_function("${LINKS_TABLE_NAME}__in__transaction__handler__prepare__function");
    const prepared = prepare(NEW, ${handleInsertTypeId});
    const deep = ${deepClient}; 
    for (let i = 0; i < prepared.length; i++) {
    (()=>{
      const checkLinkPermission = undefined;
      const checkValuePermission = undefined;
      const plv8 = undefined; 
      try {
        return result = eval(prepared[i])(deep, {oldLink: OLD, newLink: NEW});
      } catch (e){
        return;
      }
    })()};
    
    return NEW;
  $$ LANGUAGE plv8;`);

  await api.sql(sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__in__transaction__insert__handler__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__in__transaction__insert__handler__function();`);

};

export const down = async () => {
  log('down');

  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__get__deep__client`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__in__transaction__handler__prepare__function;`);
  await api.sql(sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__in__transaction__handler__trigger ON "${LINKS_TABLE_NAME}";`);
  await api.sql(sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__in__transaction__handler__function CASCADE;`);

  await api.sql(sql`DROP EXTENSION IF EXISTS plv8 CASCADE;`);
};
