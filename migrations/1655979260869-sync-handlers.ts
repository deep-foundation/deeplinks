
import Debug from 'debug';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from '../imports/client';;
import { api, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { sql } from '@deep-foundation/hasura/sql';
import { _ids } from '../imports/client';

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

// plv8.elog(ERROR, JSON.stringify(Number(link.id))); 

const handleInsertTypeId = _ids?.['@deep-foundation/core']?.HandleInsert; // await deep.id('@deep-foundation/core', 'HandleInsert');
const handleUpdateTypeId = _ids?.['@deep-foundation/core']?.HandleUpdate; // await deep.id('@deep-foundation/core', 'HandleUpdate');
const handleDeleteTypeId = _ids?.['@deep-foundation/core']?.HandleDelete;; // await deep.id('@deep-foundation/core', 'HandleDelete');
const userTypeId = _ids?.['@deep-foundation/core']?.User // await deep.id('@deep-foundation/core', 'User');
const packageTypeId = _ids?.['@deep-foundation/core']?.Package // await deep.id('@deep-foundation/core', 'Package');
const containTypeId = _ids?.['@deep-foundation/core']?.Contain // await deep.id('@deep-foundation/core', 'Contain');
const plv8SupportsJsTypeId = _ids?.['@deep-foundation/core']?.plv8SupportsJs // await deep.id('@deep-foundation/core', 'plv8SupportsJs');
const HandlerTypeId = _ids?.['@deep-foundation/core']?.Handler // await deep.id('@deep-foundation/core', 'Handler');
const SupportsTypeId = _ids?.['@deep-foundation/core']?.Supports // await deep.id('@deep-foundation/core', 'Supports');
const SyncTextFileTypeId = _ids?.['@deep-foundation/core']?.SyncTextFile // await deep.id('@deep-foundation/core', 'SyncTextFileType');
const SelectorTypeId = _ids?.['@deep-foundation/core']?.Selector // await deep.id('@deep-foundation/core', 'SelectorType');
const AllowSelectTypeId = _ids?.['@deep-foundation/core']?.AllowSelectType // await deep.id('@deep-foundation/core', 'AllowSelectType');
const AllowSelectId = _ids?.['@deep-foundation/core']?.AllowSelect // await deep.id('@deep-foundation/core', 'AllowSelect');
const AllowAdminId = _ids?.['@deep-foundation/core']?.AllowAdmin // await deep.id('@deep-foundation/core', 'AllowAdmin');

const newSelect = `\`SELECT links.id as id, links.to_id as to_id FROM links, strings WHERE links.type_id=${containTypeId} AND strings.link_id=links.id AND strings.value='\${item}' AND links.from_id=\${query_id}\``;
const insertLinkString = `\`INSERT INTO links (type_id\${id ? ', id' : ''}\${from_id ? ', from_id' : ''}\${to_id ? ', to_id' : ''}) VALUES (\${type_id}\${id ? \`, \${id}\` : ''}\${from_id ? \`, \${from_id}\` : ''}\${to_id ? \`, \${to_id}\` : ''}) RETURNING id\``;
const updateLinkString = `\`UPDATE links SET \${set} WHERE \${where} RETURNING id;\``;

const insertValueString = `\`INSERT INTO \${number ? 'number' : string ? 'string' : object ? 'object' : ''}s ( link_id, value ) VALUES (\${linkid} , '\${value}') RETURNING ID\``

const deleteString = `\`DELETE FROM links WHERE id=$1::bigint RETURNING ID\``;

const typeHandlers = `\`SELECT coalesce(json_agg("root"),'[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_5_e" FROM ( SELECT "_4_root.base"."id" AS "id" ,"public"."links__value__function"("link" => "_4_root.base") AS "valuseResult" ,"handler"."id" as "handler" ) AS "_5_e" ) ) AS "root" FROM ( SELECT * FROM "public"."links" AS "SyncTextFile" WHERE ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "handler" WHERE ( ( ( ("handler"."to_id") = ("SyncTextFile"."id") ) ) AND ( ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "supports" WHERE ( ( ( ("supports"."id") = ("handler"."from_id") ) ) AND ( ( ( ( (("supports"."type_id") = (${SupportsTypeId} :: bigint)) ) AND ( ( (("supports"."id") = (${plv8SupportsJsTypeId} :: bigint)) ) ) ) ) ) ) ) ) AND ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "HandlerOperation" WHERE ( ( ( ("HandlerOperation"."to_id") = ("handler"."id") ) ) AND ( ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "HandleTypeLink" WHERE ( ( ( ("HandleTypeLink"."id") = ("HandlerOperation"."from_id") ) ) AND ( ( ( ( (("HandleTypeLink"."type_id") = ($1 :: bigint)) ) ) ) ) ) ) ) AND ( ( (("HandlerOperation"."type_id") = ($2 :: bigint)) AND ('true') ) ) ) ) ) ) ) ) AND ( ( (("handler"."type_id") = (${HandlerTypeId} :: bigint)) ) ) ) ) ) ) ) ) ) AND (("SyncTextFile"."type_id") = (${SyncTextFileTypeId} :: bigint)) ) ) AS "_4_root.base", "public"."links" AS "handler" WHERE "handler"."to_id" = "_4_root.base"."id" AND "handler"."type_id" = ${HandlerTypeId} :: bigint ) AS "_6_root"\``;

const selectorHandlers = `\`SELECT coalesce(json_agg("root"),'[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_5_e" FROM ( SELECT "_4_root.base"."id" AS "id" ,"public"."links__value__function"("link" => "_4_root.base") AS "valuseResult" ,"handler"."id" AS "handler" ) AS "_5_e" ) ) AS "root" FROM ( SELECT * FROM "public"."links" AS "SyncTextFile" WHERE ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "handler" WHERE ( ( ( ("handler"."to_id") = ("SyncTextFile"."id") ) ) AND ( ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "supports" WHERE ( ( ( ("supports"."id") = ("handler"."from_id") ) ) AND ( ( ( ( (("supports"."type_id") = (${SupportsTypeId} :: bigint)) ) AND ( ( (("supports"."id") = (${plv8SupportsJsTypeId} :: bigint)) ) ) ) ) ) ) ) ) AND ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "HandlerOperation" WHERE ( ( ( ("HandlerOperation"."to_id") = ("handler"."id") ) ) AND ( ( ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "selector" WHERE ( ( ( ("selector"."id") = ("HandlerOperation"."from_id") ) ) AND ( ( ( ( (("selector"."type_id") = (${SelectorTypeId} :: bigint)) ) AND ( ( ( ("selector"."id") = ANY($1 :: bigint array) ) ) ) ) ) ) ) ) ) AND ( ( (("HandlerOperation"."type_id") = ($2 :: bigint)) ) ) ) ) ) ) ) ) AND ( ( (("handler"."type_id") = (${HandlerTypeId} :: bigint)) ) ) ) ) ) ) ) ) ) AND (("SyncTextFile"."type_id") = (${SyncTextFileTypeId} :: bigint)) ) ) AS "_4_root.base", "public"."links" AS "handler" WHERE "handler"."to_id" = "_4_root.base"."id" AND "handler"."type_id" = ${HandlerTypeId} :: bigint ) AS "_6_root"\``;

const pckg = `typeof(start) === 'string' ? \`SELECT links.id as id FROM links, strings WHERE links.type_id=${packageTypeId} AND strings.link_id=links.id AND strings.value='\${start}'\` : \`SELECT links.id as id FROM WHERE links.id=\${start}\``;

const checkInsertLink = `\`SELECT coalesce(json_agg("root"), '[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_4_e" FROM ( SELECT "_3_root.base"."id" AS "id" ) AS "_4_e" ) ) AS "root" FROM ( SELECT * FROM "public"."links" WHERE ( ( EXISTS ( SELECT 1 FROM "public"."links" AS "_0__be_0_links" WHERE ( ( ( ("_0__be_0_links"."id") = ("public"."links"."type_id") ) AND ('true') ) AND ( ('true') AND ( ( ( EXISTS ( SELECT 1 FROM "public"."can" AS "_1__be_1_can" WHERE ( ( ( ("_1__be_1_can"."object_id") = ("_0__be_0_links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( (("_1__be_1_can"."action_id") = (${AllowSelectTypeId} :: bigint)) AND ('true') ) AND ( ( ( ("_1__be_1_can"."subject_id") = ($2 :: bigint) ) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) AND ('true') ) AND ('true') ) ) ) ) ) OR ( ( EXISTS ( SELECT 1 FROM "public"."can" AS "_2__be_2_can" WHERE ( ( ( ("_2__be_2_can"."object_id") = ("public"."links"."id") ) AND ('true') ) AND ( ('true') AND ( ( ( (("_2__be_2_can"."action_id") = (${AllowSelectId} :: bigint)) AND ('true') ) AND ( ( ( ("_2__be_2_can"."subject_id") = ($2 :: bigint) ) AND ('true') ) AND ('true') ) ) AND ('true') ) ) ) ) ) OR ('true') ) OR ( EXISTS ( SELECT 1 FROM "public"."can" WHERE "object_id" = $2 :: bigint AND "action_id" = ${AllowAdminId} :: bigint AND "subject_id" = $2 :: bigint ) ) ) AND "public"."links"."id"= $1 ) AS "_3_root.base" ) AS "_5_root"\``;

const mpUp = `\`SELECT coalesce(json_agg("root"),'[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_5_e" FROM ( SELECT "_1_root.base"."id" AS "id" ,"_4_root.or.path_item"."path_item" AS "path_item" ,"_1_root.base"."path_item_depth" AS "path_item_depth" ,"_1_root.base"."position_id" AS "position_id" ) AS "_5_e" ) ) AS "root" FROM ( SELECT * FROM "public"."mp" WHERE ( (("public"."mp"."item_id") = ($1 :: bigint)) AND ( EXISTS ( SELECT 1 FROM "public"."links" AS "_0__be_0_links" WHERE ( ( ( ("_0__be_0_links"."id") = ("public"."mp"."path_item_id") ) AND ('true') ) AND ( ('true') AND ( ( ( ( ("_0__be_0_links"."type_id") = ANY((ARRAY [$2, $3]) :: bigint array) ) AND ('true') ) AND ('true') ) AND ('true') ) ) ) ) ) ) ) AS "_1_root.base" LEFT OUTER JOIN LATERAL ( SELECT row_to_json( ( SELECT "_3_e" FROM ( SELECT "_2_root.or.path_item.base"."id" AS "id" ,"_2_root.or.path_item.base"."type_id" AS "type_id" ,"public"."links__value__function"("link" => "_2_root.or.path_item.base") AS "value" ) AS "_3_e" ) ) AS "path_item" FROM ( SELECT * FROM "public"."links" WHERE (("_1_root.base"."path_item_id") = ("id")) LIMIT 1 ) AS "_2_root.or.path_item.base" ) AS "_4_root.or.path_item" ON ('true') ) AS "_6_root"\``;

const mpMe = `\`SELECT coalesce(json_agg("root"), '[]') AS "root" FROM ( SELECT row_to_json( ( SELECT "_1_e" FROM ( SELECT "_0_root.base"."id" AS "id", "_0_root.base"."path_item_depth" AS "path_item_depth", "_0_root.base"."position_id" AS "position_id" ) AS "_1_e" ) ) AS "root" FROM ( SELECT * FROM "public"."mp" WHERE ( (("public"."mp"."item_id") = ($1 :: bigint)) AND ( ("public"."mp"."path_item_id") = ($1 :: bigint) ) ) ) AS "_0_root.base" ) AS "_2_root"\``;

const checkSelectLinkPermission =  /*javascript*/`(linkid, userId ) => {
  const result = !!plv8.execute(${checkInsertLink}, [ linkid, userId ])[0]?.root;
  return !!result;
}`

// const checkSelectLinkPermission = `() => {return true}`;
const checkUpdateLinkPermission = `() => {return true}`;
const checkDeleteLinkPermission = `() => {return true}`;


const prepareFunction = /*javascript*/`

  const getOwner = (handlerId) => {
    const mpUp = plv8.execute(${mpUp}, [ handlerId, ${userTypeId}, ${packageTypeId} ])[0]?.root;
    const mpMe = plv8.execute(${mpMe}, [ handlerId ])[0]?.root;
    
    const possibleOwners = mpMe.map((me) => {
      const getDepthDifference = (depth) => me.path_item_depth - depth;
      const up = mpUp.filter((up) => up.position_id == me.position_id);
      const closestUp = up.sort((a, b) => getDepthDifference(a.path_item_depth) - getDepthDifference(b.path_item_depth))[0];;
      
      return closestUp?.path_item;
    }).filter(r => !!r);

    const ownerPackage = possibleOwners.find(r => r.type_id == ${packageTypeId});
    const ownerUser = possibleOwners.find(r => r.type_id == ${userTypeId});
    const ownerId = ownerPackage ? ownerPackage?.id : ownerUser ? ownerUser?.id : null;
    
    return ownerId;
  };

  const typeHandlers = plv8.execute(${typeHandlers}, [ link.type_id, handletypeid ])[0].root.map((textFile)=>{return {value: textFile?.valuseResult?.value, id: textFile?.handler}} );
  for (let i = 0; i < typeHandlers.length; i++){ typeHandlers[i].owner = getOwner(typeHandlers[i].id); }

  const selectors = plv8.execute( 'SELECT s.selector_id, h.id as handle_operation_id, s.bool_exp_id FROM selectors s, links h WHERE s.item_id = $1 AND s.selector_id = h.from_id AND h.type_id = $2', [ link.id, handletypeid ] );
  const testedSelectors = [];
  for (let i = 0; i < selectors.length; i++){ if (!selectors[i].bool_exp_id || plv8.execute('bool_exp_execute($1,$2,$3)', [link.id, selectors[i].bool_exp_id, user_id])) testedSelectors.push(selectors[i].selector_id); }
  

  const selectorHandlers = plv8.execute(${selectorHandlers}, [ testedSelectors, handletypeid ])[0].root.map((textFile)=>{return{value: textFile?.valuseResult?.value, id: textFile?.handler}});
  for (let i = 0; i < selectorHandlers.length; i++){ selectorHandlers[i].owner = getOwner(selectorHandlers[i].id); }

  const handlers = typeHandlers.concat(selectorHandlers);

  const sortById = ( a, b ) => {
    if ( a.id < b.id ){
      return -1;
    }
    if ( a.id > b.id ){
      return 1;
    }
    return 0;
  }

  return handlers.sort(sortById);
`;

const wherePush =  `\`\${whereFileds[i]} = \${_where[whereFileds[i]]}\``;
const setPush =  `\`\${setFileds[i]} = \${_set[setFileds[i]]}\``;

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
            const newSelect = plv8.execute(${newSelect})[0];;
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
      const linkid = plv8.execute(insertLinkString)[0]?.id;
      ids.link = linkid;
      const linkCheck = checkSelectLinkPermission(linkid, ownerId);
      if (!linkCheck) plv8.elog(ERROR, 'Insert not permitted');
      const value = number || string || object;
      if (!value) return ids;
      const insertValueString = ${insertValueString};
      const valueId = plv8.execute(insertValueString)[0]?.id;
      ids.value = valueId
      return ids;
    },
    update: function(options) {
      const { _set, ..._where } = options;
      const { id, type_id, from_id, to_id } = _where;
      const ids = {};
      const linkCheck = checkUpdateLinkPermission(id, ownerId);
      if (!linkCheck) plv8.elog(ERROR, 'Update not permitted');
      if ( !(!_set?.to_id && !_set?.from_id) && !(_set?.to_id && _set?.from_id)) {
        throw new Error('Partial update not permited');
      }
      const whereArr = [];
      const setArr = [];
      const whereFileds = Object.keys(_where).filter(key=>_where[key]);
      for (let i = 0; i < whereFileds.length; i++ ){
        whereArr.push(${wherePush});
      }
      const setFileds = Object.keys(_set).filter(key=>_set[key]);
      for (let i = 0; i < setFileds.length; i++ ){
        setArr.push(${setPush});
      }
      const where = whereArr.join(', ');
      const set = setArr.join(', ');
      let updateLinkString = ${updateLinkString};
      const linkid = plv8.execute(updateLinkString)[0].id;
      ids.link = linkid;
      return ids;
    },
    delete: function(options) {
      const { id } = options;
      const linkCheck = checkDeleteLinkPermission(id, ownerId);
      if (!linkCheck) plv8.elog(ERROR, 'Delete not permitted');
      const deleteString = ${deleteString};
      const linkid = plv8.execute(deleteString, [ id ])[0].id;
      return { link: linkid };
    }
  }
}`;

const handlerFuncion = handleOperationTypeId => /*javascript*/`
  const prepare = plv8.find_function("${LINKS_TABLE_NAME}__sync__handler__prepare__function");
  const prepared = prepare(${handleOperationTypeId === handleInsertTypeId ? 'NEW' : 'OLD'}, ${handleOperationTypeId});
  const checkSelectLinkPermission = ${checkSelectLinkPermission};
  const checkUpdateLinkPermission = ${checkUpdateLinkPermission};
  const checkDeleteLinkPermission = ${checkDeleteLinkPermission};
  const deepFabric = ${deepFabric};
  for (let i = 0; i < prepared.length; i++) {
    (()=>{
        const checkSelectLinkPermission = undefined;
        const deep = deepFabric(prepared[i].id);
        const func = eval(prepared[i].value);
        func(deep, {oldLink: OLD, newLink: NEW});
    })()
  };
  return NEW;
`;

const deepClientFunction = /*javascript*/`const checkSelectLinkPermission = ${checkSelectLinkPermission}; const checkUpdateLinkPermission = ${checkUpdateLinkPermission}; const checkDeleteLinkPermission = ${checkDeleteLinkPermission}; const deep = (${deepFabric})(clientlinkid); const result = deep[operation](args);  return result;`;

export const createPrepareFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__handler__prepare__function(link jsonb, handletypeid bigint) RETURNS jsonb AS $$ ${prepareFunction} $$ LANGUAGE plv8;`;
export const dropPrepareFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__deep__client CASCADE;`;

export const createDeepClientFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__deep__client(clientLinkId bigint, operation text, args jsonb) RETURNS jsonb AS $$ ${deepClientFunction} $$ LANGUAGE plv8;`;
export const dropDeepClientFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__handler__prepare__function CASCADE;`;

export const createSyncInsertTriggerFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__insert__handler__function() RETURNS TRIGGER AS $$ ${handlerFuncion(handleInsertTypeId)} $$ LANGUAGE plv8;`;
export const createSyncInsertTrigger = sql`CREATE TRIGGER z_${LINKS_TABLE_NAME}__sync__insert__handler__trigger AFTER INSERT ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__sync__insert__handler__function();`;
export const dropSyncInsertTrigger = sql`DROP TRIGGER z_${LINKS_TABLE_NAME}__sync__insert__handler__trigger ON "${LINKS_TABLE_NAME}";`;
export const dropSyncInsertTriggerFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__insert__handler__function CASCADE;`;

export const createSyncUpdateTriggerFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__update__handler__function() RETURNS TRIGGER AS $$ ${handlerFuncion(handleUpdateTypeId)} $$ LANGUAGE plv8;`;
export const createSyncUpdateTrigger = sql`CREATE TRIGGER z_${LINKS_TABLE_NAME}__sync__update__handler__trigger AFTER UPDATE ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__sync__update__handler__function();`;
export const dropSyncUpdateTrigger = sql`DROP TRIGGER z_${LINKS_TABLE_NAME}__sync__update__handler__trigger ON "${LINKS_TABLE_NAME}";`;
export const dropSyncUpdateTriggerFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__update__handler__function CASCADE;`;

export const createSyncDeleteTriggerFunction = sql`CREATE OR REPLACE FUNCTION ${LINKS_TABLE_NAME}__sync__delete__handler__function() RETURNS TRIGGER AS $$ ${handlerFuncion(handleDeleteTypeId)} $$ LANGUAGE plv8;`;
export const createSyncDeleteTrigger = sql`CREATE TRIGGER a_${LINKS_TABLE_NAME}__sync__delete__handler__trigger AFTER DELETE ON "links" FOR EACH ROW EXECUTE PROCEDURE ${LINKS_TABLE_NAME}__sync__delete__handler__function();`;
export const dropSyncDeleteTrigger = sql`DROP TRIGGER a_${LINKS_TABLE_NAME}__sync__delete__handler__trigger ON "${LINKS_TABLE_NAME}";`;
export const dropSyncDeleteTriggerFunction = sql`DROP FUNCTION IF EXISTS ${LINKS_TABLE_NAME}__sync__delete__handler__function CASCADE;`;


export const up = async () => {
  log('up');

  await api.sql(sql`CREATE EXTENSION IF NOT EXISTS plv8;`);

  await api.sql(createPrepareFunction);

  await api.sql(createDeepClientFunction);
  
  await api.sql(createSyncInsertTriggerFunction);
  await api.sql(createSyncInsertTrigger);

  await api.sql(createSyncUpdateTriggerFunction);
  await api.sql(createSyncUpdateTrigger);

  await api.sql(createSyncDeleteTriggerFunction);
  await api.sql(createSyncDeleteTrigger);

};

export const down = async () => {
  log('down');

  await api.sql(dropPrepareFunction);

  await api.sql(dropDeepClientFunction);

  await api.sql(dropSyncInsertTrigger);
  await api.sql(dropSyncInsertTriggerFunction);

  await api.sql(dropSyncUpdateTrigger);
  await api.sql(dropSyncUpdateTriggerFunction);

  await api.sql(dropSyncDeleteTrigger);
  await api.sql(dropSyncDeleteTriggerFunction);

  await api.sql(sql`DROP EXTENSION IF EXISTS plv8 CASCADE;`);
};
