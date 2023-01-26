import { HasuraApi } from "@deep-foundation/hasura/api";
export declare const api: HasuraApi;
export declare const itemReplaceSymbol = 777777777777;
export declare const userReplaceSymbol = 777777777778;
export declare const itemPublicSymbol = "X-Deep-Item-Id";
export declare const userPublicSymbol = "X-Deep-User-Id";
export declare const applyBoolExpToLink: (sql: string, linkId: number) => string;
export declare const boolExpToSQL: (boolExpId: number, boolExpValue: any) => Promise<void>;
