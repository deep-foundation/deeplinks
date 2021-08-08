import Debug from 'debug';
import { generateDown, generateUp } from '../imports/type-table';
import { api, SCHEMA, TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';

const debug = Debug('deepcase:deeplinks:migrations:type-table-string');

export const TABLE_NAME = 'dc_dg_string';

export const up = async () => {
  debug('up');
  await (generateUp({
    schemaName: SCHEMA,
    tableName: TABLE_NAME,
    valueType: 'text',
    linkRelation: 'string',
    linksTableName: LINKS_TABLE_NAME,
    api,
  })());
};

export const down = async () => {
  debug('down');
  await (generateDown({
    schemaName: SCHEMA,
    tableName: TABLE_NAME,
    valueType: 'text',
    linkRelation: 'string',
    linksTableName: LINKS_TABLE_NAME,
    api,
  })());
};