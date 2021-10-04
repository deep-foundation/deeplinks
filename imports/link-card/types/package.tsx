import { generateSerial, insertMutation } from '@deepcase/deeplinks/imports/gql';
import { Packager } from '../../packager';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import React from 'react';
import { useSelectedLinks } from '../../../pages';
import { Button, Grid } from '../../ui';

export function LinkCardPackage({
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
        onClick={() => {
          const packager = new Packager(client);
          console.log(packager)
          packager.exportPackage({ packageLinkId: link.id }).then(console.log, console.log);
        }}
      >
        export
      </Button></Grid>
    </Grid>
  </>;
}
