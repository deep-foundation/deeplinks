import { generateSerial, insertMutation } from '@deepcase/deeplinks/imports/gql';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import React from 'react';
import { useSelectedLinks } from '../../../pages';
import { Button, Grid } from '../../ui';

export function LinkCardType({
  link,
}: {
  link: any;
}) {
  const client = useApolloClient();
  const [selectedLinks, setSelectedLinks] = useSelectedLinks();

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
    </Grid>
  </>;
}
