import React, { useCallback, useEffect, useState } from 'react';
import { Button, Typography, TextField, Card, CardContent, CardActions, InputAdornment, IconButton, Grid, Dialog, Divider } from '../ui';
import { Delete } from '../icons';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { updateString, insertString, deleteString, insertBoolExp, updateBoolExp, deleteBoolExp, LINKS, LINKS_WHERE } from '../gql';
import { useDebouncedCallback } from 'use-debounce';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import MonacoEditor from 'react-monaco-editor';

import { LinkCardType } from './types/type';
import { LinkCardSubject } from './types/subject';
import { LinkCardRule } from './types/rule';
import { LinkCardPackage } from './types/package';
import { Packager } from '@deepcase/deeplinks/imports/packager';
import { generateMutation, generateSerial } from '@deepcase/deeplinks/imports/gql';

export function LinkCard({
  link,
}: {
  link: any;
}) {
  const client = useApolloClient();
  const insertBoolExpD = useCallback(async () => (
    await client.mutate(insertBoolExp(link.id, ''))
  ), [link]);
  const updateBoolExpD = useDebouncedCallback(async (value) => (
    await client.mutate(updateBoolExp(link.bool_exp.id, value))
  ), 1000);
  const deleteBoolExpD = useCallback(async () => (
    await client.mutate(deleteBoolExp(link.bool_exp.id))
  ), [link?.bool_exp?.id]);

  const [valueInserted, setValueInserted] = useState(false);

  const columnsQ = useSubscription(LINKS_WHERE, { variables: {
    where: {
      type_id: { _eq: 30 },
      from: {
        type_id: { _eq: 29 },
        out: {
          type_id: { _eq: 31 },
          to_id: { _eq: link?.type_id },
        },
      },
    },
  } });
  const columns = columnsQ?.data?.links || [];

  useEffect(() => {
    if (process.browser) {
      // @ts-ignore
      window.packager = new Packager(client);
      // @ts-ignore
      console.log(window.packager);
    }
  }, []);

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
        {link?.type_id === 32 && <Grid item xs={12}>
          <LinkCardPackage link={link}/>
        </Grid>}
        <Grid item xs={12}>
          <Divider/>
        </Grid>
        {<Grid key={link?.value?.id || ''} item xs={12}>
          {link?.value || valueInserted ? <>
            {columns.map((column) => {
              return <>
                <TextField
                  label={column?.value?.value || 'value'}
                  variant="outlined" size="small" fullWidth
                  defaultValue={link?.value?.[column?.value?.value || 'value'] || ''}
                  onChange={async (e) => {
                    console.log(1);
                    if (!link?.value) return;
                    console.log(2);
                    await client.mutate(generateSerial({
                      actions: [
                        generateMutation({
                          tableName: `table${column.from_id}`, operation: 'update',
                          variables: { where: { link_id: { _eq: link.id } }, _set: { [column?.value?.value || 'value']: e.target.value } },
                        }),
                      ],
                      name: 'UPDATE_VALUE',
                    }));
                  }}
                />
              </>;
            })}
          </> : <>
            <Button
              size="small" variant="outlined" fullWidth
              onClick={async () => {
                setValueInserted(true);
                await client.mutate(generateSerial({
                  actions: [
                    generateMutation({
                      tableName: `table${columns[0].from_id}`, operation: 'insert',
                      variables: { objects: { link_id: link.id } },
                    }),
                  ],
                  name: 'UPDATE_VALUE',
                }));
              }}
            >
              insert value
            </Button>
          </>}
        </Grid>}
      </Grid>
    </CardActions>
  </Card>;
}
