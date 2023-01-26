import { BoolExpLink, ComparasionType, QueryLink } from "./client_types";
import { MinilinkCollection, MinilinksGeneratorOptions, Link } from "./minilinks";
export interface BoolExpLinkMinilinks extends BoolExpLink {
    _applies?: ComparasionType<number>;
}
export declare const minilinksQuery: <L extends Link<number>>(query: QueryLink | number, ml: MinilinkCollection<MinilinksGeneratorOptions, L>) => L[];
export declare const minilinksQueryIs: <L extends Link<number>>(query: QueryLink | number, link: L) => boolean;
export declare const minilinksQueryHandle: <L extends Link<number>>(q: BoolExpLinkMinilinks, ml: MinilinkCollection<MinilinksGeneratorOptions, L>) => L[];
export declare const minilinksQueryLevel: (q: BoolExpLinkMinilinks, link: Link<number>, env?: string) => boolean;
export declare const minilinksQueryComparison: (q: BoolExpLinkMinilinks, link: Link<number>, field: string, env?: string) => boolean;
