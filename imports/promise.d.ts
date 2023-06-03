import type { ApolloClient } from '@apollo/client';
export declare const delay: (time: any) => Promise<unknown>;
export interface PromiseOptions {
    id: number;
    timeout?: number;
    client: ApolloClient<any>;
    Then: number;
    Promise: number;
    Resolved: number;
    Rejected: number;
    Results: boolean;
}
export declare function awaitPromise(options: PromiseOptions): Promise<any>;
export declare function findPromiseLink(options: PromiseOptions): Promise<any>;
export declare function reject(options: PromiseOptions): Promise<boolean>;
export declare function resolve(options: PromiseOptions): Promise<boolean>;
