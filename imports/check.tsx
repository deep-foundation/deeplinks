import Debug from 'debug';
import { gql } from 'apollo-boost';
import forEach from 'lodash/forEach';

interface Node {
  from_id?: number; id?: number; to_id?: number; type_id?: number;
  in: Node[]; out: Node[];
}

interface Marker {
  id: number; item_id: number; path_item_depth: number; path_item_id: number; root_id: number; position_id: string;
  by_position: Marker[];
}

export const check = async (hash: { [name:string]: number }, client) => {
  const fetch = async () => {
    const result = await client.query({ query: gql`query FETCH_FOR_CHECK {
      mp: mp { id item_id path_item_depth path_item_id root_id position_id by_position(order_by: { path_item_depth: asc }) { id item_id path_item_depth path_item_id root_id position_id } }
      nodes: links { from_id id to_id type_id in { from_id id to_id type_id } out { from_id id to_id type_id } }
    }` });
    return { nodes: result?.data?.nodes || [], mp: result?.data?.mp || [] };
  };

  const { nodes, mp } = await fetch();

  let valid = true;
  const invalid = (...args) => {
    valid = false;
    console.log(...args);
  };
  const nodesChecked: { [id: number]: boolean; } = {};
  const markersChecked: { [id: number]: boolean; } = {};
  const checkNode = (node: Node) => {
    if (nodesChecked[node.id]) return;
    else nodesChecked[node.id] = true;

    const isLink = !!(node?.from_id && node?.to_id);
    const isRoot = isLink ? false : !node?.in?.length;

    const markers = mp.filter((m) => m.item_id === node.id);
    const positions = mp.filter((m) => m.item_id === node.id && m.path_item_id === node.id);

    console.log(
      `check #${node.id} ${isLink ? 'link' : 'node'} in${node?.in?.length} out${node?.out?.length}`,
      positions.map((pos) => {
        return `${pos.root_id} [${pos.by_position.map((m) => `${m.path_item_id}`).join(',')}]`;
      }),
    );

    if (isRoot) {
      if (markers.length !== 1) invalid(`invalid node #${node.id} root but markers.length = ${markers.length}`);
    }

    if (!markers.length) invalid(`invalid node #${node.id} markers lost, markers.length = ${markers.length}`);

    positions.forEach((position) => {
      checkPosition(position);
    });
  };
  const checkPosition = (position: Marker) => {
    position.by_position.forEach((marker, i) => {
      markersChecked[marker.id] = true;
      if (marker.position_id != position.position_id) invalid(`invalid position ${position.root_id} [${position.by_position.map((m) => m.path_item_id).join(',')}] position_id not equal`);
      const node = nodes.find((n) => n.id === marker.path_item_id);
      if (!node) invalid(`invalid position ${position.root_id} [${position.by_position.map((m) => m.path_item_id).join(',')}] node lost #${marker.path_item_id}`);
    });
  };
  nodes.forEach((node) => {
    checkNode(node);
  });
  mp.forEach((marker) => {
    if (!markersChecked[marker.id]) invalid(`invalid marker #${marker.id} of node #${marker.item_id} ${marker.root_id}[...${marker.path_item_id}...]`);
  });
  if (!valid) throw new Error('invalid');
};