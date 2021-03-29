import React from 'react';
import uniqid from 'uniqid';
import { TokenContext } from '@deepcase/react-hasura/token-context';
import { useLocalStore } from '@deepcase/store/local';

export function useTokenController() {
  return useLocalStore('dc-dg-token', '');
}

export function TokenProvider({ children }: { children?: any }) {
  const [token, setToken] = useTokenController();
  return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
}
