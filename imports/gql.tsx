import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { useCallback } from 'react';
import { generateMutation, generateSerial, ISerialOptions } from '@deepcase/deepgraph/imports/gql';

export const JWT = gql`query JWT($nodeId: Int) {
  dc_dg_jwt(input: {role: "link", nodeId: nodeId}) {
    nodeId
    token
    role
  }
}`;

export const LINKS = gql`subscription LINKS {
  links: dc_dg_links {
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
    in { from_id id to_id type_id } out { from_id id to_id type_id }
  }
}`;
export const INSERT_LINKS = gql`mutation INSERT_LINKS($objects: [dc_dg_links_insert_input!]!) { insert_links: insert_dc_dg_links(objects: $objects) { returning { id } } }`;
export const UPDATE_LINKS = gql`mutation UPDATE_LINKS($set: dc_dg_links_set_input, $where: dc_dg_links_bool_exp!) { update_links: update_dc_dg_links(_set: $set, where: $where) { returning { id } } }`;
export const DELETE_LINKS = gql`mutation DELETE_LINKS($where: dc_dg_links_bool_exp!) { delete_links: delete_dc_dg_links(where: $where) { returning { id } } }`;

export const INSERT_STRING = gql`mutation INSERT_STRING($objects: [dc_dg_string_insert_input!]!) { insert_string: insert_dc_dg_string(objects: $objects) { returning { id } } }`;
export const UPDATE_STRING = gql`mutation UPDATE_STRING($set: dc_dg_string_set_input, $where: dc_dg_string_bool_exp!) { update_string: update_dc_dg_string(_set: $set, where: $where) { returning { id } } }`;

export const insertLink = (link: { from_id?: number; to_id?: number; type_id: number; }) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'dc_dg_links', operation: 'insert',
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
        tableName: 'dc_dg_links', operation: 'delete',
        variables: { where: { id: { _eq: id } } },
      }),
    ],
    name: 'DELETE_LINK',
  });
}
export const updateString = (id: number, value: string) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'dc_dg_string', operation: 'update',
        variables: { where: { id: { _eq: id } }, _set: { value: value } },
      }),
    ],
    name: 'UPDATE_STRING',
  });
}
export const insertString = (link_id: number, value: string) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'dc_dg_string', operation: 'insert',
        variables: { objects: { link_id, value } },
      }),
    ],
    name: 'INSERT_STRING',
  });
}
export const deleteString = (id: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'dc_dg_string', operation: 'delete',
        variables: { where: { id: { _eq: id } } },
      }),
    ],
    name: 'DELETE_STRING',
  });
}
export const updateNumber = (id: number, value: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'dc_dg_number', operation: 'update',
        variables: { where: { id: { _eq: id } }, _set: { value: value } },
      }),
    ],
    name: 'UPDATE_NUMBER',
  });
}
export const insertNumber = (link_id: number, value: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'dc_dg_number', operation: 'insert',
        variables: { objects: { link_id, value } },
      }),
    ],
    name: 'INSERT_NUMBER',
  });
}
export const deleteNumber = (id: number) => {
  return generateSerial({
    actions: [
      generateMutation({
        tableName: 'dc_dg_number', operation: 'delete',
        variables: { where: { id: { _eq: id } } },
      }),
    ],
    name: 'DELETE_NUMBER',
  });
}
