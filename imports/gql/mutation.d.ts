export interface IGenerateMutationOptions {
    tableName: string;
    operation: 'insert' | 'update' | 'delete';
    queryName?: string;
    returning?: string;
    variables?: any;
}
export interface IGenerateMutationBuilder {
    (alias: string, index: number): IGenerateMutationResult;
}
export interface IGenerateMutationFieldTypes {
    [field: string]: string;
}
export interface IGenerateMutationResult extends IGenerateMutationOptions {
    resultReturning: string;
    fields: string[];
    fieldTypes: IGenerateMutationFieldTypes;
    defs: string[];
    args: string[];
    alias: string;
    index: number;
    resultAlias: string;
    resultVariables: any;
}
export declare const generateMutation: ({ tableName, operation, queryName, returning, variables, }: IGenerateMutationOptions) => IGenerateMutationBuilder;
export declare const insertMutation: (tableName: string, variables: any, options?: IGenerateMutationOptions) => IGenerateMutationBuilder;
export declare const updateMutation: (tableName: string, variables: any, options?: IGenerateMutationOptions) => IGenerateMutationBuilder;
export declare const deleteMutation: (tableName: string, variables: any, options?: IGenerateMutationOptions) => IGenerateMutationBuilder;
