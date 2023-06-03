import { HasuraApi } from '@deep-foundation/hasura/api.js';
export declare const MP_TABLE_NAME = "mp";
export declare const TREE_TABLE_NAME = "tree";
export declare const upTreeSchema: ({ SCHEMA, TREE_TABLE, GRAPH_TABLE, ID_FIELD, api }: {
    SCHEMA?: string;
    TREE_TABLE?: string;
    GRAPH_TABLE?: string;
    ID_FIELD?: string;
    api: HasuraApi;
}) => Promise<void>;
export declare const downTreeSchema: ({ SCHEMA, TREE_TABLE, GRAPH_TABLE, api }: {
    SCHEMA?: string;
    TREE_TABLE?: string;
    GRAPH_TABLE?: string;
    ID_FIELD?: string;
    api: HasuraApi;
}) => Promise<void>;
export declare const up: () => Promise<void>;
export declare const down: () => Promise<void>;
