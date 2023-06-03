import { DeepClient } from './client.js';
import { Link, MinilinksResult } from './minilinks.js';
export interface PackageIdentifier {
    name: string;
    version?: string;
    uri?: string;
    type?: string;
    options?: any;
}
export interface Package {
    package: PackageIdentifier;
    data: PackageItem[];
    dependencies?: {
        [id: number]: PackageIdentifier;
    };
    strict?: boolean;
    errors?: PackagerError[];
}
export interface PackageItem {
    id: number | string;
    type?: number | string;
    from?: number | string;
    to?: number | string;
    value?: PackagerValue;
    package?: {
        dependencyId: number;
        containValue: string;
    };
    _?: boolean;
    updated?: string[];
}
export interface PackagerValue {
    id?: number | string;
    link_id?: number | string;
    value?: number | string | any;
}
export type PackagerError = any;
export interface PackagerImportResult {
    errors?: PackagerError[];
    ids?: number[];
    packageId?: number;
    namespaceId?: number;
}
export type PackagerMutated = {
    [index: number]: boolean;
};
export interface PackagerExportOptions {
    packageLinkId: number;
}
export interface PackagerLink extends Link<any> {
    value?: any;
}
export declare function sort(pckg: Package, data: any[], errors: PackagerError[], references: {
    id: string;
    from: string;
    to: string;
    type: string;
}): {
    sorted: any[];
};
export declare class Packager<L extends Link<any>> {
    pckg: Package;
    client: DeepClient<any>;
    constructor(client: DeepClient<L>);
    fetchPackageNamespaceId(name: string, deep: DeepClient<number>): Promise<{
        error: any;
        namespaceId: number;
    }>;
    fetchDependenciedLinkId(pckg: Package, dependedLink: PackageItem): Promise<number>;
    insertItem(items: PackageItem[], item: PackageItem, errors: PackagerError[], mutated: PackagerMutated): Promise<void>;
    insertItems(pckg: Package, data: PackageItem[], counter: number, dependedLinks: PackageItem[], errors?: PackagerError[], mutated?: {
        [index: number]: boolean;
    }): Promise<any>;
    globalizeIds(pckg: Package, ids: number[], links: PackageItem[]): Promise<{
        global: PackageItem[];
        difference: {
            [id: number]: number;
        };
    }>;
    validate(pckg: Package, errors: any[]): void;
    import(pckg: Package): Promise<PackagerImportResult>;
    selectLinks(options: PackagerExportOptions): Promise<MinilinksResult<PackagerLink>>;
    deserialize(pckg: Package, errors?: PackagerError[]): Promise<{
        data: PackageItem[];
        errors?: PackagerError[];
        counter: number;
        dependedLinks: PackageItem[];
        packageId: number;
        namespaceId: number;
    }>;
    serialize(globalLinks: MinilinksResult<PackagerLink>, options: PackagerExportOptions, pckg: Package): Promise<Package>;
    export(options: PackagerExportOptions): Promise<Package>;
}
