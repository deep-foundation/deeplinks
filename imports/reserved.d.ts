import type { ApolloClient } from '@apollo/client/index.js';
export interface ReseveOptions {
    count: number;
    client: ApolloClient<any>;
}
export type ReserveResult = number[];
export declare function reserve(options: ReseveOptions): Promise<ReserveResult>;
