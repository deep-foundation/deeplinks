import _ from 'lodash';
import { useApolloClient } from '@apollo/react-hooks';
import { generateSerial, insertMutation } from '@deepcase/deeplinks/imports/gql';
import { Grid } from '@material-ui/core';
import React from 'react';
import { useAuth } from '../../auth';
import { Button } from '../../ui';

export function LinkCardSubject({
  link,
}: {
  link: any;
}) {
  const auth = useAuth();
  const client = useApolloClient();

  return <>
    <Grid container spacing={1}>
      {auth?.linkId === link?.id && <Grid item xs={12}><Button
        size="small" variant="outlined" fullWidth
        onClick={async () => {
          auth.setLinkId(0);
        }}
      >
        logout
      </Button></Grid>}
      {auth?.linkId !== link?.id && <Grid item xs={12}><Button
        size="small" variant="outlined" fullWidth
        onClick={async () => {
          auth.setLinkId(link?.id);
        }}
      >
        login
      </Button></Grid>}
      <Grid item xs={12}>
        <Button
          size="small" variant="outlined" fullWidth
          onClick={async () => {
            // NeedReservedLinks
            const anys = await client.mutate(generateSerial({
              actions: [insertMutation('dc_dg_links', { objects: _.times(6, () => ({ type_id: 6, from_id: 0, to_id: 0 })) })],
              name: 'INSERT_ANYS',
            }));
            const anyIds = (anys?.data?.m0?.returning || [])?.map(r => r?.id);
            await client.mutate(generateSerial({
              actions: [insertMutation('dc_dg_links', { objects: [
                { type_id: 13, from_id: link?.id, to_id: anyIds?.[0] },
                { type_id: 13, from_id: link?.id, to_id: anyIds?.[1] },
                { type_id: 13, from_id: anyIds?.[0], to_id: anyIds?.[2] },
                { type_id: 13, from_id: anyIds?.[0], to_id: anyIds?.[3] },
                { type_id: 13, from_id: anyIds?.[1], to_id: anyIds?.[4] },
                { type_id: 13, from_id: anyIds?.[1], to_id: anyIds?.[5] },
              ] })],
              name: 'INSERT_ANYS_TREE_LINKS',
            }));
          }}
        >
          create demo any subtree
        </Button>
      </Grid>
    </Grid>
  </>;
}
