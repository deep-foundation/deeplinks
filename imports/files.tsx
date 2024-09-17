import { useDeep } from './client.js';
import { Id } from './minilinks.js';
import React from 'react';
import * as dz from 'react-dropzone';

export const Files = React.memo(function Files({
    Component = 'div',
    render = ({
        getRootProps,
        input,
        isDragAccept,
        isDragActive,
        isDragReject,
        children,
        deep,
        Props,
        Component,
    }) => (
        <Component {...getRootProps({})} bg={isDragActive ? 'deepBgDark' : isDragAccept ? 'deepBgActive' : isDragReject ? 'deepBgDanger' : 'transparent'} cursor={isDragActive ? 'drag' : undefined} {...Props}>
            {input}
            {children}
        </Component>
    ),
    children,
    prevent = false,

    onDrop,

    insert = {},
    containerId,
    onInsert,
    Props = {},
    ...props
}: {
    render?: any;
    children?: any;
    prevent?: boolean;

    onDrop: (files, a, event, prevent) => void;

    insert?: any;
    containerId: Id;
    onInsert: (id, file, a, event) => void;
    Props?: any;
    [key: string]: any;
}) {
    const deep = useDeep();
    const {
        getInputProps,
        getRootProps,
        isDragActive,
        isDragAccept,
        isDragReject,
    } = useFiles({
        prevent,
        onDrop,
        insert,
        containerId,
        onInsert,
        ...props,
    });

    const input = <input {...getInputProps()} />;

    return render({
        getRootProps,
        input,
        isDragActive,
        isDragAccept,
        isDragReject,
        children,
        deep,
        Props,
        Component,
    });
});

export function useFiles({
    prevent = false,

    onDrop: _onDrop,

    insert = {},
    containerId,
    onInsert,

    ...props
}: {
    prevent?: boolean;

    onDrop: (files, a, event, prevent) => void;

    insert?: any;
    containerId: Id;
    onInsert: (id, files, a, event) => void;

    [key: string]: any;
}) {
    const deep = useDeep();
    const onDrop = async (files, a, event) => {
        let _prevent = prevent;
        _onDrop && _onDrop(files, a, event, () => _prevent = true);
        if (!_prevent) for (const file of files) {
            const result = await deep.insert({
                file,
                type_id: deep.idLocal('@deep-foundation/core', 'AsyncFile'),
                containerId,
                ...insert,
            });
            onInsert && onInsert(result?.data?.[0]?.id, file, a, event);
        }
    };
    const dropzone = dz.useDropzone({
        onDrop,
        ...props,
    });
    return dropzone;
}
