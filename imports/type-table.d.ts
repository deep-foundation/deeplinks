import { HasuraApi } from '@deep-foundation/hasura/api';
import { DeepClient } from './client';
export interface ITypeTableStringOptions {
    schemaName: string;
    tableName: string;
    valueType?: string;
    customColumnsSql?: string;
    customAfterSql?: string;
    linkRelation?: string;
    linksTableName?: string;
    api: HasuraApi;
    deep: DeepClient;
}
export declare const generateUp: (options: ITypeTableStringOptions) => () => Promise<void>;
export declare const generateDown: (options: ITypeTableStringOptions) => () => Promise<void>;
export declare const promiseTriggersUp: (options: ITypeTableStringOptions) => () => Promise<void>;
export declare const promiseTriggersDown: (options: ITypeTableStringOptions) => () => Promise<void>;
