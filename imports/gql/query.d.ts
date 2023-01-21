export interface IGenerateQueryDataOptions {
    tableName: string;
    operation?: 'query' | 'subscription';
    queryName?: string;
    returning?: string;
    variables?: any;
}
export interface IGenerateQueryDataBuilder {
    (alias: string, index: number): IGenerateQueryDataResult;
}
export interface IGenerateQueryFieldTypes {
    [field: string]: string;
}
export interface IGenerateQueryDataResult extends IGenerateQueryDataOptions {
    resultReturning: string;
    fields: string[];
    fieldTypes: IGenerateQueryFieldTypes;
    defs: string[];
    args: string[];
    alias: string;
    index: number;
    resultAlias: string;
    resultVariables: any;
}
export declare const generateQueryData: ({ tableName, operation, queryName, returning, variables, }: IGenerateQueryDataOptions) => IGenerateQueryDataBuilder;
export interface IGenerateQueryOptions {
    queries: any[];
    name: string;
    operation?: 'query' | 'subscription';
    alias?: string;
}
export interface IGenerateQueryResult {
    query: any;
    queryString: any;
    variables: any;
}
export declare const generateQuery: ({ queries, operation, name, alias, }: IGenerateQueryOptions) => IGenerateQueryResult;
