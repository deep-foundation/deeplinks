import { DeepClient } from './client.js';
import { gql } from '@apollo/client/index.js';

/**
 * Evaluates a client handler
 * @returns A promise that resolves to an object with either an error property that contains error or data property that contains result of the handler.
 */
export async function evalClientHandler(options: {
  value: string;
  deep: DeepClient;
  input?: any;
}): Promise<{
  error?: any;
  data?: any;
}> {
  const {
    value,
    deep,
    input = {},
  } = options;
  try {
    console.log('evalClientHandler', 'value', value);
    // const evalResult = (new Function(`return ${value}`))();
    // console.log('evalClientHandler', 'evalResult', evalResult);
    const evalResult = eval(value);
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
//   linkId: Id;
//   deep: DeepClient;
//   isolation_provider_id: Id;
//   execution_provider_id: Id;
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