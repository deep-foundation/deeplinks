export interface Options {
    linkId: number;
    secret: string;
    role?: string;
}
export declare function jwt(options: Options): any;
