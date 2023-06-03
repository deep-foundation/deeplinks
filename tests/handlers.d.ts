import { HasuraApi } from '@deep-foundation/hasura/api.js';
export declare const api: HasuraApi;
export declare function deletePromiseResult(promiseResult: any, linkId?: any): Promise<void>;
export declare const deleteScheduleHandler: (handler: any) => Promise<void>;
export declare function getPromiseResults(deep: any, resultTypeId: number, linkId: any): Promise<any>;
