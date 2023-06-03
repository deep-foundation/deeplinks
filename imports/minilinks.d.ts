/// <reference types="node" />
import EventEmitter from 'events';
import { QueryLink } from './client_types.js';
export interface LinkPlain<Ref extends number> {
    id: Ref;
    type_id: Ref;
    from_id?: Ref;
    to_id?: Ref;
    value?: any;
}
export interface LinkRelations<L extends Link<number>> {
    typed: L[];
    type: L;
    in: L[];
    inByType: {
        [id: number]: L[];
    };
    out: L[];
    outByType: {
        [id: number]: L[];
    };
    from: L;
    to: L;
    value?: any;
    _applies: string[];
    ml?: MinilinkCollection<MinilinksGeneratorOptions, L>;
}
export interface LinkHashFields {
    [key: string | number]: any;
}
export interface Link<Ref extends number> extends LinkPlain<Ref>, LinkRelations<Link<Ref>>, LinkHashFields {
}
export interface MinilinksResult<Link> {
    links: Link[];
    types: {
        [id: number]: Link[];
    };
    byId: {
        [id: number]: Link;
    };
    byFrom: {
        [id: number]: Link[];
    };
    byTo: {
        [id: number]: Link[];
    };
    byType: {
        [id: number]: Link[];
    };
    options: MinilinksGeneratorOptions;
    emitter: EventEmitter;
    query(query: QueryLink | number): Link[];
    add(linksArray: any[]): {
        anomalies?: MinilinkError[];
        errors?: MinilinkError[];
    };
    remove(idsArray: any[]): {
        anomalies?: MinilinkError[];
        errors?: MinilinkError[];
    };
    _updating: boolean;
    apply(linksArray: any[], applyName?: string): {
        errors?: MinilinkError[];
        anomalies?: MinilinkError[];
    };
}
export declare class MinilinksLink<Ref extends number> {
    id: Ref;
    type_id: Ref;
    from_id?: Ref;
    to_id?: Ref;
    typed: MinilinksLink<Ref>[];
    type: MinilinksLink<Ref>;
    in: MinilinksLink<Ref>[];
    inByType: {
        [id: number]: MinilinksLink<Ref>[];
    };
    out: MinilinksLink<Ref>[];
    outByType: {
        [id: number]: MinilinksLink<Ref>[];
    };
    from: MinilinksLink<Ref>;
    to: MinilinksLink<Ref>;
    value?: any;
    string?: any;
    number?: any;
    object?: any;
    _applies: string[];
    constructor(link: any);
    toPlain(): LinkPlain<Ref>;
    is(query: QueryLink): boolean;
}
export interface MinilinksGeneratorOptions {
    id: any;
    type_id: any;
    type: any;
    typed: any;
    from_id: any;
    from: any;
    out: any;
    to_id: any;
    to: any;
    in: any;
    inByType: any;
    outByType: any;
    handler?: (link: any, result: any) => any;
    equal: (oldLink: any, newLink: any) => boolean;
    Link: any;
}
export declare const MinilinksGeneratorOptionsDefault: MinilinksGeneratorOptions;
export interface MinilinksInstance<L extends Link<number>> {
    (linksArray: L[], memory?: MinilinksResult<L>): MinilinksResult<L>;
}
export declare function Minilinks<MGO extends MinilinksGeneratorOptions, L extends Link<number>>(options: MGO): MinilinksInstance<L>;
export interface MinilinkError extends Error {
}
export declare class MinilinkCollection<MGO extends MinilinksGeneratorOptions, L extends Link<number>> {
    useMinilinksQuery: typeof useMinilinksQuery;
    useMinilinksFilter: typeof useMinilinksFilter;
    useMinilinksApply: typeof useMinilinksApply;
    useMinilinksSubscription: typeof useMinilinksSubscription;
    useMinilinksHandle: typeof useMinilinksHandle;
    types: {
        [id: number]: L[];
    };
    byId: {
        [id: number]: L;
    };
    byFrom: {
        [id: number]: L[];
    };
    byTo: {
        [id: number]: L[];
    };
    byType: {
        [id: number]: L[];
    };
    links: L[];
    options: MGO;
    emitter: EventEmitter;
    query(query: QueryLink | number): L[];
    add(linksArray: any[]): {
        anomalies?: MinilinkError[];
        errors?: MinilinkError[];
    };
    remove(idsArray: any[]): {
        anomalies?: MinilinkError[];
        errors?: MinilinkError[];
    };
    _updating: boolean;
    apply(linksArray: any[], applyName?: string): {
        errors?: MinilinkError[];
        anomalies?: MinilinkError[];
    };
    constructor(options?: MGO, memory?: any);
}
export declare const minilinks: MinilinksInstance<Link<number>>;
export interface MinilinksHookInstance<L extends Link<number>> {
    ml: MinilinksResult<L>;
    ref: {
        current: MinilinksResult<L>;
    };
}
export declare function useMinilinksConstruct<L extends Link<number>>(options?: any): MinilinksHookInstance<L>;
export declare function useMinilinksFilter<L extends Link<number>, R = any>(ml: any, filter: (currentLink: L, oldLink: L, newLink: L) => boolean, results: (l?: L, ml?: any, oldLink?: L, newLink?: L) => R, interval?: number): R;
export declare function useMinilinksHandle<L extends Link<number>>(ml: any, handler: (event: any, oldLink: any, newLink: any) => any): void;
export declare function useMinilinksApply<L extends Link<number>>(ml: any, name: string, data?: L[]): any;
export declare function useMinilinksQuery<L extends Link<number>>(ml: any, query: QueryLink | number): any;
export declare function useMinilinksSubscription<L extends Link<number>>(ml: any, query: QueryLink | number): any;
