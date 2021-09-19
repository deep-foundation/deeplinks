import { generateSerial, insertMutation } from '@deepcase/deeplinks/imports/gql';
import { ButtonGroup, Divider, LinearProgress } from '@material-ui/core';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { Button, Grid } from './ui';
import { IOptions } from '@deepcase/deeplinks/imports/engine';
import { useLocalStore } from '@deepcase/store/local';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';

const _call = (options: IOptions) => axios.post(`${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`, options).then(console.log, console.log);

export function useEngineConnected() {
  return useLocalStore('dc-connected', false);
}
export function useEngine() {
  const client = useApolloClient();
  const [connected, setConnected] = useEngineConnected();
  const [operation, setOperation] = useState('');
  const call = useCallback(async (options: IOptions) => {
    setOperation(options.operation);
    if (['reset', 'sleep'].includes(options.operation)) {
      setConnected(false);
    }
    await _call(options);
    if (['run'].includes(options.operation)) {
      setConnected(true);
    }
    setOperation('');
    client.refetchQueries({});
  }, []);
  return {
    operation,
    call,
  };
}

export const EngineWindow = React.memo<any>(function EngineWindow({
}: {
}) {
  const [connected, setConnected] = useEngineConnected();
  const { call, operation } = useEngine();

  return <>
    <Grid container spacing={1}>
      <Grid item xs={12}><Button disabled={!!operation} size="small" variant="outlined" fullWidth onClick={() => call({ operation: 'run' })}>run engine</Button><LinearProgress variant={operation === 'run' ? 'indeterminate' : 'determinate'}/></Grid>
      <Grid item xs={12}><Button disabled={!!operation} size="small" variant="outlined" fullWidth onClick={() => call({ operation: 'reset' })}>reset engine</Button><LinearProgress variant={operation === 'reset' ? 'indeterminate' : 'determinate'}/></Grid>
    </Grid>
  </>;
});

export const EnginePanel = React.memo<any>(function EnginePanel({
}: {
}) {
  const [connected, setConnected] = useEngineConnected();
  const { call } = useEngine();
  const [operation, setOperation] = useState('');

  return <>
    <ButtonGroup variant="outlined">
      <Button onClick={() => call({ operation: 'sleep' })}>sleep</Button>
    </ButtonGroup>
  </>;
});
