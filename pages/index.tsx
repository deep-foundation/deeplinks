import React from 'react';
import Head from 'next/head';
import { TokenProvider } from '@deepcase/deepgraph/imports/react-token';
import { ApolloClientTokenizedProvider } from '@deepcase/react-hasura/apollo-client-tokenized-provider';
import { LocalStoreProvider } from '@deepcase/store/local';

export function PageConnected() {
  return <>
  </>
}

export default function Page() {
  return (
    <LocalStoreProvider>
      <TokenProvider>
        <ApolloClientTokenizedProvider options={{ client: 'hasura-example-client', path: `${process.env.HASURA_PATH}/v1/graphql`, ssl: !!+process.env.HASURA_SSL, ws: !!process?.browser }}>
          <PageConnected/>
        </ApolloClientTokenizedProvider>
      </TokenProvider>
    </LocalStoreProvider>
  );
}
