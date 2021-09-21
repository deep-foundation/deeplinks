import React, { useCallback, useState } from 'react';
import { Button, Typography, TextField, Card, CardContent, CardActions, InputAdornment, IconButton, Grid, Dialog } from '../ui';
import { Delete } from '../icons';
import { useMutation } from '@apollo/client';
import { updateString, insertString, deleteString, updateNumber, insertNumber, deleteNumber, insertBoolExp, updateBoolExp, deleteBoolExp } from '../gql';
import { useDebouncedCallback } from 'use-debounce';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import MonacoEditor from 'react-monaco-editor';
import { Divider } from '@material-ui/core';

import { LinkCardType } from './types/type';
import { LinkCardSubject } from './types/subject';
import { LinkCardRule } from './types/rule';

export function LinkCard({
  link,
}: {
  link: any;
}) {
  const client = useApolloClient();
  const insertStringD = useCallback(async () => (
    await client.mutate(insertString(link.id, ''))
  ), [link]);
  const updateStringD = useDebouncedCallback(async (value) => (
    await client.mutate(updateString(link.string.id, value))
  ), 1000);
  const deleteStringD = useCallback(async () => (
    await client.mutate(deleteString(link.string.id))
  ), [link?.string?.id]);
  const insertNumberD = useCallback(async () => (
    await client.mutate(insertNumber(link.id, 0))
  ), [link]);
  const updateNumberD = useDebouncedCallback(async (value: number) => (
    await client.mutate(updateNumber(link.number.id, value))
  ), 1000);
  const deleteNumberD = useCallback(async () => (
    await client.mutate(deleteNumber(link.number.id))
  ), [link?.number?.id]);
  const insertBoolExpD = useCallback(async () => (
    await client.mutate(insertBoolExp(link.id, ''))
  ), [link]);
  const updateBoolExpD = useDebouncedCallback(async (value) => (
    await client.mutate(updateBoolExp(link.bool_exp.id, value))
  ), 1000);
  const deleteBoolExpD = useCallback(async () => (
    await client.mutate(deleteBoolExp(link.bool_exp.id))
  ), [link?.bool_exp?.id]);

  const [dialog, setDialog] = useState(false);

  // NeedPackerTypeNaming

  return <Card>
    <CardContent>
      <Typography>{link?.id} {link?.type?.string?.value}</Typography>
    </CardContent>
    <CardActions>
      <Grid container spacing={1}>
        {link?.id === 1 && <Grid item xs={12}>
          <LinkCardType link={link}/>
        </Grid>}
        {link?.type_id === 14 && <Grid item xs={12}>
          <LinkCardSubject link={link}/>
        </Grid>}
        {link?.type_id === 9 && <Grid item xs={12}>
          <LinkCardRule link={link}/>
        </Grid>}
        <Grid item xs={12}>
          <Divider/>
        </Grid>
        <Grid item xs={12}>
          {!!link?.bool_exp ? <>
            <TextField
              label={'bool_exp'}
              variant="outlined" size="small" fullWidth
              defaultValue={link.bool_exp.gql || ''}
              InputProps={{
                endAdornment: <InputAdornment position="end">
                  <IconButton onClick={() => deleteBoolExpD()}><Delete/></IconButton>
                </InputAdornment>,
              }}
              onChange={!!link.bool_exp.id ? async (e) => {
                updateBoolExpD(e.target.value);
              } : null}
            />
          </> : <>
            <Button
              size="small" variant="outlined" fullWidth
              onClick={() => insertBoolExpD()}
            >
              + bool_exp
            </Button>
          </>}
        </Grid>
        <Grid item xs={12}>
          {!!link?.string ? <>
            <TextField
              label={'string'}
              variant="outlined" size="small" fullWidth
              defaultValue={link.string.value || ''}
              InputProps={{
                endAdornment: <InputAdornment position="end">
                  <IconButton onClick={() => deleteStringD()}><Delete/></IconButton>
                </InputAdornment>,
              }}
              onChange={!!link.string.id ? async (e) => {
                updateStringD(e.target.value);
              } : null}
            />
          </> : <>
            <Button
              size="small" variant="outlined" fullWidth
              onClick={() => insertStringD()}
            >
              + string
            </Button>
          </>}
        </Grid>
        <Grid item xs={12}>
          {!!link?.number ? <>
            <TextField
              label={'number'}
              variant="outlined" size="small" fullWidth
              defaultValue={link.number.value || ''}
              InputProps={{
                endAdornment: <InputAdornment position="end">
                  <IconButton onClick={() => deleteNumberD()}><Delete/></IconButton>
                </InputAdornment>,
              }}
              onChange={!!link.number.id ? async (e) => {
                updateNumberD(+e.target.value);
              } : null}
            />
          </> : <>
            <Button
              size="small" variant="outlined" fullWidth
              onClick={() => insertNumberD()}
            >
              + number
            </Button>
          </>}
        </Grid>
      </Grid>
    </CardActions>
  </Card>;
}
