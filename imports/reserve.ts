import { ApolloClient, gql } from "@apollo/client";
import { generateQuery, generateQueryData, generateSerial, insertMutation } from "./gql";

export interface ReservedOptions {
  count: number;
  client: ApolloClient<any>;
}

export const RESERVE = gql`mutation RESERVE($count: Int!) {
  reserve(count: $count) {
    ids
  }
}`;

export async function reserve(options: ReservedOptions) {
  const count = options.count;
  const result = await options.client.mutate({
    mutation: RESERVE,
    variables: { count },
  });
  return result?.data?.reserve.ids;
};
