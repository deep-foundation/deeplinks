import _ from 'lodash';
import { useApolloClient } from '@apollo/client';
import { generateSerial, insertMutation } from '@deepcase/deeplinks/imports/gql';
import { Grid } from '@material-ui/core';
import React from 'react';
import { useAuth } from '../../auth';
import { Button } from '../../ui';
import { useSelectedLinks } from '../../../pages';

export function LinkCardSubject({
  link,
}: {
  link: any;
}) {
  const auth = useAuth();
  const client = useApolloClient();
  const [selectedLinks, setSelectedLinks] = useSelectedLinks();

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
              actions: [insertMutation('links', { objects: _.times(6, () => ({ type_id: 6, from_id: 0, to_id: 0 })) })],
              name: 'INSERT_ANYS',
            }));
            const anyIds = (anys?.data?.m0?.returning || [])?.map(r => r?.id);
            await client.mutate(generateSerial({
              actions: [insertMutation('links', { objects: [
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
          + demo subtree
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Button
          size="small" variant="outlined" fullWidth
          onClick={async () => {
            // NeedReservedLinks
            const nodes = await client.mutate(generateSerial({
              actions: [insertMutation('links', { objects: [
                { type_id: 9, from_id: 0, to_id: 0 },
                { type_id: 7, from_id: 0, to_id: 0 },
                { type_id: 7, from_id: 0, to_id: 0 },
                { type_id: 7, from_id: 0, to_id: 0 },
              ] })],
              name: 'INSERT_RULE',
            }));
            const nodeIds = (nodes?.data?.m0?.returning || [])?.map(r => r?.id);
            const links = await client.mutate(generateSerial({
              actions: [insertMutation('links', { objects: [
                { type_id: 10, from_id: nodeIds?.[0], to_id: nodeIds?.[1] },
                { type_id: 11, from_id: nodeIds?.[0], to_id: nodeIds?.[2] },
                { type_id: 12, from_id: nodeIds?.[0], to_id: nodeIds?.[3] },
                { type_id: 13, from_id: link.id, to_id: nodeIds?.[0] },
              ] })],
              name: 'INSERT_RULE_LINKS',
            }));
            setSelectedLinks([...selectedLinks, nodeIds[0]]);
          }}
        >
          + rule
        </Button>
      </Grid>
    </Grid>
  </>;
}
