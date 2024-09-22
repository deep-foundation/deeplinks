import { useDeep } from './client.js';
import { Id } from './minilinks.js';
import React, { useMemo } from 'react';
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
    type_id: _type_id,
    containerId,
    onInsert,

    ...props
}: {
    prevent?: boolean;

    onDrop: (files, a, event, prevent) => void;

    insert?: any;
    type_id?: Id;
    containerId: Id;
    onInsert: (id, file, a, event) => void;

    [key: string]: any;
}) {
    const deep = useDeep();
    const type_id = useMemo(() => _type_id || deep.idLocal('@deep-foundation/core', 'AsyncFile'), [_type_id]);
    const onDrop = async (files, a, event) => {
        let _prevent = prevent;
        _onDrop && _onDrop(files, a, event, () => _prevent = true);
        if (!_prevent) for (const file of files) {
            const result = await deep.insert({
                file,
                type_id,
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

export function base64ToFile(dataurl, filename) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export function fileToBase64(file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        console.log(reader.result);
    };
    reader.onerror = function (error) {
        console.log('Error: ', error);
    };
}