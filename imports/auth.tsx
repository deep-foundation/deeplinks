import { useQuery } from '@apollo/client';
import { useTokenController } from '@deepcase/deeplinks/imports/react-token';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import { useLocalStore } from '@deepcase/store/local';
import { useEffect } from 'react';
import { JWT } from './gql';

export function useAuthNode() {
  return useLocalStore('use_auth_link_id', '');
}

export function AuthProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const [linkId] = useAuthNode();
  const [token, setToken] = useTokenController();

  return children;
}

export function useAuth() {
  const [linkId, setLinkId] = useAuthNode();
  const [token, setToken] = useTokenController();
  const gql = useQuery(JWT, { variables: {}, skip: true });

  return {
    token,
    linkId,
    setLinkId: async (linkId) => {
      if (!+linkId) {
        setLinkId(linkId);
        setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiZ3Vlc3QiXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiZ3Vlc3QiLCJ4LWhhc3VyYS11c2VyLWlkIjoiZ3Vlc3QifSwiaWF0IjoxNjIxMzg2MDk2fQ.jwukXmInG4-w_4nObzqvMJZRCd4a1AXnW4cHrNF2xKY');
        return;
      }
      const result = await gql.refetch({ linkId: linkId, role: 'link' });
      console.log({ linkId, result, gql });
      if (result?.data?.jwt?.token) {
        setLinkId(linkId);
        setToken(result?.data?.jwt?.token);
      }
    },
  };
}