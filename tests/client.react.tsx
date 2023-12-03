import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient, SerialOperation, useDeepSubscription } from "../imports/client";
import { assert } from 'chai';
import { BoolExpLink, MutationInputLink } from "../imports/client_types";
import { inspect } from 'util'
import { createSerialOperation } from "../imports/gql";
import { render, screen, waitFor } from '@testing-library/react'
import { DeepProvider } from '../imports/client';
import React, { useEffect } from "react";
import { ApolloClient, ApolloProvider } from '@apollo/client/index.js';
import '@testing-library/jest-dom';
import { useDeep } from '../imports/client';
import { IApolloClientGeneratorOptions } from '@deep-foundation/hasura/client';
import { ApolloClientTokenizedProvider } from '@deep-foundation/react-hasura/apollo-client-tokenized-provider'
import { TokenProvider } from '../imports/react-token';
import { LocalStoreProvider } from '@deep-foundation/store/local';
import { QueryStoreProvider } from '@deep-foundation/store/query';
import { CookiesStoreProvider } from '@deep-foundation/store/cookies';
import { CapacitorStoreProvider } from "@deep-foundation/store/capacitor";

function Main({ options }: { options: IApolloClientGeneratorOptions }): JSX.Element {
  return <ApolloClientTokenizedProvider options={options}>
    <div></div>
  </ApolloClientTokenizedProvider>
}

const graphQlPath = `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`;
const ssl = !!+process.env.DEEPLINKS_HASURA_SSL;
const secret = process.env.DEEPLINKS_HASURA_SECRET;
const ws = true;

let apolloClient: ApolloClient<any>;
let deepClient: DeepClient;

beforeAll(async () => {
  apolloClient = generateApolloClient({
    path: graphQlPath,
    ssl,
    secret,
    ws
  });
  deepClient = new DeepClient({ apolloClient });
})

describe('client-react', () => {
  describe(`useDeepSubscription`, () => {
    it(`type`, async () => {
      await setup();

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.queryByText(/^Error:/)).not.toBeInTheDocument();

      await waitFor(() => {
        const dataLengthText = screen.getByText(/items loaded$/);
        expect(dataLengthText).toBeInTheDocument();
        const dataLength = parseInt(dataLengthText.textContent);
        expect(dataLength).toBeGreaterThan(0);
      }, { timeout: 10000 });



      async function setup() {
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");

        function TestHookComponent() {
          const { loading, data, error } = useDeepSubscription({
            type_id: typeTypeLinkId,
          });
          if (loading) {
            return <div>Loading...</div>;
          }

          if (error) {
            return <div>Error: {error.message}</div>
          }

          return <div>{data.length} items loaded</div>;
        }

        render(
          <ApolloProvider client={deepClient.apolloClient}>
            <DeepProvider>
              <TestHookComponent />
            </DeepProvider>
          </ApolloProvider>
        );
      }
    })
    it('rerender with loading:true must occur only once', async () => {
      let renderCount = 0;
      let loadingCount = 0;

      function TestComponent() {
        const deepSubscriptionResult = useDeepSubscription({
          id: {
            _id: ['@deep-foundation/core']
          }
        });

        renderCount += 1;

        if (deepSubscriptionResult.loading) {
          loadingCount += 1;
        }

        return null;
      }

      render(
        <ApolloProvider client={deepClient.apolloClient}>
          <DeepProvider>
            <TestComponent />
          </DeepProvider>
        </ApolloProvider>
      );

      await waitFor(() => {
        assert(renderCount > 1, 'TestComponent must be rerendered more than once');
        assert(loadingCount === 1, 'loading:true must occur only once');
      });
    });
    it('rerender with loading:false must occur only once', async () => {
      let renderCount = 0;
      let loadingCount = 0;

      function TestComponent() {
        const deepSubscriptionResult = useDeepSubscription({
          id: {
            _id: ['@deep-foundation/core']
          }
        });

        renderCount += 1;

        if (!deepSubscriptionResult.loading) {
          loadingCount += 1;
        }

        return null;
      }

      render(
        <ApolloProvider client={deepClient.apolloClient}>
          <DeepProvider>
            <TestComponent />
          </DeepProvider>
        </ApolloProvider>
      );

      await waitFor(() => {
        assert(renderCount > 1, 'TestComponent must be rerendered more than once');
        assert(loadingCount === 1, 'loading:false must occur only once');
      });
    });
  })
  describe('login', () => {
    it('login with token', async () => {
      const apolloClient = generateApolloClient({
        path: graphQlPath,
        ssl: ssl,
      });
      const unloginedDeep = new DeepClient({ apolloClient });
      const guest = await unloginedDeep.guest();
      const guestDeep = new DeepClient({ deep: unloginedDeep, ...guest });
      const admin = await guestDeep.login({
        linkId: await guestDeep.id('deep', 'admin'),
      });
      const adminToken = admin.token;
      const deep = new DeepClient({ deep: guestDeep, ...admin });
      let deepInComponent: DeepClient;

      function DeepConsumerComponent() {
        deepInComponent = useDeep();

        return null;
      }

      render(
          <CapacitorStoreProvider>
            <QueryStoreProvider>
              <CookiesStoreProvider>
                <LocalStoreProvider>
                  <TokenProvider>
                    <ApolloClientTokenizedProvider
                      options={{
                        client: "@deep-foundation/sdk",
                        token: adminToken,
                        path: graphQlPath,
                        ws: true,
                      }}
                    >
                      <DeepProvider>
                        <DeepConsumerComponent />
                      </DeepProvider>
                    </ApolloClientTokenizedProvider>
                  </TokenProvider>
                </LocalStoreProvider>
              </CookiesStoreProvider>
            </QueryStoreProvider>
          </CapacitorStoreProvider>
      );

      await waitFor(() => {
        assert(deepInComponent.linkId !== 0, 'deep.linkId is 0. Failed to login');
      });
    })
    it('login with token in apollo client', async () => {
      // await deepClient.whoami(); // ApolloError: Int cannot represent non-integer value: NaN
      const unloginedDeep = new DeepClient({ apolloClient });
      const guest = await unloginedDeep.guest();
      const guestDeep = new DeepClient({ deep: unloginedDeep, ...guest });
      const admin = await guestDeep.login({
        linkId: await guestDeep.id('deep', 'admin'),
      });
      const deepClient = new DeepClient({ deep: guestDeep, ...admin });
      assert.isTrue(!!deepClient.token)
      let deepInComponent: DeepClient;

      function TestComponent() {
        deepInComponent = useDeep();

        return null;
      }

      render(
        <QueryStoreProvider>
          <LocalStoreProvider>
            <ApolloClientTokenizedProvider options={{
              path: graphQlPath,
              ssl: ssl,
              token: deepClient.token
            }}>
              <TokenProvider>
                <DeepProvider>
                  <TestComponent />
                </DeepProvider>
              </TokenProvider>
            </ApolloClientTokenizedProvider>
          </LocalStoreProvider>
        </QueryStoreProvider>
      );

      await waitFor(() => {
        assert(deepInComponent.linkId !== 0, 'deep.linkId is 0. Failed to login');
      });
    })
  })
});