import { _serialize, _boolExpFields, serializeWhere, serializeQuery, useDeep } from './client.js';
import { BoolExpLink, ComparasionType, QueryLink } from './client_types.js';
import { MinilinkCollection, MinilinksGeneratorOptions, Link, Id } from './minilinks.js';
import _isEqual from 'lodash/isEqual.js';

export interface BoolExpLinkMinilinks extends BoolExpLink {
  _applies?: ComparasionType<Id>;
}

export const minilinksQuery = <L extends Link<Id>>(
  query: QueryLink | Id,
  ml: MinilinkCollection<MinilinksGeneratorOptions, L>,
): L[] => {
  if (typeof(query) === 'number' || typeof(query) === 'string') return [ml.byId[query]];
  else {
    const q = serializeQuery(query, 'links');
    const result = minilinksQueryHandle<L>(q.where, ml);
    return q.limit ? result.slice(q.offset || 0, (q.offset || 0) + (q.limit)) : result;
  }
};

export const minilinksQueryIs = <L extends Link<Id>>(
  query: QueryLink | number,
  link: L,
): boolean => {
  if (typeof(query) === 'number') return link.id === query;
  else {
    const q = serializeQuery(query, 'links');
    return minilinksQueryLevel(
      q,
      link,
      'links',
    );
  }
};

export const minilinksQueryHandle = <L extends Link<Id>>(
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
  link: Link<Id>,
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
        if (_serialize?.[env]?.virtualize?.[field]) {
          let isValid = false;
          for (const a in _serialize?.[env]?.virtualize?.[field]) {
            const alias = _serialize?.[env]?.virtualize?.[field][a];
            if (minilinksQueryComparison(q, link, field, alias, env)) isValid = true;
          }
          if (!isValid) return false;
        } else {
          if (!minilinksQueryComparison(q, link, field, field, env)) {
            return false;
          }
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
        if (!minilinksQueryComparison(q, link, field, field, env)) {
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
  link: Link<Id>,
  field: string,
  alias: string,
  env: string = 'links',
): boolean => {
  const comp = q?.[field];
  if (typeof(comp) === 'undefined') throw new Error(`${field} === undefined`);
  if (env === 'links' && typeof(link?.[alias]) === 'object' && Array.isArray(link?.[alias])) {
    if (comp.hasOwnProperty('_eq')) {
      if (!link?.[alias].includes(comp._eq)) return false;
    }
    if (comp.hasOwnProperty('_neq')) {
      if (link?.[alias].includes(comp._neq)) return false;
    }
  } else {
    if (comp.hasOwnProperty('_is_null')) {
      if (((link?.[alias] === null) || typeof(link?.[alias]) === 'undefined') !== comp._is_null) return false;
    } else {
      if (typeof(link?.[alias]) === 'undefined') return false;
    }
    if (comp.hasOwnProperty('_eq')) {
      if (env === 'links' && link?.[alias] !== comp._eq) return false;
      if (env === 'value' && !_isEqual(link?.[alias], comp._eq)) return false;
    }
    if (comp.hasOwnProperty('_neq')) {
      if (env === 'links' && link?.[alias] === comp._neq) return false;
      if (env === 'value' && _isEqual(link?.[alias], comp._neq)) return false;
    }
    if (comp.hasOwnProperty('_gt')) {
      if (!(link?.[alias] > comp._gt)) return false;
    }
    if (comp.hasOwnProperty('_gte')) {
      if (!(link?.[alias] >= comp._gte)) return false;
    }
    if (comp.hasOwnProperty('_lt')) {
      if (!(link?.[alias] < comp._lt)) return false;
    }
    if (comp.hasOwnProperty('_lte')) {
      if (!(link?.[alias] <= comp._lte)) return false;
    }
    if (comp.hasOwnProperty('_in')) {
      if (!comp?._in?.includes(link?.[alias])) return false;
    }
    if (comp.hasOwnProperty('_nin')) {
      if (comp?._nin?.includes(link?.[alias])) return false;
    }
    if (comp.hasOwnProperty('_ilike')) {
      if (
        !link?.[alias]?.toLowerCase || !link?.[alias]?.toLowerCase()?.includes(comp?._ilike?.toLowerCase()
      )) return false;
    }
    if (comp.hasOwnProperty('_nilike')) {
      if (
        !link?.[alias]?.toLowerCase || !link?.[alias]?.toLowerCase()?.includes(comp?._nilike?.toLowerCase()
      )) return false;
    }
    if (comp.hasOwnProperty('_like')) {
      if (
        !link?.[alias]?.includes(comp?._like)
      ) return false;
    }
    if (comp.hasOwnProperty('_nlike')) {
      if (
        !link?.[alias]?.includes(comp?._nlike)
      ) return false;
    }
    if (comp.hasOwnProperty('_iregex')) {
      if (!link?.[alias]?.toLowerCase || !link?.[alias]?.toLowerCase().match(comp?._iregex)) return false;
    }
    if (comp.hasOwnProperty('_regex')) {
      if (!link?.[alias].match(comp?._regex)) return false;
    }
    if (comp.hasOwnProperty('_niregex')) {
      if (!link?.[alias]?.toLowerCase || !link?.[alias]?.toLowerCase().match(comp?._niregex)) return false;
    }
    if (comp.hasOwnProperty('_nregex')) {
      if (!link?.[alias].match(comp?._nregex)) return false;
    }
    return true;
  }
}