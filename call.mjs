#!/usr/bin/env node
import { call, generateEnvs, _checkDeeplinksStatus, _generateAndFillEnvs } from './imports/engine-server.js';
import commandLineArgs from 'command-line-args';
import repl from 'repl';
import { DeepClient } from './imports/client.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { exec, spawn } from 'child_process';

// const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS || '{ "operation": "run" }';
const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS;

const optionDefinitions = [
  { name: 'config', alias: 'c', type: String },
  { name: 'exec', alias: 'e', type: Boolean },
  { name: 'run', alias: 'r', type: Boolean },
  { name: 'bash', type: String },
];

const options = commandLineArgs(optionDefinitions);

(async() => {
  const config = JSON.parse(options.config || DEEPLINKS_CALL_OPTIONS);
  console.log(config);

  if (config && options.run) {
    await call(config);
  }
  const envs = generateEnvs({ envs: { ...config }, isDeeplinksDocker: 0 });
  const envsStr = _generateAndFillEnvs({ envs, isDeeplinksDocker: 0 })
  console.log(envs);
  if (options.exec) {
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
  if (options.bash) {
    const bash = exec(`${envsStr} ${options.bash}`, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(stdout);
    });
  
    bash.stdout.on('data', function (data) {
      console.log('stdout: ' + data.toString());
    });

    bash.stderr.on('data', function (data) {
      console.log('stderr: ' + data.toString());
    });

    bash.on('exit', function (code) {
      console.log('child process exited with code ' + code.toString());
    });
  }
})()
