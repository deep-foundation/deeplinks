import { DeepClient } from "./client";
export declare function evalClientHandler({ value, deep, input, }: {
    value: string;
    deep: DeepClient;
    input?: any;
}): Promise<{
    error?: any;
    data?: any;
}>;
