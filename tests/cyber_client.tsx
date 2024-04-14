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
import { generateCyberDeepClient } from '../imports/cyber.js'
import type { CyberDeepClient } from '../imports/cyber.js'

import * as cyberConfig from '../imports/cyber/config';
// function Main({ options }: { options: IApolloClientGeneratorOptions }): JSX.Element {
//   return <ApolloClientTokenizedProvider options={options}>
//     <div></div>
//   </ApolloClientTokenizedProvider>
// }
/*
const graphQlPath = `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`;
const ssl = !!+process.env.DEEPLINKS_HASURA_SSL;
const secret = process.env.DEEPLINKS_HASURA_SECRET;
const ws = true;
*/
let deepClient: CyberDeepClient<any>;

beforeAll(async () => {
  deepClient = await generateCyberDeepClient({
    config: cyberConfig.CYBER,
  });
})

describe('CyberDeepClient', () => {
  describe(`generators`, async () => {
    it(`particles`, async () => {});
    it(`cyberlinks`, async () => {});
    it(`ps by cbls`, async () => {});
    it(`ps by cbls with ps`, async () => {});
    it(`cbls by ps`, async () => {});
    it(`cbls by ps with cbls`, async () => {});
    it(`cbls by ps with cbls with ps`, async () => {});
  });
});