import { ApolloClient, gql } from "@apollo/client";
import { GLOBAL_NAME_PROMISE, GLOBAL_NAME_REJECTED, GLOBAL_NAME_RESOLVED, GLOBAL_NAME_THEN } from "./global-ids";
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
