import { ApolloClient } from "@apollo/client";
export interface ReseveOptions {
    count: number;
    client: ApolloClient<any>;
}
export declare type ReserveResult = number[];
export declare function reserve(options: ReseveOptions): Promise<ReserveResult>;
