import type { ApolloQueryResult } from '@apollo/client/index.js';
import { IApolloClient } from '@deep-foundation/hasura/client.js';
import React from "react";
import { Link, MinilinkCollection, MinilinksResult } from './minilinks.js';
import { BoolExpCan, BoolExpHandler, QueryLink, BoolExpSelector, BoolExpTree, BoolExpValue, MutationInputLink, MutationInputLinkPlain, MutationInputValue } from './client_types.js';
export declare const _ids: {
    '@deep-foundation/core': {
        [key: string]: number;
    };
};
export declare const _serialize: {
    links: {
        fields: {
            id: string;
            from_id: string;
            to_id: string;
            type_id: string;
        };
        relations: {
            from: string;
            to: string;
            type: string;
            in: string;
            out: string;
            typed: string;
            selected: string;
            selectors: string;
            value: string;
            string: string;
            number: string;
            object: string;
            can_rule: string;
            can_action: string;
            can_object: string;
            can_subject: string;
            down: string;
            up: string;
            tree: string;
            root: string;
        };
    };
    selector: {
        fields: {
            item_id: string;
            selector_id: string;
            query_id: string;
            selector_include_id: string;
        };
        relations: {
            item: string;
            selector: string;
            query: string;
        };
    };
    can: {
        fields: {
            rule_id: string;
            action_id: string;
            object_id: string;
            subject_id: string;
        };
        relations: {
            rule: string;
            action: string;
            object: string;
            subject: string;
        };
    };
    tree: {
        fields: {
            id: string;
            link_id: string;
            tree_id: string;
            root_id: string;
            parent_id: string;
            depth: string;
            position_id: string;
        };
        relations: {
            link: string;
            tree: string;
            root: string;
            parent: string;
            by_link: string;
            by_tree: string;
            by_root: string;
            by_parent: string;
            by_position: string;
        };
    };
    value: {
        fields: {
            id: string;
            link_id: string;
            value: string;
        };
        relations: {
            link: string;
        };
    };
};
export declare const _boolExpFields: {
    _and: boolean;
    _not: boolean;
    _or: boolean;
};
export declare const pathToWhere: (start: (DeepClientStartItem), ...path: DeepClientPathItem[]) => any;
export declare const serializeWhere: (exp: any, env?: string) => any;
export declare const serializeQuery: (exp: any, env?: string) => any;
export declare function parseJwt(token: any): {
    userId: number;
    role: string;
    roles: string[];
    [key: string]: any;
};
export interface DeepClientOptions<L = Link<number>> {
    linkId?: number;
    token?: string;
    handleAuth?: (linkId?: number, token?: string) => any;
    deep?: DeepClientInstance<L>;
    apolloClient?: IApolloClient<any>;
    minilinks?: MinilinkCollection<any, Link<number>>;
    table?: string;
    returning?: string;
    selectReturning?: string;
    linksSelectReturning?: string;
    valuesSelectReturning?: string;
    selectorsSelectReturning?: string;
    filesSelectReturning?: string;
    insertReturning?: string;
    updateReturning?: string;
    deleteReturning?: string;
    defaultSelectName?: string;
    defaultInsertName?: string;
    defaultUpdateName?: string;
    defaultDeleteName?: string;
    silent?: boolean;
}
export interface DeepClientResult<R> extends ApolloQueryResult<R> {
    error?: any;
}
export type DeepClientPackageSelector = string;
export type DeepClientPackageContain = string;
export type DeepClientLinkId = number;
export type DeepClientStartItem = DeepClientPackageSelector | DeepClientLinkId;
export type DeepClientPathItem = DeepClientPackageContain | boolean;
export interface DeepClientInstance<L = Link<number>> {
    linkId?: number;
    token?: string;
    handleAuth?: (linkId?: number, token?: string) => any;
    deep: DeepClientInstance<L>;
    apolloClient: IApolloClient<any>;
    minilinks: MinilinksResult<L>;
    table?: string;
    returning?: string;
    selectReturning?: string;
    linksSelectReturning?: string;
    valuesSelectReturning?: string;
    selectorsSelectReturning?: string;
    filesSelectReturning?: string;
    insertReturning?: string;
    updateReturning?: string;
    deleteReturning?: string;
    defaultSelectName?: string;
    defaultInsertName?: string;
    defaultUpdateName?: string;
    defaultDeleteName?: string;
    stringify(any?: any): string;
    select<Table extends 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers', LL = L>(exp: (Table extends 'numbers' ? BoolExpValue<number> : Table extends 'strings' ? BoolExpValue<string> : Table extends 'objects' ? BoolExpValue<object> : Table extends 'can' ? BoolExpCan : Table extends 'selectors' ? BoolExpSelector : Table extends 'tree' ? BoolExpTree : Table extends 'handlers' ? BoolExpHandler : QueryLink) | number | number[], options?: {
        table?: Table;
        returning?: string;
        variables?: any;
        name?: string;
    }): Promise<DeepClientResult<LL[]>>;
    insert<Table extends 'links' | 'numbers' | 'strings' | 'objects', LL = L>(objects: (Table extends 'numbers' ? MutationInputValue<number> : Table extends 'strings' ? MutationInputValue<string> : Table extends 'objects' ? MutationInputValue<any> : MutationInputLink) | (Table extends 'numbers' ? MutationInputValue<number> : Table extends 'strings' ? MutationInputValue<string> : Table extends 'objects' ? MutationInputValue<any> : MutationInputLink)[], options?: {
        table?: Table;
        returning?: string;
        variables?: any;
        name?: string;
    }): Promise<DeepClientResult<{
        id: any;
    }[]>>;
    update<Table extends 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers'>(exp: (Table extends 'numbers' ? BoolExpValue<number> : Table extends 'strings' ? BoolExpValue<string> : Table extends 'objects' ? BoolExpValue<object> : Table extends 'can' ? BoolExpCan : Table extends 'selectors' ? BoolExpSelector : Table extends 'tree' ? BoolExpTree : Table extends 'handlers' ? BoolExpHandler : QueryLink) | number | number[], value: (Table extends 'numbers' ? MutationInputValue<number> : Table extends 'strings' ? MutationInputValue<string> : Table extends 'objects' ? MutationInputValue<any> : MutationInputLinkPlain), options?: {
        table?: Table;
        returning?: string;
        variables?: any;
        name?: string;
    }): Promise<DeepClientResult<{
        id: any;
    }[]>>;
    delete<Table extends 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers'>(exp: (Table extends 'numbers' ? BoolExpValue<number> : Table extends 'strings' ? BoolExpValue<string> : Table extends 'objects' ? BoolExpValue<object> : Table extends 'can' ? BoolExpCan : Table extends 'selectors' ? BoolExpSelector : Table extends 'tree' ? BoolExpTree : Table extends 'handlers' ? BoolExpHandler : QueryLink) | number | number[], options?: {
        table?: Table;
        returning?: string;
        variables?: any;
        name?: string;
    }): Promise<DeepClientResult<{
        id: any;
    }[]>>;
    reserve<LL = L>(count: number): Promise<number[]>;
    await(id: number): Promise<boolean>;
    serializeWhere(exp: any, env?: string): any;
    serializeQuery(exp: any, env?: string): any;
    id(start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]): Promise<number>;
    idLocal(start: DeepClientStartItem, ...path: DeepClientPathItem[]): number;
    guest(options: DeepClientGuestOptions): Promise<DeepClientAuthResult>;
    jwt(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;
    login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;
    logout(): Promise<DeepClientAuthResult>;
    can(objectIds: number[], subjectIds: number[], actionIds: number[]): Promise<boolean>;
}
export interface DeepClientAuthResult {
    linkId?: number;
    token?: string;
    error?: any;
}
export interface DeepClientGuestOptions {
    relogin?: boolean;
}
export interface DeepClientJWTOptions {
    linkId?: number;
    token?: string;
    relogin?: boolean;
}
export type SelectTable = 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers';
export type InsertTable = 'links' | 'numbers' | 'strings' | 'objects';
export type UpdateTable = 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers';
export type DeleteTable = 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers';
export type OperationType = 'select' | 'insert' | 'update' | 'delete';
export type SerialOperationType = 'insert' | 'update' | 'delete';
export type Table<TOperationType extends OperationType = OperationType> = TOperationType extends 'select' ? SelectTable : TOperationType extends 'insert' ? InsertTable : TOperationType extends 'update' ? UpdateTable : TOperationType extends 'delete' ? DeleteTable : never;
export type ValueForTable<TTable extends Table> = TTable extends 'numbers' ? MutationInputValue<number> : TTable extends 'strings' ? MutationInputValue<string> : TTable extends 'objects' ? MutationInputValue<any> : MutationInputLink;
export type ExpForTable<TTable extends Table> = TTable extends 'numbers' ? BoolExpValue<number> : TTable extends 'strings' ? BoolExpValue<string> : TTable extends 'objects' ? BoolExpValue<object> : TTable extends 'can' ? BoolExpCan : TTable extends 'selectors' ? BoolExpSelector : TTable extends 'tree' ? BoolExpTree : TTable extends 'handlers' ? BoolExpHandler : QueryLink;
export type SerialOperationDetails<TSerialOperationType extends SerialOperationType, TTable extends Table<TSerialOperationType>> = TSerialOperationType extends 'insert' ? {
    objects: ValueForTable<TTable> | ValueForTable<TTable>[];
} : TSerialOperationType extends 'update' ? {
    exp: ExpForTable<TTable> | number | number[];
    value: ValueForTable<TTable>;
} : TSerialOperationType extends 'delete' ? {
    exp: ExpForTable<TTable> | number | number[];
} : never;
export type SerialOperation<TSerialOperationType extends SerialOperationType = SerialOperationType, TTable extends Table<TSerialOperationType> = Table<TSerialOperationType>> = {
    type: TSerialOperationType;
    table: TTable;
} & SerialOperationDetails<TSerialOperationType, TTable>;
export type DeepSerialOperation = SerialOperation<SerialOperationType, Table<SerialOperationType>>;
export type AsyncSerialParams = {
    operations: Array<DeepSerialOperation>;
    name?: string;
    returning?: string;
    silent?: boolean;
};
export declare class DeepClient<L = Link<number>> implements DeepClientInstance<L> {
    useDeepSubscription: typeof useDeepSubscription;
    useDeepQuery: typeof useDeepQuery;
    useMinilinksQuery: (query: QueryLink) => any;
    useMinilinksSubscription: (query: QueryLink) => any;
    useDeep: typeof useDeep;
    DeepProvider: typeof DeepProvider;
    DeepContext: React.Context<DeepClient<Link<number>>>;
    linkId?: number;
    token?: string;
    handleAuth?: (linkId?: number, token?: string) => any;
    deep: DeepClientInstance<L>;
    client: IApolloClient<any>;
    apolloClient: IApolloClient<any>;
    minilinks: MinilinksResult<L>;
    table?: string;
    returning?: string;
    selectReturning?: string;
    linksSelectReturning?: string;
    valuesSelectReturning?: string;
    selectorsSelectReturning?: string;
    filesSelectReturning?: string;
    insertReturning?: string;
    updateReturning?: string;
    deleteReturning?: string;
    defaultSelectName?: string;
    defaultInsertName?: string;
    defaultUpdateName?: string;
    defaultDeleteName?: string;
    silent: boolean;
    _silent(options?: Partial<{
        silent?: boolean;
    }>): boolean;
    constructor(options: DeepClientOptions<L>);
    stringify(any?: any): string;
    serializeQuery: (exp: any, env?: string) => any;
    serializeWhere: (exp: any, env?: string) => any;
    select<Table extends 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers', LL = L>(exp: (Table extends 'numbers' ? BoolExpValue<number> : Table extends 'strings' ? BoolExpValue<string> : Table extends 'objects' ? BoolExpValue<object> : Table extends 'can' ? BoolExpCan : Table extends 'selectors' ? BoolExpSelector : Table extends 'tree' ? BoolExpTree : Table extends 'handlers' ? BoolExpHandler : QueryLink) | number | number[], options?: {
        table?: Table;
        returning?: string;
        variables?: any;
        name?: string;
    }): Promise<DeepClientResult<LL[]>>;
    insert<Table extends 'links' | 'numbers' | 'strings' | 'objects', LL = L>(objects: (Table extends 'numbers' ? MutationInputValue<number> : Table extends 'strings' ? MutationInputValue<string> : Table extends 'objects' ? MutationInputValue<any> : MutationInputLink) | (Table extends 'numbers' ? MutationInputValue<number> : Table extends 'strings' ? MutationInputValue<string> : Table extends 'objects' ? MutationInputValue<any> : MutationInputLink)[], options?: {
        table?: Table;
        returning?: string;
        variables?: any;
        name?: string;
        silent?: boolean;
    }): Promise<DeepClientResult<{
        id: any;
    }[]>>;
    update<Table extends 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers'>(exp: (Table extends 'numbers' ? BoolExpValue<number> : Table extends 'strings' ? BoolExpValue<string> : Table extends 'objects' ? BoolExpValue<object> : Table extends 'can' ? BoolExpCan : Table extends 'selectors' ? BoolExpSelector : Table extends 'tree' ? BoolExpTree : Table extends 'handlers' ? BoolExpHandler : QueryLink) | number | number[], value: (Table extends 'numbers' ? MutationInputValue<number> : Table extends 'strings' ? MutationInputValue<string> : Table extends 'objects' ? MutationInputValue<any> : MutationInputLinkPlain), options?: {
        table?: Table;
        returning?: string;
        variables?: any;
        name?: string;
        silent?: boolean;
    }): Promise<DeepClientResult<{
        id: any;
    }[]>>;
    delete<Table extends 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers'>(exp: (Table extends 'numbers' ? BoolExpValue<number> : Table extends 'strings' ? BoolExpValue<string> : Table extends 'objects' ? BoolExpValue<object> : Table extends 'can' ? BoolExpCan : Table extends 'selectors' ? BoolExpSelector : Table extends 'tree' ? BoolExpTree : Table extends 'handlers' ? BoolExpHandler : QueryLink) | number | number[], options?: {
        table?: Table;
        returning?: string;
        variables?: any;
        name?: string;
        silent?: boolean;
    }): Promise<DeepClientResult<{
        id: any;
    }[]>>;
    serial<LL = L>({ name, operations, returning, silent }: AsyncSerialParams): Promise<DeepClientResult<{
        id: number;
    }[]>>;
    reserve<LL = L>(count: number): Promise<number[]>;
    await(id: number, options?: {
        results: boolean;
    }): Promise<any>;
    id(start: DeepClientStartItem | QueryLink, ...path: DeepClientPathItem[]): Promise<number>;
    idLocal(start: DeepClientStartItem, ...path: DeepClientPathItem[]): number;
    guest(options?: DeepClientGuestOptions): Promise<DeepClientAuthResult>;
    jwt(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;
    whoami(): Promise<number | undefined>;
    login(options: DeepClientJWTOptions): Promise<DeepClientAuthResult>;
    logout(): Promise<DeepClientAuthResult>;
    can(objectIds: null | number | number[], subjectIds: null | number | number[], actionIds: null | number | number[], userIds?: number | number[]): Promise<boolean>;
    nameLocal(input: Link<number> | number): string | undefined;
}
export declare const JWT: import("graphql/language/ast.js").DocumentNode;
export declare const WHOISME: import("graphql/language/ast.js").DocumentNode;
export declare const GUEST: import("graphql/language/ast.js").DocumentNode;
export declare function useAuthNode(): [number, (value: number) => number, () => number];
export declare const DeepContext: React.Context<DeepClient<Link<number>>>;
export declare function useDeepGenerator(apolloClientProps?: IApolloClient<any>): DeepClient<Link<number>>;
export declare function DeepProvider({ apolloClient: apolloClientProps, children, }: {
    apolloClient?: IApolloClient<any>;
    children: any;
}): React.JSX.Element;
export declare function useDeep(): DeepClient<Link<number>>;
export declare function useDeepQuery<Table extends 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers', LL = Link<number>>(query: QueryLink, options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
    mini?: string;
}): {
    data?: LL[];
    error?: any;
    loading: boolean;
};
export declare function useDeepSubscription<Table extends 'links' | 'numbers' | 'strings' | 'objects' | 'can' | 'selectors' | 'tree' | 'handlers', LL = Link<number>>(query: QueryLink, options?: {
    table?: Table;
    returning?: string;
    variables?: any;
    name?: string;
    mini?: string;
}): UseDeepSubscriptionResult<LL>;
export interface UseDeepSubscriptionResult<LL = Link<number>> {
    data?: LL[];
    error?: any;
    loading: boolean;
}
