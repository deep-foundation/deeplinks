import { gql } from '@apollo/client';
import { generateApolloClient } from '@deepcase/hasura/client';
import Debug from 'debug';
import { generateMutation, generateSerial } from '../imports/gql';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';
import { TABLE_NAME as STRING_TABLE_NAME } from './1616701513783-type-table-string';

const debug = Debug('deepcase:deepgraph:migrations:type-type');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const up = async () => {
  debug('up');
  const mutateResult = await client.mutate(generateSerial({
    actions: [
      generateMutation({ // type type
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 1, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 1, value: 'type' } },
      }),
      generateMutation({ // type string
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 2, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 2, value: 'string' } },
      }),
      generateMutation({ // type name
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 3, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 3, value: 'name' } },
      }),
      generateMutation({ // type number
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 4, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 4, value: 'number' } },
      }),
      generateMutation({ // type boolean
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 5, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 5, value: 'boolean' } },
      }),
      generateMutation({ // type any
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 6, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 6, value: 'any' } },
      }),
      generateMutation({ // type selector
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 7, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 7, value: 'selector' } },
      }),
      generateMutation({ // type selection
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 8, type_id: 1, from_id: 7, to_id: 6 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 8, value: 'selection' } },
      }),
      generateMutation({ // type rule
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 9, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 9, value: 'rule' } },
      }),
      generateMutation({ // type subject
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 10, type_id: 1, from_id: 9, to_id: 7 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 10, value: 'subject' } },
      }),
      generateMutation({ // type object
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 11, type_id: 1, from_id: 9, to_id: 7 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 11, value: 'object' } },
      }),
      generateMutation({ // type action
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 12, type_id: 1, from_id: 9, to_id: 7 } },
      }),
      generateMutation({
        tableName: STRING_TABLE_NAME, operation: 'insert',
        variables: { objects: { link_id: 12, value: 'action' } },
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
        variables: { where: { id: { _in: [1,2,3,4,5,6,7] } } },
      }),
    ],
    name: 'DELETE_TYPE_TYPE'
  }));
};