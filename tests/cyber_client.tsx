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
import {generateCyberInDeepClient} from '../imports/cyber.js'
import type {CyberDeepClient} from '../imports/cyber.js'
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
let cyberClient: CyberDeepClient<any>;

beforeAll(async () => {
  cyberClient = await generateCyberInDeepClient({});
})

describe('cyber-client', () => {
  it(`deep.linkId guest and login`, async () => {
    // assert.equal(deepClient.linkId, undefined);
    // assert.notEqual(deepClient.linkId, 0);
    // const guest = await deepClient.guest();
    // const guestDeep = new DeepClient({ deep: deepClient, ...guest });
    // assert.notEqual(guestDeep.linkId, undefined);
    // assert.notEqual(guestDeep.linkId, 0);
    // const guestId = guestDeep.linkId;
    // const adminId = await guestDeep.id('deep', 'admin');
    // assert.notEqual(adminId, undefined)
    // const admin = await guestDeep.login({ linkId: adminId });
    // assert.equal(admin.error, undefined)
    // const deep = new DeepClient({ deep: deepClient, ...admin });
    // assert.notEqual(deep.linkId, undefined);
    // assert.notEqual(deep.linkId, 0);
    // assert.notEqual(deep.linkId, guestId);

    const cyberClient = await generateCyberInDeepClient({});
    cyberClient.insert({});
  });
});