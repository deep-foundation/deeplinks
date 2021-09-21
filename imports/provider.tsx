import { TokenProvider, useTokenController } from '@deepcase/deeplinks/imports/react-token';
import { ApolloClientTokenizedProvider } from '@deepcase/react-hasura/apollo-client-tokenized-provider';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import { LocalStoreProvider } from '@deepcase/store/local';
import { QueryStoreProvider } from '@deepcase/store/query';
import { colors, createTheme, ThemeProvider } from './ui';
import React, { useEffect } from 'react';
import { AuthProvider } from './auth';
import { Analitics } from './analitics';

const temp = createTheme({});
const { breakpoints } = temp;

export const theme = createTheme({
  typography: {
    fontFamily: ['Comfortaa', 'sans-serif'].join(','),
  },
  palette: {
    type: 'dark',
    background: {
      default: '#111720',
      paper: '#00000030',
    },
    primary: colors.lightBlue,
    secondary: colors.lightGreen,
  },
  shape: {
    borderRadius: 0,
  },
  overrides: {
    MuiButton: {
      label: {
        textTransform: 'none',
      },
    },
    MuiPaper: {
      elevation1: {
        border: '1px dashed #ffffff40',
      },
      elevation2: {
        border: '1px dashed #ffffff60',
      },
      elevation3: {
        border: '1px dashed #ffffff80',
      },
      elevation4: {
        border: '1px dashed #ffffff100',
      },
    },
  },
  shadows: ['none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none'],
});

export function ProviderConnected({
  children,
}: {
  children: JSX.Element;
}) {
  const [token, setToken] = useTokenController();
  const client = useApolloClient();
  useEffect(() => {
    setTimeout(() => {
      if (!token) setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiZ3Vlc3QiXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiZ3Vlc3QiLCJ4LWhhc3VyYS11c2VyLWlkIjoiZ3Vlc3QifSwiaWF0IjoxNjIxMzg2MDk2fQ.jwukXmInG4-w_4nObzqvMJZRCd4a1AXnW4cHrNF2xKY');
    }, 0);
  }, [token]);

  return <AuthProvider>{children}</AuthProvider>;
}

export const GRAPHQL_PATH = `${process.env.NEXT_PUBLIC_HASURA_PATH}/v1/graphql`;
export const GRAPHQL_SSL = !!+process.env.NEXT_PUBLIC_HASURA_SSL;

export function Provider({
  children,
}: {
  children: JSX.Element;
}) {
  return (
    <Analitics
      yandexMetrikaAccounts={[84726091]}
      googleAnalyticsAccounts={['G-DC5RRWLRNV']}
    >
      <ThemeProvider theme={theme}>
        <QueryStoreProvider>
          <LocalStoreProvider>
            <TokenProvider>
              <ApolloClientTokenizedProvider options={{ client: 'deeplinks-app', path: GRAPHQL_PATH, ssl: GRAPHQL_SSL, ws: !!process?.browser }}>
                <ProviderConnected>
                  {children}
                </ProviderConnected>
              </ApolloClientTokenizedProvider>
            </TokenProvider>
          </LocalStoreProvider>
        </QueryStoreProvider>
      </ThemeProvider>
    </Analitics>
  )
};
