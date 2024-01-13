import { DeepClient, Exp } from "./client";
import { QueryLink } from "./client_types";
import { Id, Link } from "./minilinks";

type Direction = "from" | "to" | "type" | "out" | "in" | "typed" | "up" | "down";

type Mode = 'local' | 'remote';

interface Travel<T extends "links"> {
  query: Exp<T>;
  direction?: Direction;
}

export const inversions = {
  from: 'out',
  to: 'in',
  type: 'typed',
  out: 'from',
  in: 'to',
  typed: 'type',
  up: 'down',
  down: 'up',
};

export class Traveler {
  deep: DeepClient<Link<Id>>;
  links: Link<Id>[] = [];
  travels: Travel<"links">[];
  mode: Mode = 'remote';

  constructor(deep, links: Link<Id>[] = [], travels: Travel<any>[] = [], mode: Mode = 'remote') {
    this.deep = deep;
    this.links = links;
    this.travels = travels;
    this.mode = mode;
  }

  from(query: Exp<"links">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query, direction: 'from' }], this.mode);
  }
  to(query: Exp<"links">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query, direction: 'to' }], this.mode);
  }
  type(query: Exp<"links">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query, direction: 'type' }], this.mode);
  }
  out(query: Exp<"links">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query, direction: 'out' }], this.mode);
  }
  in(query: Exp<"links">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query, direction: 'in' }], this.mode);
  }
  typed(query: Exp<"links">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query, direction: 'typed' }], this.mode);
  }
  
  up(query: Exp<"tree">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query, direction: 'up' }], this.mode);
  }
  down(query: Exp<"tree">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query, direction: 'down' }], this.mode);
  }

  and(query: Exp<"links">) {
    return new Traveler(this.deep, this.links, [...this.travels, { query: query }], this.mode);
  }

  get query(): Exp<"links"> {
    let current: any = { id: { _in: this.links.map(l => l.id) } };
    for (let t = 0; t < this.travels.length; t++) {
      const travel = this.travels[t];
      if (!travel.direction) {
        current = { _and: [(travel.query as any || {}), current] };
      } else if (['up','down'].includes(inversions[travel.direction])) {
        current = {
          [inversions[travel.direction]]: {
            ...(travel.query as any || {}),
            [inversions[travel.direction] === 'down' ? 'link' : 'parent']: current,
          },
        };
      } else {
        current = { ...(travel.query as any || {}), [inversions[travel.direction]]: current };
      }
    }
    return current;
  }

  select() {
    const query = this.query;
    if (this.mode === 'remote') {
      return this.deep.select(query);
    } else {
      return this.deep.minilinks.select(query as QueryLink);
    }
  }
  subscription() {
    const query = this.query;
    if (this.mode === 'remote') {
      return this.deep.subscribe(query);
    } else {
      return this.deep.minilinks.subscribe(query as QueryLink);
    }
  }

  count() {
    const query = this.query;
    if (this.mode === 'remote') {
      return this.deep.select(query, { aggregate: 'count' });
    } else {
      return this.deep.minilinks.select(query as QueryLink)?.length;
    }
  }
  sum() {
    const query = this.query;
    if (this.mode === 'remote') {
      return this.deep.select(query, { aggregate: 'sum' });
    } else {
    }
  }
  avg() {
    const query = this.query;
    if (this.mode === 'remote') {
      return this.deep.select(query, { aggregate: 'avg' });
    } else {
    }
  }
  min() {
    const query = this.query;
    if (this.mode === 'remote') {
      return this.deep.select(query, { aggregate: 'min' });
    } else {
    }
  }
  max() {
    const query = this.query;
    if (this.mode === 'remote') {
      return this.deep.select(query, { aggregate: 'max' });
    } else {
    }
  }

  get local() {
    return new Traveler(this.deep, this.links, this.travels, 'local');
  }
  get remote() {
    return new Traveler(this.deep, this.links, this.travels, 'remote');
  }
}
