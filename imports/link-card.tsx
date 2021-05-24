import React, { useCallback } from 'react';
import { Button, Typography, TextField, Card, CardContent, CardActions, InputAdornment, IconButton, Grid } from './ui';
import { Delete } from './icons';
import { useMutation } from '@apollo/react-hooks';
import { updateString, insertString, deleteString, updateNumber, insertNumber, deleteNumber } from './gql';
import { useDebouncedCallback } from 'use-debounce';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';

export function LinkCard({
  link,
}: {
  link: any;
}) {
  const client = useApolloClient();
  const updateStringD = useDebouncedCallback(async (value) => (
    await client.mutate(updateString(link.string.id, value))
  ), 1000);
  const insertStringD = useCallback(async () => (
    await client.mutate(insertString(link.id, ''))
  ), [link]);
  const deleteStringD = useCallback(async () => (
    await client.mutate(deleteString(link.string.id))
  ), [link?.string?.id]);
  const updateNumberD = useDebouncedCallback(async (value: number) => (
    await client.mutate(updateNumber(link.number.id, value))
  ), 1000);
  const insertNumberD = useCallback(async () => (
    await client.mutate(insertNumber(link.id, 0))
  ), [link]);
  const deleteNumberD = useCallback(async () => (
    await client.mutate(deleteNumber(link.number.id))
  ), [link?.number?.id]);

  return <Card>
    <CardContent>
      <Typography>{link?.id} {link?.type?.string?.value}</Typography>
    </CardContent>
    <CardActions>
      <Grid container spacing={1}>
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
