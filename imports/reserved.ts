import { gql } from '@apollo/client/index.js';
import type { ApolloClient } from '@apollo/client/index.js';

import { generateQuery, generateQueryData } from './gql/index.js';
import { Id } from './minilinks.js';

export interface ReseveOptions {
  count: number;
  client: ApolloClient<any>;
}

export type ReserveResult = Id[];

const RESERVE = gql`query RESERVE($count: Int!) { reserve(count: $count) { ids } }`;

export async function reserve(options: ReseveOptions): Promise<ReserveResult> {
  const result = await options.client.query({
    query: RESERVE, variables: { count: options.count },
  });
  const ids: Id[] = result?.data?.reserve?.ids || [];
  return ids;
}

