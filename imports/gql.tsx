import gql from 'graphql-tag';

export const LINKS = gql`subscription LINKS { links: dc_dg_links { id type_id from_id to_id string { value } } }`;
export const INSERT_LINKS = gql`mutation INSERT_LINKS($objects: [dc_dg_links_insert_input!]!) { insert_links: insert_dc_dg_links(objects: $objects) { returning { id type_id from_id to_id } } }`;
export const UPDATE_LINKS = gql`mutation UPDATE_LINKS($set: dc_dg_links_set_input, $where: dc_dg_links_bool_exp!) { update_links: update_dc_dg_links(_set: $set, where: $where) { returning { id type_id from_id to_id } } }`;
export const DELETE_LINKS = gql`mutation DELETE_LINKS($where: dc_dg_links_bool_exp!) { delete_links: delete_dc_dg_links(where: $where) { returning { id type_id from_id to_id } } }`;
