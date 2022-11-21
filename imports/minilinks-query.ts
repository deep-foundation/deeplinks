import { _serialize, _boolExpFields, serializeWhere, serializeQuery } from "./client";
import { BoolExpLink, QueryLink } from "./client_types";
import { MinilinkCollection, MinilinksGeneratorOptions, Link } from "./minilinks";

export const minilinksQuery = <L extends Link<number>>(
  query: QueryLink | number,
  ml: MinilinkCollection<MinilinksGeneratorOptions, L>,
): L[] => {
  if (typeof(query) === 'number') return [ml.byId[query]];
  else {
    const q = serializeQuery(query);
    const result = minilinksQueryHandle<L>(q.where, ml);
    return q.limit ? result.slice(q.offset || 0, (q.offset || 0) + (q.limit)) : result;
  }
};

export const minilinksQueryIs = <L extends Link<number>>(
  query: QueryLink | number,
  link: L,
): boolean => {
  if (typeof(query) === 'number') return link.id === query;
  else {
    const q = serializeQuery(query);
    const fields = Object.keys(q);
    return minilinksQueryLevel(
      q,
      link,
      'links',
      fields,
    );
  }
};

export const minilinksQueryHandle = <L extends Link<number>>(
  q: BoolExpLink,
  ml: MinilinkCollection<MinilinksGeneratorOptions, L>,
): L[] => {
  const fields = Object.keys(q);
  return ml.links.filter((link) => {
    const r = minilinksQueryLevel(
      q,
      link,
      'links',
      fields,
    );
    return r;
  });
};

export const minilinksQueryLevel = (
  q: BoolExpLink,
  link: Link<number>,
  env: string = 'links',
  fields: string[],
) => {
  if (env === 'links') {
    for (const f in fields) {
      const field = fields[f];
      if (field === '_and') {
        for (const a in q[field]) {
          const subfields = Object.keys(q[field][a]);
          if (!minilinksQueryLevel(q[field][a], link, env, subfields)) {
            return false;
          }
        }
      } else if (field === '_or') {
        let oneOf = false;
        for (const a in q[field]) {
          const subfields = Object.keys(q[field][a]);
          if (minilinksQueryLevel(q[field][a], link, env, subfields)) {
            oneOf = true;
            break;
          }
        }
        return oneOf;
      } else if (field === '_not') {
        const subfields = Object.keys(q[field]);
        if (minilinksQueryLevel(q[field], link, env, subfields)) {
          return false;
        }
      } else if (_serialize?.[env]?.fields?.[field]) {
        if (!minilinksQueryComparison(q, link, field, env)) {
          return false;
        }
      } else {
        if (_serialize?.[env]?.relations?.[field] === 'links') {
          if (typeof(q[field]) === 'object') {
            if (typeof(q[field].length) === 'number') {
              if (!q[field].length) return false;
              const subfields = Object.keys(q[field]);
              // at least one subfield must be true
              let found = false;
              for (const sub in link[field]) {
                const sublink = link[field][sub];
                if (minilinksQueryLevel(q[field], sublink, env, subfields)) {
                  found = true;
                  break;
                }
              }
              if (!found) return false;
            } else {
              if (!minilinksQueryLevel(q[field], link[field], env, fields)) {
                return false;
              }
            }
          }
        } else if (_serialize?.[env]?.relations?.[field] === 'value') {
          const subfields = Object.keys(q[field]);
          if (!minilinksQueryLevel(q[field], link[field], 'value', subfields)) {
            return false;
          }
        } else {
          return false
        }
      }
    }
  } else if (env === 'value') {
    for (const f in fields) {
      const field = fields[f];
      if (_serialize?.[env]?.fields?.[field]) {
        if (!minilinksQueryComparison(q, link, field, env)) {
          return false;
        }
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
  return true;
};

export const minilinksQueryComparison = (
  q: BoolExpLink,
  link: Link<number>,
  field: string,
  env: string = 'links',
): boolean => {
  const comp = q?.[field];
  if (typeof(comp) === 'undefined') throw new Error(`${field} === undefined`);
  if (comp.hasOwnProperty('_eq')) {
    if (link?.[field] !== comp._eq) return false;
  }
  if (comp.hasOwnProperty('_neq')) {
    if (link?.[field] === comp._neq) return false;
  }
  if (comp.hasOwnProperty('_gt')) {
    if (!(link?.[field] > comp._gt)) return false;
  }
  if (comp.hasOwnProperty('_gte')) {
    if (!(link?.[field] >= comp._gte)) return false;
  }
  if (comp.hasOwnProperty('_lt')) {
    if (!(link?.[field] < comp._lt)) return false;
  }
  if (comp.hasOwnProperty('_lte')) {
    if (!(link?.[field] <= comp._lte)) return false;
  }
  if (comp.hasOwnProperty('_is_null')) {
    if ((link?.[field] === null) === comp._is_null) return false;
  }
  if (comp.hasOwnProperty('_in')) {
    if (!comp?._in?.includes(link[field])) return false;
  }
  if (comp.hasOwnProperty('_nin')) {
    if (comp?._nin?.includes(link[field])) return false;
  }
  return true;
}