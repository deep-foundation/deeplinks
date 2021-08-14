import React, { useCallback, useState } from 'react';
import { Button, Typography, TextField, Card, CardContent, CardActions, InputAdornment, IconButton, Grid, Dialog } from '../../ui';
import { Delete } from '../../icons';
import { useMutation } from '@apollo/react-hooks';
import { updateString, insertString, deleteString, updateNumber, insertNumber, deleteNumber, insertBoolExp, updateBoolExp, deleteBoolExp } from '../../gql';
import { useDebouncedCallback } from 'use-debounce';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import MonacoEditor from 'react-monaco-editor';
import { generateSerial, insertMutation } from '@deepcase/deeplinks/imports/gql';
import { useSelectedLinks } from '../../../pages';

export function LinkCardType({
  link,
}: {
  link: any;
}) {
  const client = useApolloClient();
  const [selectedLinks, setSelectedLinks] = useSelectedLinks();

  return <>
    <Button
      size="small" variant="outlined" fullWidth
      onClick={async () => {
        // NeedReservedLinks
        const result = await client.mutate(generateSerial({
          actions: [insertMutation('dc_dg_links', { objects: { type_id: 14, from_id: 0, to_id: 0 } })],
          name: 'INSERT_SUBJECT',
        }));
        const userId = result?.data?.m0?.returning?.[0]?.id;
        setSelectedLinks([...selectedLinks, userId]);
      }}
    >
      + subject (user)
    </Button>
  </>;
}
