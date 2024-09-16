import { Box } from '@chakra-ui/react';
import { Id, useDeep } from '@deep-foundation/deeplinks';
import React from 'react';
import { useDropzone } from 'react-dropzone';

export const Files = React.memo(function Files({
    render = ({
        getRootProps,
        input,
        isDragAccept,
        isDragActive,
        isDragReject,
        children,
        deep,
        Props,
    }) => (
        <Box {...getRootProps({})} bg={isDragActive ? 'deepBgDark' : isDragAccept ? 'deepBgActive' : isDragReject ? 'deepBgDanger' : 'transparent'} {...Props}>
            {input}
            {children}
        </Box>
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
    onInsert: (id, files, a, event) => void;
    Props?: any;
    [key: string]: any;
}) {
    const deep = useDeep();
    const dropzone = useFiles({
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
            onInsert && onInsert(result?.data?.[0]?.id, files, a, event);
        }
    };
    const dropzone = useDropzone({
        onDrop,
        ...props,
    });
    return dropzone;
}
