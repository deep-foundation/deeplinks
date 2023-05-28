import React from 'react';
import uniqid from 'uniqid';
import { TokenContext } from '@deep-foundation/react-hasura/token-context.js';
import { useLocalStore } from '@deep-foundation/store/local.js';

export function useTokenController() {
  return useLocalStore('dc-dg-token', '');
}

export function TokenProvider({ children }: { children?: any }) {
  const [token, setToken] = useTokenController();
  // console.log('TokenProvider', { token });
  return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
}
