import { gql } from '@apollo/client';
import { generateApolloClient } from '@deepcase/hasura/client';
import Debug from 'debug';
import { generateMutation, generateSerial } from '../imports/gql';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { TABLE_NAME as STRING_TABLE_NAME } from './1616701513783-type-table-string';

const debug = Debug('deepcase:deepgraph:migrations:types');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const up = async () => {
  debug('up');
  const mutateResult = await client.mutate(generateSerial({
    actions: [
      generateMutation({ // 1 type type
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 1,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 1, value: 'type' } },
      }),
      generateMutation({ // type string
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 2,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 2, value: 'string' } },
      }),
      generateMutation({ // type name
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 3,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 3, value: 'name' } },
      }),
      generateMutation({ // type number
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 4,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 4, value: 'number' } },
      }),
      generateMutation({ // type boolean
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 5,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 5, value: 'boolean' } },
      }),
      generateMutation({ // type any
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 6,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 6, value: 'any' } },
      }),
      generateMutation({ // type selector
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 7,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 7, value: 'selector' } },
      }),
      generateMutation({ // type selection
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 8,*/ type_id: 1, from_id: 7, to_id: 6 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 8, value: 'selection' } },
      }),
      generateMutation({ // type rule
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 9,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 9, value: 'rule' } },
      }),
      generateMutation({ // type subject
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 10,*/ type_id: 1, from_id: 9, to_id: 7 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 10, value: 'rule_subject' } },
      }),
      generateMutation({ // type object
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 11,*/ type_id: 1, from_id: 9, to_id: 7 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 11, value: 'rule_object' } },
      }),
      generateMutation({ // type action
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 12,*/ type_id: 1, from_id: 9, to_id: 7 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 12, value: 'rule_action' } },
      }),
      generateMutation({ // type contain
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 13,*/ type_id: 1, from_id: 6, to_id: 6 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 13, value: 'contain' } },
      }),
      generateMutation({ // type subject
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 14,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 14, value: 'subject' } },
      }),
      generateMutation({ // type select
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 15,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 15, value: 'select' } },
      }),
      generateMutation({ // type insert
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 16,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 16, value: 'insert' } },
      }),
      generateMutation({ // type update
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 17,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 17, value: 'update' } },
      }),
      generateMutation({ // type delete
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 18,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 18, value: 'delete' } },
      }),
      generateMutation({ // type allow
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 19,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 19, value: 'allow' } },
      }),
      generateMutation({ // type handle
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { /*id: 20,*/ type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 20, value: 'handle' } },
      }),
    ],
    name: 'INSERT_TYPE_TYPE',
  }));
};

export const down = async () => {
  debug('down');
  const mutateResult = await client.mutate(generateSerial({
    actions: [
      generateMutation({
        tableName: LINKS_TABLE_NAME, operation: 'delete',
        variables: { where: { id: { _in: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] } } },
      }),
    ],
    name: 'DELETE_TYPE_TYPE'
  }));
};