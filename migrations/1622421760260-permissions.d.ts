export declare const TABLE_NAME = "links";
export declare const REPLACE_PATTERN_ID = "777777777777";
export declare const isAdminBoolExp: (subjectId?: string) => Promise<{
    _table: {
        schema: string;
        name: string;
    };
    _where: {
        object_id: {
            _eq: string;
        };
        subject_id: {
            _eq: string;
        };
        action_id: {
            _eq: number;
        };
    };
}>;
export declare const linksPermissions: (self: any, subjectId: any, role: string) => Promise<{
    role: string;
    select: {
        _or: ({
            type: {
                can_object: {
                    action_id: {
                        _eq: number;
                    };
                    subject_id: {
                        _eq: any;
                    };
                };
            };
            can_object?: undefined;
        } | {
            can_object: {
                action_id: {
                    _eq: number;
                };
                subject_id: {
                    _eq: any;
                };
            };
            type?: undefined;
        })[];
    };
    insert: {
        type: {};
        _or: {
            type: {
                can_object: {
                    action_id: {
                        _eq: number;
                    };
                    subject_id: {
                        _eq: any;
                    };
                };
            };
        }[];
    };
    update: {
        _or: ({
            can_object: {
                action_id: {
                    _eq: number;
                };
                subject_id: {
                    _eq: any;
                };
            };
            type?: undefined;
        } | {
            type: {
                can_object: {
                    action_id: {
                        _eq: number;
                    };
                    subject_id: {
                        _eq: any;
                    };
                };
            };
            can_object?: undefined;
        })[];
    };
    delete: {
        _or: ({
            can_object: {
                action_id: {
                    _eq: number;
                };
                subject_id: {
                    _eq: any;
                };
            };
            type?: undefined;
        } | {
            type: {
                can_object: {
                    action_id: {
                        _eq: number;
                    };
                    subject_id: {
                        _eq: any;
                    };
                };
            };
            can_object?: undefined;
        })[];
    };
    columns: string[];
    computed_fields: string[];
}>;
export declare const up: () => Promise<void>;
export declare const down: () => Promise<void>;
