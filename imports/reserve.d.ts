import { ApolloClient } from "@apollo/client";
export interface ReservedOptions {
    count: number;
    client: ApolloClient<any>;
}
export declare const RESERVE: import("@apollo/client").DocumentNode;
export declare function reserve(options: ReservedOptions): Promise<any>;
