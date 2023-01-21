export declare type Query = BoolExpLink | number;
export interface QueryLink extends BoolExpLink {
    limit?: number;
    order_by?: {
        [key: string]: 'asc' | 'desc';
    };
    offset?: number;
    distinct_on?: [string];
}
export interface BoolExp<T> {
    _and?: T[];
    _or?: T[];
    _not?: T;
}
export interface BoolExpLink extends BoolExp<BoolExpLink> {
    id?: ComparasionType<number>;
    from_id?: ComparasionType<number>;
    to_id?: ComparasionType<number>;
    type_id?: ComparasionType<number>;
    from?: BoolExpLink;
    to?: BoolExpLink;
    type?: BoolExpLink;
    in?: BoolExpLink | BoolExpLink[];
    out?: BoolExpLink | BoolExpLink[];
    typed?: BoolExpLink | BoolExpLink[];
    selected?: BoolExpSelector | BoolExpSelector[];
    selectors?: BoolExpSelector | BoolExpSelector[];
    number?: BoolExpValue<number>;
    string?: BoolExpValue<string>;
    object?: BoolExpValue<object>;
    value?: BoolExpValue<any>;
    can_rule?: BoolExpCan;
    can_action?: BoolExpCan;
    can_object?: BoolExpCan;
    can_subject?: BoolExpCan;
    down?: BoolExpTree;
    up?: BoolExpTree;
    tree?: BoolExpTree;
    root?: BoolExpTree;
}
export interface BoolExpValue<T> extends BoolExp<BoolExpValue<T>> {
    id?: ComparasionType<number>;
    link_id?: ComparasionType<number>;
    link?: BoolExpLink;
    value?: ComparasionType<T>;
}
export interface BoolExpCan extends BoolExp<BoolExpCan> {
    rule_id?: ComparasionType<number>;
    action_id?: ComparasionType<number>;
    object_id?: ComparasionType<number>;
    subject_id?: ComparasionType<number>;
    rule?: BoolExpLink;
    action?: BoolExpLink;
    object?: BoolExpLink;
    subject?: BoolExpLink;
}
export interface BoolExpSelector extends BoolExp<BoolExpCan> {
    item_id?: ComparasionType<number>;
    item?: BoolExpLink;
    selector_id?: ComparasionType<number>;
    selector?: BoolExpLink;
    query_id?: ComparasionType<number>;
    query?: BoolExpLink;
    selector_include_id?: ComparasionType<number>;
}
export interface BoolExpTree extends BoolExp<BoolExpCan> {
    id?: ComparasionType<number>;
    link_id?: ComparasionType<number>;
    tree_id?: ComparasionType<number>;
    root_id?: ComparasionType<number>;
    parent_id?: ComparasionType<number>;
    depth?: ComparasionType<string>;
    position_id?: ComparasionType<string>;
    link?: BoolExpLink;
    tree?: BoolExpLink;
    root?: BoolExpLink;
    parent?: BoolExpLink;
    by_link?: BoolExpTree;
    by_tree?: BoolExpTree;
    by_root?: BoolExpTree;
    by_parent?: BoolExpTree;
    by_position?: BoolExpTree;
}
export interface BoolExpHandler extends BoolExp<BoolExpCan> {
    dist_id?: ComparasionType<number>;
    dist?: BoolExpLink;
    src_id?: ComparasionType<number>;
    src?: BoolExpLink;
    execution_provider_id?: ComparasionType<number>;
    execution_provider?: BoolExpLink;
    isolation_provider_id?: ComparasionType<number>;
    isolation_provider?: BoolExpLink;
    handler_id?: ComparasionType<number>;
    handler?: BoolExpLink;
}
export declare type ComparasionType<T> = ComparasionExp<T> | T;
export interface ComparasionExp<T> {
    _eq?: T;
    _neq?: T;
    _gt?: T;
    _gte?: T;
    _lt?: T;
    _lte?: T;
    _is_null?: boolean;
    _in?: T[];
    _nin?: T[];
    _type_of?: T;
    _id?: [any, ...any[]];
    _like?: string;
    _ilike?: string;
    _nlike?: string;
    _nilike?: string;
    _regex?: string;
    _nregex?: string;
    _iregex?: string;
    _niregex?: string;
}
export interface MutationInput {
}
export interface MutationInputLinkPlain {
    id?: number;
    from_id?: number;
    to_id?: number;
    type_id?: number;
    from?: {
        data: MutationInputLink;
    };
    to?: {
        data: MutationInputLink;
    };
    out?: {
        data: MutationInputLink | MutationInputLink[];
    };
    in?: {
        data: MutationInputLink | MutationInputLink[];
    };
    number?: {
        data: MutationInputValue<number>;
    };
    string?: {
        data: MutationInputValue<string>;
    };
    object?: {
        data: MutationInputValue<any>;
    };
    typed?: {
        data: MutationInputLink | MutationInputLink[];
    };
}
export interface MutationInputLink extends MutationInputLinkPlain {
    from?: {
        data: MutationInputLink;
    };
    to?: {
        data: MutationInputLink;
    };
    out?: {
        data: MutationInputLink | MutationInputLink[];
    };
    in?: {
        data: MutationInputLink | MutationInputLink[];
    };
    number?: {
        data: MutationInputValue<number>;
    };
    string?: {
        data: MutationInputValue<string>;
    };
    object?: {
        data: MutationInputValue<any>;
    };
    typed?: {
        data: MutationInputLink | MutationInputLink[];
    };
}
export interface MutationInputValue<T> {
    link_id?: number;
    link?: {
        data: MutationInputLink;
    };
    value?: T;
}
