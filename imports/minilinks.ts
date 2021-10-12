export interface LinkPlain<Ref extends number> {
  id: Ref;
  type_id: Ref;
  from_id: Ref;
  to_id: Ref;
}

export interface LinkRelations<L> {
  typed: L[];
  type: L;
  in: L[];
  inByType: { [id: number]: L[] };
  out: L[];
  outByType: { [id: number]: L[] };
  from: L;
  to: L;
}

export interface Link<Ref extends number> extends LinkPlain<Ref>, LinkRelations<Link<Ref>> {
  [key: string]: any;
}

export interface LinksResult<Link> {
  links: Link[];
  types: { [id: number]: Link[] };
  byId: { [id: number]: Link };
}

export function minilinks<L extends Link<number>>(linksArray = []): LinksResult<L> {
  const types: { [id: number]: L[] } = {};
  const byId: { [id: number]: L } = {};
  const links: L[] = [];
  for (let l = 0; l < linksArray.length; l++) {
    const link = { ...linksArray[l], typed: [], in: [], out: [], inByType: {}, outByType: {} };
    byId[link.id] = link;
    types[link.type_id] = types[link.type_id] || [];
    types[link.type_id].push(link);
    links.push(link);
  }
  for (let l = 0; l < links.length; l++) {
    const link = links[l];
    if (byId[link.type_id]) {
      link.type = byId[link.type_id];
      byId[link.type_id].typed.push(link);
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
