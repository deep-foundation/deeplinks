/// <reference types="node" />
export interface ICallOptions {
    operation: 'run' | 'sleep' | 'reset';
    envs: {
        [key: string]: string;
    };
}
interface ICheckDeeplinksStatusReturn {
    result?: 1 | 0 | undefined;
    error?: any;
}
export declare const _checkDeeplinksStatus: () => Promise<ICheckDeeplinksStatusReturn>;
export declare function call(options: ICallOptions): Promise<{
    result?: {
        stdout: string;
        stderr: string;
    };
    error?: any;
    platform: NodeJS.Platform;
    isDeeplinksDocker: ICheckDeeplinksStatusReturn;
    envs: {
        DOCKERHOST: string;
    };
    engineStr: string;
    fullStr: string;
    operation: "run" | "sleep" | "reset";
}>;
export {};
