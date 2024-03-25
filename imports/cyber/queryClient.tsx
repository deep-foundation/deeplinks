import React, { useContext, useEffect, useState } from 'react';
import { CyberClient } from '@cybercongress/cyber-js';
// import { CYBER } from './config';
import { Option } from './types';
import { useQuery } from '@tanstack/react-query';

const QueryClientContext = React.createContext<Option<CyberClient>>(undefined);

export function useQueryClient() {
  return useContext(QueryClientContext);
}

function QueryClientProvider({ children }: { children: React.ReactNode }) {
  // added to support localStorage (error localstorage not exist)
  const [cyber, setCyber] = useState<any>()

  useEffect(() => {
   ( async () => {
    const cyber = (await import('./config')).CYBER
    console.log("useEffect queryClient", cyber)
    setCyber(cyber)
    // (window as any).CYBER = await import('./config')
   })()
  
  },[])

  const { data, error, isFetching } = useQuery({
    queryKey: ['cyberClient', 'connect'],
    queryFn: async () => {
      const cyber = (await import('./config')).CYBER
      // added window as any
      console.log("useQuery queryClient", cyber)
      return CyberClient.connect(cyber.CYBER_NODE_URL_API);
    },
  });

  if (isFetching) {
    return null;
  }

  if (error) {
    return <span>Error queryClient connect: {(error as any)?.message}</span>;
  }

  return (
    <QueryClientContext.Provider value={data}>
      {children}
    </QueryClientContext.Provider>
  );
}

export default QueryClientProvider;
