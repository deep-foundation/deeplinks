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
