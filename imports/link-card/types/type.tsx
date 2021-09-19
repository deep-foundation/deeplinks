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
import { Divider, LinearProgress } from '@material-ui/core';
import axios from 'axios';
import { IOptions } from '../../../pages/api/deeplinks';

export function LinkCardType({
  link,
}: {
  link: any;
}) {
  const client = useApolloClient();
  const [selectedLinks, setSelectedLinks] = useSelectedLinks();
  
  const [operation, setOperation] = useState('');
  const call = useCallback(async (options: IOptions) => {
    setOperation(options.operation);
    await axios.post(`${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`, options).then(console.log, console.log);
    setOperation('');
  }, []);

  return <>
    <Grid container spacing={1}>
      <Grid item xs={12}><Button
        size="small" variant="outlined" fullWidth
        onClick={async () => {
          // NeedReservedLinks
          const result = await client.mutate(generateSerial({
            actions: [insertMutation('links', { objects: { type_id: 14, from_id: 0, to_id: 0 } })],
            name: 'INSERT_SUBJECT',
          }));
          const userId = result?.data?.m0?.returning?.[0]?.id;
          setSelectedLinks([...selectedLinks, userId]);
        }}
      >
        + subject (user)
      </Button></Grid>
      <Divider/>
      <Grid item xs={12}><Button disabled={!!operation} size="small" variant="outlined" fullWidth onClick={() => call({ operation: 'run' })}>run engine</Button><LinearProgress variant={operation === 'run' ? 'indeterminate' : 'determinate'}/></Grid>
      <Grid item xs={12}><Button disabled={!!operation} size="small" variant="outlined" fullWidth onClick={() => call({ operation: 'sleep' })}>sleep engine</Button><LinearProgress variant={operation === 'sleep' ? 'indeterminate' : 'determinate'}/></Grid>
      <Grid item xs={12}><Button disabled={!!operation} size="small" variant="outlined" fullWidth onClick={() => call({ operation: 'reset' })}>reset engine</Button><LinearProgress variant={operation === 'reset' ? 'indeterminate' : 'determinate'}/></Grid>
    </Grid>
  </>;
}
