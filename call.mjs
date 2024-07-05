#!/usr/bin/env node
import { call, generateEnvs, _checkDeeplinksStatus } from './imports/engine-server.js';
import commandLineArgs from 'command-line-args';
import repl from 'repl';
import { DeepClient } from './imports/client.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';

// const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS || '{ "operation": "run" }';
const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS;

const optionDefinitions = [
  { name: 'config', alias: 'c', type: String },
  { name: 'exec', alias: 'e', type: Boolean },
  { name: 'run', alias: 'r', type: Boolean },
];

const options = commandLineArgs(optionDefinitions);

(async() => {
  const config = JSON.parse(options.config || DEEPLINKS_CALL_OPTIONS);
  console.log(config);

  if (config && options.run) {
    await call(config);
  }
  if (options.exec) {
    const envs = generateEnvs({ envs: { ...config }, isDeeplinksDocker: 0 });
    console.log(envs);
    const deep = new DeepClient({
      apolloClient: generateApolloClient({
        path: `${envs.DEEPLINKS_HASURA_PATH}/v1/graphql`,
        ssl: !!+envs.DEEPLINKS_HASURA_SSL,
        secret: envs.DEEPLINKS_HASURA_SECRET,
      }),
    })
    const r = repl.start('> ');
    r.context.config = config;
    r.context.deep = deep;
  }
})()
