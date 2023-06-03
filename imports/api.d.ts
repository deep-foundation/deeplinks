export interface IExportTypeOptions {
    name: string;
    version: string;
}
export interface IImportTypeOptions {
    name: string;
    version: string;
}
export declare const DeeplinksPackerApi: () => {
    register: () => void;
    exportType: (option: IExportTypeOptions) => Promise<any> | any;
    importType: (option: IImportTypeOptions) => Promise<any> | any;
};
