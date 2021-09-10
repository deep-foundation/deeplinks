// @flow

import React, { useEffect, useContext } from 'react';
import type { Context } from 'react';

import { useRouter } from 'next/router';

import ym, { YMInitializer } from 'react-yandex-metrika';
import ga from 'react-ga';

export interface IAnalyticsContext {
  event?: (eventName: string) => void;
}

export const AnalyticsContext = React.createContext<IAnalyticsContext>({
  event(eventName) {
    ym('reachGoal', eventName);
    ga.event({
      category: 'events',
      action: eventName,
    });
  }
});

export function useAnalitics(context: Context<IAnalyticsContext> = AnalyticsContext) {
  return useContext(context);
};

const RouterAnalytics = () => {
  const router = useRouter();

  useEffect(() => {
    ga.pageview(router?.asPath);
  }, []);

  return null;
};

export const Analitics = React.memo<any>(({
  yandexMetrikaAccounts = [],
  googleAnalyticsAccounts = [],
  context = AnalyticsContext,
  debug = false,
  children,
}: {
  yandexMetrikaAccounts?: number[];
  googleAnalyticsAccounts?: string[];
  context?: Context<IAnalyticsContext>;
  debug?: boolean;
  children: any;
}) => {
  useEffect(() => {
    const account = googleAnalyticsAccounts?.[0];
    // @ts-ignore
    if (account) ga.initialize({
      trackingId: account,
    }, {
      debug,
    });
  }, []);

  return <>
    <YMInitializer
      accounts={yandexMetrikaAccounts}
      options={{
      clickmap: true,
      webvisor: true,
      ecommerce: true,
      trackHash: true,
      trackLinks: true,
      triggerEvent: true,
      }}
    />
    <context.Provider value={{}}>
      <RouterAnalytics/>
      {children}
    </context.Provider>
  </>
});
