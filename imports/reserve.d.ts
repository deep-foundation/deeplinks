import type { ApolloClient } from '@apollo/client/index.js';
export interface ReservedOptions {
    count: number;
    client: ApolloClient<any>;
}
export declare const RESERVE: import("graphql/language/ast.js").DocumentNode;
export declare function reserve(options: ReservedOptions): Promise<any>;
