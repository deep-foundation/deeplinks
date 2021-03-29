import gql from 'graphql-tag';

export const NODES = gql`subscription NODES { nodes: hasura_example_nodes { id type_id from_id to_id } }`;
export const INSERT_NODES = gql`mutation INSERT_NODES($objects: [hasura_example_nodes_insert_input!]!) { insert_nodes: insert_hasura_example_nodes(objects: $objects) { returning { id type_id from_id to_id } } }`;
export const UPDATE_NODES = gql`mutation UPDATE_NODES($set: hasura_example_nodes_set_input, $where: hasura_example_nodes_bool_exp!) { update_nodes: update_hasura_example_nodes(_set: $set, where: $where) { returning { id type_id from_id to_id } } }`;
export const DELETE_NODES = gql`mutation DELETE_NODES($where: hasura_example_nodes_bool_exp!) { delete_nodes: delete_hasura_example_nodes(where: $where) { returning { id type_id from_id to_id } } }`;
