export interface ContainerControllerOptions {
    gql_docker_domain: string;
    gql_port_path: string;
    network?: string;
    handlersHash?: any;
}
export interface NewContainerOptions {
    handler: string;
    code: string;
    jwt: string;
    data: any;
    forceName?: string;
    forcePort?: number;
    forceRestart?: boolean;
    publish?: boolean;
}
export interface InitOptions {
    port: number;
}
export interface Container {
    name?: string;
    host?: string;
    port?: number;
    options?: NewContainerOptions;
    error?: string;
}
export interface CallOptions {
    code: string;
    jwt: string;
    data: any;
    container: Container;
}
export declare const runnerControllerOptionsDefault: ContainerControllerOptions;
export declare class ContainerController {
    gql_docker_domain: string;
    gql_port_path: string;
    network: string;
    delimiter: string;
    runContainerHash: {
        [id: string]: Promise<any>;
    };
    handlersHash: {
        [id: string]: Container;
    };
    constructor(options?: ContainerControllerOptions);
    _runContainer(containerName: string, dockerPort: number, options: NewContainerOptions): Promise<{
        name: string;
        host: string;
        port: number;
        options: NewContainerOptions;
    } | {
        error: string;
    }>;
    newContainer(options: NewContainerOptions): Promise<Container>;
    findContainer(containerName: string): Promise<Container>;
    _dropContainer(containerName: string): Promise<string>;
    dropContainer(container: Container): Promise<void>;
    _checkAndRestart(container: Container): Promise<{
        error?: string;
    }>;
    initHandler(container: Container): Promise<{
        error?: string;
    }>;
    callHandler(options: CallOptions): Promise<{
        error?: string;
    }>;
}
