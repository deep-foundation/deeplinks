import React from 'react';
import { TokenContext } from '@deep-foundation/react-hasura/token-context.js';
import { useLocalStore } from '@deep-foundation/store/local.js';
import { useCookiesStore } from '@deep-foundation/store/cookies.js'

export function useTokenController() : [string, (string) => string] {
  const [localToken, setLocalToken] = useLocalStore('dc-dg-token', '');
  const [cookieToken, setCookieToken] = useCookiesStore('dc-dg-token', '');

  return [localToken || cookieToken, (newToken) => {
    const result = setLocalToken(newToken);
    setCookieToken(newToken);
    return result;
  }]
}

export function TokenProvider({ children }: { children?: any }) {
  const [token, setToken] = useTokenController();
  console.log('TokenProvider', { token });
  // @ts-ignore
  return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
}
