export interface LinkPlain {
  id: number;
  type_id: number;
  from_id: number;
  to_id: number;
}

export interface LinkRelations<L> {
  type: L;
  in: L[];
  inByType: { [id: number]: L[] };
  out: L[];
  outByType: { [id: number]: L[] };
  from: L;
  to: L;
}

export interface Link extends LinkPlain, LinkRelations<Link> {}

export function minilinks(linksArray) {
  const types: { [id: number]: Link[] } = {};
  const byId: { [id: number]: Link } = {};
  const links: Link[] = [];
  for (let l = 0; l < linksArray.length; l++) {
    const link = { ...linksArray[l], in: [], out: [], inByType: {}, outByType: {} };
    byId[link.id] = link;
    types[link.type_id] = types[link.type_id] || [];
    types[link.type_id].push(link);
    links.push(link);
  }
  for (let l = 0; l < links.length; l++) {
    const link = links[l];
    if (byId[link.type_id]) {
      link.type = byId[link.type_id];
    }
    if (byId[link.from_id]) {
      link.from = byId[link.from_id];
      byId[link.from_id].out.push(link);
      byId[link.from_id].outByType[link.type_id] = byId[link.from_id].outByType[link.type_id] || [];
      byId[link.from_id].outByType[link.type_id].push(link);
    }
    if (byId[link.to_id]) {
      link.to = byId[link.to_id];
      byId[link.to_id].in.push(link);
      byId[link.to_id].inByType[link.type_id] = byId[link.to_id].inByType[link.type_id] || [];
      byId[link.to_id].inByType[link.type_id].push(link);
    }
  }
  return {
    links, types, byId,
  };
}
