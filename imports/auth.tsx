import { useQuery } from '@apollo/react-hooks';
import { useTokenController } from '@deepcase/deepgraph/imports/react-token';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import { useLocalStore } from '@deepcase/store/local';
import { useEffect } from 'react';
import { JWT } from './gql';

export function useAuthNode() {
  return useLocalStore('dc_dg_use_auth_link_id', '');
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
      const result = await gql.refetch({ linkId: linkId, role: 'link' });
      console.log({ linkId, result, gql });
      if (result?.data?.dc_dg_jwt?.token) {
        setLinkId(linkId);
        setToken(result?.data?.dc_dg_jwt?.token);
      }
    },
  };
}