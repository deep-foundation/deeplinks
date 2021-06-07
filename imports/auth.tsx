import { useQuery } from '@apollo/react-hooks';
import { useTokenController } from '@deepcase/deepgraph/imports/react-token';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import { useLocalStore } from '@deepcase/store/local';
import { useEffect } from 'react';
import { JWT } from './gql';

export function useAuthNode() {
  return useLocalStore('dc_dg_use_auth_node_id', 0);
}

export function AuthProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const [nodeId] = useAuthNode();
  const [token, setToken] = useTokenController();
  console.log(token);

  const jwt = useQuery(JWT, { variables: { nodeId, role: 'node' } });
  useEffect(() => {
    jwt.refetch();
  }, [nodeId]);
  useEffect(() => {
    if (jwt?.data?.dc_dg_jwt?.token) setToken(jwt?.data?.dc_dg_jwt?.token);
  }, [jwt]);

  return children;
}

export function useAuth() {
  const [nodeId, setNodeId] = useAuthNode();
  const [token, setToken] = useTokenController();

  return {
    token,
    nodeId,
    setNodeId,
  };
}