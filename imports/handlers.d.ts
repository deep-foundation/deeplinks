export declare const insertHandler: (handleOperationTypeId: number, typeId: number, code: string, forceOwnerId?: number, supportsId?: number) => Promise<{
    handlerId: any;
    handleOperationId: any;
    handlerJSFileId: any;
    handlerJSFileValueId: any;
    ownerContainHandlerId: any;
}>;
export declare function insertSelector(): Promise<{
    nodeTypeId: any;
    linkTypeId: any;
    treeId: any;
    treeIncludesIds: any;
    selectorId: any;
    selectorIncludeId: any;
    selectorTreeId: any;
    rootId: any;
}>;
export declare function insertSelectorItems({ selectorId, nodeTypeId, linkTypeId, treeId, rootId }: {
    selectorId: any;
    nodeTypeId: any;
    linkTypeId: any;
    treeId: any;
    rootId: any;
}): Promise<{
    linkId: any;
    nodeId: any;
}[]>;
export declare function insertSelectorItem({ selectorId, nodeTypeId, linkTypeId, treeId, rootId }: {
    selectorId: any;
    nodeTypeId: any;
    linkTypeId: any;
    treeId: any;
    rootId: any;
}): Promise<{
    linkId: any;
}>;
export declare const deleteHandler: (handler: any) => Promise<{
    links: any[];
    strings: any[];
}>;
export declare const deleteSelector: (selector: any) => Promise<void>;
export declare function deleteId(id: number, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
}): Promise<void>;
export declare function deleteIds(ids: number[], options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
}): Promise<import("./client.js").DeepClientResult<{
    id: any;
}[]> | {
    data: any[];
}>;
