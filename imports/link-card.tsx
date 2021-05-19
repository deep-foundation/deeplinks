import React from 'react';
import { Typography } from '@material-ui/core';

export function LinkCard({
  link,
}: {
  link: any;
}) {
  return <div style={{ minWidth: 300, padding: 16 }}>
    <Typography>{link?.id} {link?.type?.string?.value}</Typography>
    {!!link?.string && <Typography>string: {link?.string?.value}</Typography>}
  </div>;
}
