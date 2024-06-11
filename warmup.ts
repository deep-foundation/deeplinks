import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "./imports/client.js";
import axios from 'axios';
import Debug from 'debug';
import { serializeError } from 'serialize-error';
const debug = Debug('deeplinks:warmup');

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

export const checkSystemStatus = async (): Promise<{ result?: any; error?: any }> => {
  try {
    const status = await axios.post(`http://localhost:3006/gql`, { "query": "{ healthz { status } }" }, { validateStatus: status => true, timeout: 7000 });
    // console.log('system status result', JSON.stringify(status?.data));
    return { result: status?.data?.data?.healthz?.[0].status };
  } catch (e) {
    // console.log('system status error', e);
    const serializedError = serializeError(e);
    return { error: serializedError };
  }
};

(async () => {
  let systemIsReady = false;
  while(!systemIsReady) {
    systemIsReady = (await checkSystemStatus()).result === 'ok';
  }
  const stringClientHandlerId = await deep.id("@deep-foundation/deepcase", "stringClientHandler");
  const stringClientHandler = (await deep.select(stringClientHandlerId));
  // console.log(JSON.stringify(stringClientHandler, null, 2));
  let jsx = stringClientHandler?.data?.[0]?.value?.value;
  // console.log(jsx);
  if (jsx) {
    var lastChar = jsx.substr(jsx.length - 1);
    // console.log('lastChar', lastChar);
    if (lastChar == '}') {
      jsx += " ";
    } else {
      jsx = jsx.trim();
    }
    await deep.update({ link_id: stringClientHandlerId }, { value: jsx }, { table: `strings` });
    console.log('JavaScript Docker Isolation Provider startup triggered.');
  } else {
    console.log('Link value to trigger JavaScript Docker Isolation Provider startup is not found.');
  }
})();