import { _serialize, _boolExpFields, serializeWhere, serializeQuery } from './client.js';
import { BoolExpLink, ComparasionType, QueryLink } from './client_types.js';
import { MinilinkCollection, MinilinksGeneratorOptions, Link } from './minilinks.js';

export interface BoolExpLinkMinilinks extends BoolExpLink {
  _applies?: ComparasionType<number>;
}

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
    return minilinksQueryLevel(
      q,
      link,
      'links',
    );
  }
};

export const minilinksQueryHandle = <L extends Link<number>>(
  q: BoolExpLinkMinilinks,
  ml: MinilinkCollection<MinilinksGeneratorOptions, L>,
): L[] => {
  return ml.links.filter((link) => {
    const r = minilinksQueryLevel(
      q,
      link,
      'links',
    );
    return r;
  });
};

export const minilinksQueryLevel = (
  q: BoolExpLinkMinilinks,
  link: Link<number>,
  env: string = 'links',
) => {
  const fields = Object.keys(q);
  if (env === 'links') {
    for (const f in fields) {
      const field = fields[f];
      if (field === '_and') {
        for (const a in q[field]) {
          if (!minilinksQueryLevel(q[field][a], link, env)) {
            return false;
          }
        }
      } else if (field === '_or') {
        let oneOf = false;
        for (const a in q[field]) {
          if (minilinksQueryLevel(q[field][a], link, env)) {
            oneOf = true;
            break;
          }
        }
        return oneOf;
      } else if (field === '_not') {
        if (minilinksQueryLevel(q[field], link, env)) {
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
              // at least one subfield must be true
              let found = false;
              for (const sub in link?.[field]) {
                const sublink = link?.[field][sub];
                if (minilinksQueryLevel(q[field], sublink, env)) {
                  found = true;
                  break;
                }
              }
              if (!found) return false;
            } else {
              if (Array.isArray(link?.[field])) {
                // at least one subfield must be true
                let found = false;
                for (const el in link?.[field]) {
                  if (minilinksQueryLevel(q[field], link?.[field][el], env)) {
                    found = true;
                    break;
                  }
                }
                if (!found) return false;
              } else {
                if (!minilinksQueryLevel(q[field], link?.[field], env)) {
                  return false;
                }
              }
            }
          }
        } else if (_serialize?.[env]?.relations?.[field] === 'value') {
          if (!link?.[field] || !minilinksQueryLevel(q[field], link?.[field], 'value')) {
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
  q: BoolExpLinkMinilinks,
  link: Link<number>,
  field: string,
  env: string = 'links',
): boolean => {
  const comp = q?.[field];
  if (typeof(comp) === 'undefined') throw new Error(`${field} === undefined`);
  if (typeof(link?.[field]) === 'object' && Array.isArray(link?.[field])) {
    if (comp.hasOwnProperty('_eq')) {
      if (!link?.[field].includes(comp._eq)) return false;
    }
    if (comp.hasOwnProperty('_neq')) {
      if (link?.[field].includes(comp._neq)) return false;
    }
  } else {
    if (typeof(link?.[field]) === 'undefined') return false;
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
      if (!comp?._in?.includes(link?.[field])) return false;
    }
    if (comp.hasOwnProperty('_nin')) {
      if (comp?._nin?.includes(link?.[field])) return false;
    }
    if (comp.hasOwnProperty('_ilike')) {
      if (
        !link?.[field]?.toLowerCase || !link?.[field]?.toLowerCase()?.includes(comp?._ilike?.toLowerCase()
      )) return false;
    }
    if (comp.hasOwnProperty('_nilike')) {
      if (
        !link?.[field]?.toLowerCase || !link?.[field]?.toLowerCase()?.includes(comp?._nilike?.toLowerCase()
      )) return false;
    }
    if (comp.hasOwnProperty('_like')) {
      if (
        !link?.[field]?.includes(comp?._like)
      ) return false;
    }
    if (comp.hasOwnProperty('_nlike')) {
      if (
        !link?.[field]?.includes(comp?._nlike)
      ) return false;
    }
    if (comp.hasOwnProperty('_iregex')) {
      if (!link?.[field]?.toLowerCase || !link?.[field]?.toLowerCase().match(comp?._iregex)) return false;
    }
    if (comp.hasOwnProperty('_regex')) {
      if (!link?.[field].match(comp?._regex)) return false;
    }
    if (comp.hasOwnProperty('_niregex')) {
      if (!link?.[field]?.toLowerCase || !link?.[field]?.toLowerCase().match(comp?._niregex)) return false;
    }
    if (comp.hasOwnProperty('_nregex')) {
      if (!link?.[field].match(comp?._nregex)) return false;
    }
    return true;
  }
}