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

  return children;
}

export function useAuth() {
  const [nodeId, setNodeId] = useAuthNode();
  const [token, setToken] = useTokenController();
  const gql = useQuery(JWT, { variables: { nodeId, role: 'link' }, skip: true });

  return {
    token,
    nodeId,
    setNodeId: async (nodeId) => {
      const result = await gql.refetch({ nodeId, role: 'link' });
      console.log({ nodeId, result, gql });
      if (result?.data?.dc_dg_result?.token) {
        setNodeId(nodeId);
        setToken(result?.data?.dc_dg_jwt?.token);
      }
    },
  };
}