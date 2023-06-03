export declare const RL_TABLE_NAME = "reserved";
export declare const upTable: ({ SCHEMA, RL_TABLE, DATE_TYPE, customColumns }?: {
    SCHEMA?: string;
    RL_TABLE?: string;
    DATE_TYPE?: string;
    customColumns?: string;
}) => Promise<void>;
export declare const downTable: ({ SCHEMA, RL_TABLE }?: {
    SCHEMA?: string;
    RL_TABLE?: string;
}) => Promise<void>;
export declare const up: () => Promise<void>;
export declare const down: () => Promise<void>;
