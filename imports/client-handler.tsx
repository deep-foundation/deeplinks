import { DeepClient } from "./client";
import { gql } from '@apollo/client';

export function evalClientHandler({
  value,
  deep,
}: {
  value: string;
  deep: DeepClient;
}): {
  error?: any;
  data?: any;
} {
  try {
    const data = eval(value);
    return {
      data: data({ deep, require, gql }),
    };
  } catch(error) {
    return { error };
  }
}

export async function callClientHandler({
  linkId,
  deep,
  isolation_provider_id,
  execution_provider_id,
}: {
  linkId: number;
  deep: DeepClient;
  isolation_provider_id: number;
  execution_provider_id: number;
}): Promise<{
  error?: any;
  data?: any;
}> {
  const { data: handlers } = await deep.select({
    src_id: { _eq: linkId },
    isolation_provider_id: { _eq: isolation_provider_id },
    execution_provider_id: { _eq: execution_provider_id },
  }, {
    table: 'handlers',
    returning: `
      src_id
      dist_id
      dist {
        value
      }
      handler_id
      isolation_provider_id
      execution_provider_id
    `,
  });
  const handler = handlers[0];
  if (handler) return { error: '!handler' };
  const value = handler?.dist?.value?.value;
  if (handler?.dist?.value?.value) return { error: '!value' };
  return evalClientHandler({ value, deep });
}