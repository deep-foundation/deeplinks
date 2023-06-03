import { SerialOperationType, Table, SerialOperation, SerialOperationDetails } from '../client.js';
export interface ISerialOptions {
    actions: any[];
    name: string;
    alias?: string;
    [key: string]: any;
}
export interface ISerialResult {
    mutation: any;
    mutationString: any;
    variables: any;
}
export declare const generateSerial: ({ actions, name, alias, ...options }: ISerialOptions) => ISerialResult;
export declare function createSerialOperation<TSerialOperationType extends SerialOperationType, TTable extends Table<TSerialOperationType>>(params: {
    type: TSerialOperationType;
    table: TTable;
} & SerialOperationDetails<TSerialOperationType, TTable>): SerialOperation<TSerialOperationType, TTable>;
