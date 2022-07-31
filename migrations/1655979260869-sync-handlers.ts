
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

const handleInsertTypeId = 49; // await deep.id('@deep-foundation/core', 'HandleInsert');

const newSelect = `plv8.execute(\`SELECT links.id as id, links.to_id as to_id FROM links, strings WHERE links.type_id=3 AND strings.link_id=links.id AND strings.value='\${item}' AND links.from_id=\${query_id}\`)[0];`;
const insertLinkString = `\`INSERT INTO links (type_id\${id ? ', id' : ''}\${from_id ? ', from_id' : ''}\${to_id ? ', to_id' : ''}) VALUES (\${type_id}\${id ? \`, \${id}\` : ''}\${from_id ? \`, \${from_id}\` : ''}\${to_id ? \`, \${to_id}\` : ''}) RETURNING id\``;
const insertValueString = `\`INSERT INTO \${number ? 'number' : string ? 'string' : object ? 'object' : ''}s ( link_id, value ) VALUES (\${linkId} , '\${value}') RETURNING ID\``
const deleteString = `\`DELETE FROM links WHERE id=\${id}::bigint RETURNING ID\``;

const typeHandlers = `plv8.execute(\`SELECT coalesce(json_agg("root"), '[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_4_e" FROM ( SELECT "_3_root.base"."value" AS "value",  "_3_root.base"."id" AS "id"  ) AS "_4_e" ) ) AS "root" FROM ( SELECT * FROM "public"."strings" WHERE ( EXISTS ( SELECT 1 FROM "public"."links" AS "_0__be_0_links" WHERE ( ( ( ("_0__be_0_links"."id") = ("public"."strings"."link_id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_1__be_1_links" WHERE ( ( ( ("_1__be_1_links"."to_id") = ("_0__be_0_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_2__be_2_links" WHERE ( ( ( ("_2__be_2_links"."to_id") = ("_1__be_1_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( (("_2__be_2_links"."from_id") = ($1 :: bigint)) AND ('true') ) AND ( ( (("_2__be_2_links"."type_id") = ($2 :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ( ( (("_1__be_1_links"."type_id") = (('35') :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ( ( (("_0__be_0_links"."type_id") = (('30') :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) ) AS "_3_root.base" ) AS "_5_root"\`, [ link.type_id, handletypeid ])[0].root.map((handler)=>{return {value: handler?.value, id: handler?.id}} )`;

const selectorHandlers = `plv8.execute(\`SELECT coalesce(json_agg("root"), '[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_4_e" FROM ( SELECT "_3_root.base"."value" AS "value", "_3_root.base"."id" AS "id" ) AS "_4_e" ) ) AS "root" FROM ( SELECT * FROM "public"."strings" WHERE ( EXISTS ( SELECT 1 FROM "public"."links" AS "_0__be_0_links" WHERE ( ( ( ("_0__be_0_links"."id") = ("public"."strings"."link_id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_1__be_1_links" WHERE ( ( ( ("_1__be_1_links"."to_id") = ("_0__be_0_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_2__be_2_links" WHERE ( ( ( ("_2__be_2_links"."to_id") = ("_1__be_1_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( ( ("_2__be_2_links"."from_id") = ANY($1 :: bigint array) ) AND ('true') ) AND ( ( (("_2__be_2_links"."type_id") = ($2 :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ( ( (("_1__be_1_links"."type_id") = (('35') :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ( ( (("_0__be_0_links"."type_id") = (('30') :: bigint)) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) ) AS "_3_root.base" ) AS "_5_root"\`, [ testedSelectors, handletypeid ])[0].root.map((handler)=>{return{value: handler?.value, id: handler?.id}})`;

const pckg = `typeof(start) === 'string' ? \`SELECT links.id as id FROM links, strings WHERE links.type_id=2 AND strings.link_id=links.id AND strings.value='\${start}'\` : \`SELECT links.id as id FROM WHERE links.id=\${start}\``;

const checkInsertLink = `\`SELECT count(id) > 0 FROM "public"."links" WHERE ( ( ( EXISTS ( SELECT 1 FROM "public"."can" WHERE ("public"."can"."object_id") = ("public"."links"."id") AND (("public"."can"."action_id") = (28 :: bigint)) AND ("public"."can"."subject_id") = ($1 :: bigint) ) ) OR ( EXISTS ( SELECT 1 FROM "public"."links" WHERE EXISTS ( SELECT 1 FROM "public"."strings" WHERE ("public"."strings"."link_id") = ("public"."links"."id") AND ("public"."strings"."value" = 'admin'::text) ) AND ("public"."links"."from_id" = 71::bigint) AND ("public"."links"."type_id" = 3::bigint) AND ("public"."links"."to_id" = $1::bigint) ) ) ) AND (("public"."links"."id") = ($2 :: bigint)) )\``;

const checkLinkPermission = `(linkId, userId) => {
  return true;
}`

const deepFabric =  /*javascript*/`(ownerId) => { 
  return {
    id: (options) => {
      const { start, path } = options;
      const pathToWhere = (start, path) => {
        const pckg = ${pckg};
        let query_id = plv8.execute(pckg)[0].id;
        for (let p = 0; p < path.length; p++) {
          const item = path[p]
          if (typeof(item) !== 'boolean') {
            const newSelect = ${newSelect};
            query_id = p === path.length-1 ? newSelect.to_id : newSelect.id;
            if (!query_id) return undefined;
          }
        }
        return query_id;
      }
      const result = pathToWhere(start, path);
      if (!result && path[path.length - 1] !== true) {
        return({error: 'Id not found by'});
      }
      return result;
    },
    insert: function(options) {
      const { id, type_id, from_id, to_id, number, string, object } = options;
      const ids = {};
      let insertLinkString = ${insertLinkString};
      const linkId = plv8.execute(insertLinkString)[0].id;
      ids.link = linkId;
      const linkCheck = checkLinkPermission(linkId, ownerId);
      if (!linkCheck) {
        this.delete(linkId);
        return ids;
      }
      const value = number || string || object;
      if (!value) return ids;
      const insertValueString = ${insertValueString};
      const valueId = plv8.execute(insertValueString)[0].id;
      ids.value = valueId
      return ids;
    },
    delete: function(options) {
      const { id } = options;
      const deleteString = ${deleteString};
      const linkId = plv8.execute(deleteString)[0].id;
      return linkId;
    }
  }
}`;

const prepareFunction = /*javascript*/`

  const getOwner = () => 1;

  const typeHandlers = ${typeHandlers};
  for (let i = 0; i < typeHandlers.length; i++){ typeHandlers[i].owner = getOwner(typeHandlers[i].id); }

  const selectors = plv8.execute( 'SELECT s.selector_id, h.id as handle_operation_id, s.bool_exp_id FROM selectors s, links h WHERE s.item_id = $1 AND s.selector_id = h.from_id AND h.type_id = $2', [ link.id, handletypeid ] );

  const testedSelectors = [];
  for (let i = 0; i < selectors.length; i++){ if (!selectors[i].bool_exp_id || plv8.execute('bool_exp_execute($1,$2,$3)', [link.id, selectors[i].bool_exp_id, user_id])) testedSelectors.push(selectors[i].selector_id); }
  

  const selectorHandlers = ${selectorHandlers};
  for (let i = 0; i < selectorHandlers.length; i++){ selectorHandlers[i].owner = getOwner(selectorHandlers[i].id); }

  return typeHandlers.concat(selectorHandlers);
`;

const insertHandlerFunction = /*javascript*/`
  const prepare = plv8.find_function("${LINKS_TABLE_NAME}__sync__handler__prepare__function");
  const prepared = prepare(NEW, ${handleInsertTypeId});

  const checkLinkPermission = ${checkLinkPermission};

  const deepFabric = ${deepFabric};

  for (let i = 0; i < prepared.length; i++) {
    (()=>{
        const checkLinkPermission = undefined;
        const hasura_session = undefined;
        const user_id = undefined;
        const deep = deepFabric(prepared[i].id);
        const func = eval(prepared[i].value);
        func(deep, {oldLink: OLD, newLink: NEW});
    })()
  };
  return NEW;
`;

const deepClientFunction = /*javascript*/`const checkLinkPermission = ${checkLinkPermission}; const deep = (${deepFabric})(clientlinkid); const result = deep[operation](args);  return result;`;

export const createPrepareFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__handler__prepare__function(link jsonb, handletypeid bigint) RETURNS jsonb AS $$ ${prepareFunction} $$ LANGUAGE plv8;`;
export const createDeepClientFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__deep__client(clientLinkId bigint, operation text, args jsonb) RETURNS jsonb AS $$ ${deepClientFunction} $$ LANGUAGE plv8;`;
export const createSyncInsertTriggerFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__insert__handler__function() RETURNS TRIGGER AS $$ ${insertHandlerFunction} $$ LANGUAGE plv8;`;
export const createSyncInsertTrigger = sql`CREATE TRIGGER ${LINKS_TABLE_NAME}__sync__insert__handler__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__sync__insert__handler__function();`;

export const dropPrepareFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__get__deep__client`;
export const dropDeepClientFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__handler__prepare__function;`;
export const dropSyncInsertTrigger = sql`DROP TRIGGER IF EXISTS ${LINKS_TABLE_NAME}__sync__handler__trigger ON "${LINKS_TABLE_NAME}";`;
export const dropSyncInsertTriggerFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__handler__function CASCADE;`;

export const up = async () => {
  log('up');

  await api.sql(sql`CREATE EXTENSION IF NOT EXISTS plv8;`);

  await api.sql(createPrepareFunction);
  await api.sql(createDeepClientFunction);
  await api.sql(createSyncInsertTriggerFunction);
  await api.sql(createSyncInsertTrigger);

};

export const down = async () => {
  log('down');

  await api.sql(dropPrepareFunction);
  await api.sql(dropDeepClientFunction);
  await api.sql(dropSyncInsertTrigger);
  await api.sql(dropSyncInsertTriggerFunction);

  await api.sql(sql`DROP EXTENSION IF EXISTS plv8 CASCADE;`);
};
