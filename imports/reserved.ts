import { ApolloClient, gql } from "@apollo/client";
import { generateQuery, generateQueryData } from "./gql";

export interface ReseveOptions {
  count: number;
  client: ApolloClient<any>;
}

export type ReserveResult = number[];

const RESERVE = gql`query RESERVE($count: Int!) { reserve(count: $count) { ids } }`;

export async function reserve(options: ReseveOptions): Promise<ReserveResult> {
  const result = await options.client.query({
    query: RESERVE, variables: { count: options.count },
  });
  const ids: number[] = result?.data?.reserve?.ids || [];
  return ids;
}

