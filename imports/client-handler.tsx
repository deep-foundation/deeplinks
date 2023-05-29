import { DeepClient } from './client.js';
import { gql } from '@apollo/client/index.js';

export async function evalClientHandler({
  value,
  deep,
  input = {},
}: {
  value: string;
  deep: DeepClient;
  input?: any;
}): Promise<{
  error?: any;
  data?: any;
}> {
  try {
    console.log('evalClientHandler', 'value', value);
    const evalResult = eval(value);
    console.log('evalClientHandler', 'evalResult', evalResult);
    if (typeof evalResult === 'function') {
      return {
        data: await evalResult({ deep, gql, ...input }),
      };
    } else {
      return {
        error: new Error(`Client handler must return a function, got ${typeof evalResult}`),
      };
    }
  } catch(error) {
    console.log('evalClientHandler', 'error', error);
    return { error };
  }
  return {};
}

// export async function callClientHandler({
//   linkId,
//   deep,
//   isolation_provider_id,
//   execution_provider_id,
// }: {
//   linkId: number;
//   deep: DeepClient;
//   isolation_provider_id: number;
//   execution_provider_id: number;
// }): Promise<{
//   error?: any;
//   data?: any;
// }> {
//   const { data: handlers } = await deep.select({
//     src_id: { _eq: linkId },
//     isolation_provider_id: { _eq: isolation_provider_id },
//     execution_provider_id: { _eq: execution_provider_id },
//   }, {
//     table: 'handlers',
//     returning: `
//       src_id
//       dist_id
//       dist {
//         value
//       }
//       handler_id
//       isolation_provider_id
//       execution_provider_id
//     `,
//   });
//   const handler = handlers[0];
//   if (handler) return { error: '!handler' };
//   const value = handler?.dist?.value?.value;
//   if (handler?.dist?.value?.value) return { error: '!value' };
//   return evalClientHandler({ value, deep });
// }