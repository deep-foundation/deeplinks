import gql from 'graphql-tag';
import { useMutation } from '@apollo/client';
import { useCallback } from 'react';
import { generateMutation, generateSerial, ISerialOptions } from '@deepcase/deeplinks/imports/gql';

export const JWT = gql`query JWT($linkId: Int) {
  jwt(input: {role: "link", linkId: $linkId}) {
    linkId
    token
    role
  }
}`;

export const LINKS_BODY_string = `
id
type_id
type {
  string {
    value
  }
}
from_id
from {
  string {
    value
  }
}
to_id
to {
  string {
    value
  }
}
string {
  id
  value
}
number {
  id
  value
}
bool_exp {
  id
  gql
}
_by_root {
  id
  item_id
  path_item_depth
  path_item_id
  position_id
  root_id
}
_by_path_item {
  id
  item_id
  path_item_depth
  path_item_id
  position_id
  root_id
}
_by_item {
  id
  item_id
  path_item_depth
  path_item_id
  position_id
  root_id
}
in { from_id id to_id type_id } out { from_id id to_id type_id }`;

export const LINKS_string = `{
  links {
    ${LINKS_BODY_string}
  }
}`;
export const LINKS = gql`${LINKS_string}`;

export const LINKS_WHERE_string = `subscription ($where: links_bool_exp){
  links(where: $where) {
    ${LINKS_BODY_string}
  }
}`;
export const LINKS_WHERE = gql`${LINKS_WHERE_string}`;

export const INSERT_LINKS = gql`mutation INSERT_LINKS($objects: [links_insert_input!]!) { insert_links: insert_links(objects: $objects) { returning { id } } }`;
export const UPDATE_LINKS = gql`mutation UPDATE_LINKS($set: links_set_input, $where: links_bool_exp!) { update_links: update_links(_set: $set, where: $where) { returning { id } } }`;
export const DELETE_LINKS = gql`mutation DELETE_LINKS($where: links_bool_exp!) { delete_links: delete_links(where: $where) { returning { id } } }`;

export const INSERT_STRING = gql`mutation INSERT_STRING($objects: [string_insert_input!]!) { insert_string: insert_string(objects: $objects) { returning { id } } }`;
export const UPDATE_STRING = gql`mutation UPDATE_STRING($set: string_set_input, $where: string_bool_exp!) { update_string: update_string(_set: $set, where: $where) { returning { id } } }`;

export const insertLink = (link: { from_id?: number; to_id?: number; type_id: number; }) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'links', operation: 'insert',
        variables: { objects: link },
      }),
    ],
    name: 'INSERT_LINK',
  });
}
export const deleteLink = (id: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'links', operation: 'delete',
        variables: { where: { id: { _eq: id } } },
      }),
    ],
    name: 'DELETE_LINK',
  });
}
export const insertString = (link_id: number, value: string) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'string', operation: 'insert',
        variables: { objects: { link_id, value } },
      }),
    ],
    name: 'INSERT_STRING',
  });
}
export const updateString = (id: number, value: string) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'string', operation: 'update',
        variables: { where: { id: { _eq: id } }, _set: { value: value } },
      }),
    ],
    name: 'UPDATE_STRING',
  });
}
export const deleteString = (id: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'string', operation: 'delete',
        variables: { where: { id: { _eq: id } } },
      }),
    ],
    name: 'DELETE_STRING',
  });
}
export const insertNumber = (link_id: number, value: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'number', operation: 'insert',
        variables: { objects: { link_id, value } },
      }),
    ],
    name: 'INSERT_NUMBER',
  });
}
export const updateNumber = (id: number, value: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'number', operation: 'update',
        variables: { where: { id: { _eq: id } }, _set: { value: value } },
      }),
    ],
    name: 'UPDATE_NUMBER',
  });
}
export const deleteNumber = (id: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'number', operation: 'delete',
        variables: { where: { id: { _eq: id } } },
      }),
    ],
    name: 'DELETE_NUMBER',
  });
}

export const insertBoolExp = (link_id: number, value: string) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'bool_exp', operation: 'insert',
        variables: { objects: { link_id, gql: value } },
      }),
    ],
    name: 'INSERT_BOOL_EXP',
  });
}
export const updateBoolExp = (id: number, value: string) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'bool_exp', operation: 'update',
        variables: { where: { id: { _eq: id } }, _set: { gql: value } },
      }),
    ],
    name: 'UPDATE_BOOL_EXP',
  });
}
export const deleteBoolExp = (id: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'bool_exp', operation: 'delete',
        variables: { where: { id: { _eq: id } } },
      }),
    ],
    name: 'DELETE_BOOL_EXP',
  });
}