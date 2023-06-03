import { HasuraApi } from '@deep-foundation/hasura/api.js';
export declare const api: HasuraApi;
export declare const SCHEMA = "public";
export declare const TABLE_NAME = "links";
export declare const up: () => Promise<void>;
export declare const down: () => Promise<void>;
