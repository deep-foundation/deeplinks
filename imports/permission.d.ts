import { HasuraApi } from '@deep-foundation/hasura/api.js';
export declare const permissions: (api: HasuraApi, table: string | {
    name: string;
    schema: string;
}, actions?: {
    role: string;
    select: any;
    insert: any;
    update: any;
    delete: any;
    columns?: string | string[];
    computed_fields?: string[];
}) => Promise<void>;
