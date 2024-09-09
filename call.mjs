#!/usr/bin/env node
import { call, generateEnvs, _checkDeeplinksStatus, _generateAndFillEnvs } from './imports/engine-server.js';
import commandLineArgs from 'command-line-args';
import repl from 'repl';
import { DeepClient } from './imports/client.js';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { exec, spawn } from 'child_process';
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
const __dirname = process.cwd();

function generateRandomKey(length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

async function getPublicIP() {
  return (await axios.get('https://api.ipify.org'))?.data;
}


// const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS || '{ "operation": "run" }';
const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS;

const optionDefinitions = [
  { name: 'config', alias: 'c', type: String },
  { name: 'exec', alias: 'e', type: Boolean },
  { name: 'run', alias: 'r', type: Boolean },
  { name: 'bash', type: String },

  { name: 'last', alias: 'l', type: Boolean }, // restore

  { name: 'generate', alias: 'g', type: Boolean },
  { name: 'deeplinks', type: String },
  { name: 'deepcase', type: String },
  { name: 'ssl', type: Boolean },

  { name: 'envs', type: Boolean },
];

const options = commandLineArgs(optionDefinitions);

if (options.generate) {
  const hasuraKey = generateRandomKey(32);
  const postgresKey = generateRandomKey(32);
  const minioAccess = generateRandomKey(32);
  const minioSecret = generateRandomKey(32);
  // const jwt_secret = JSON.stringify(jwt({ secret: hasuraKey })).replace('"', '\"'); 
  let publicIp;
  try {
    publicIp = await getPublicIP();
  } catch(e) {}
  const deeplinks = options.deeplinks || `http://${publicIp}:3006`;
  const deepcase = options.deepcase || `http://${publicIp}:3007`;
  if ((!options.deeplinks || !options.deepcase) && !publicIp) throw new Error(`--deepcase and --deeplinks must be defined, or publicIp available`);
  const jwtSecret = `'{\"type\":\"HS256\",\"key\":\"${crypto.randomBytes(50).toString('base64')}\"}'`;
  const generated = {
    "operation": "run",
    "envs": {
      "DEEPLINKS_PUBLIC_URL": `${deeplinks}`,
      "NEXT_PUBLIC_DEEPLINKS_URL": `${deeplinks}`,
      "NEXT_PUBLIC_GQL_PATH": `${deeplinks}/gql`,
      "NEXT_PUBLIC_GQL_SSL": "0",
      "NEXT_PUBLIC_DEEPLINKS_SERVER": `${deepcase}`,
      "NEXT_PUBLIC_ENGINES_ROUTE": "0",
      "NEXT_PUBLIC_DISABLE_CONNECTOR": "1",
      "JWT_SECRET": jwtSecret,
      "HASURA_GRAPHQL_JWT_SECRET": jwtSecret,
      "DEEP_HASURA_GRAPHQL_JWT_SECRET": jwtSecret,
      "DEEPLINKS_HASURA_STORAGE_URL": "http://deep-hasura-storage:8000/",
      "HASURA_ENDPOINT": "http://deep-hasura:8080/v1",
      "DEEPLINKS_HASURA_PATH": "deep-hasura:8080",
      "DOCKER_DEEPLINKS_URL": "http://deep-links:3006",
      "MIGRATIONS_DEEPLINKS_URL": "http://deep-links:3006",
      "HASURA_GRAPHQL_ADMIN_SECRET": hasuraKey,
      "MIGRATIONS_HASURA_SECRET": hasuraKey,
      "DEEPLINKS_HASURA_SECRET": hasuraKey,
      "POSTGRES_PASSWORD": postgresKey,
      "HASURA_GRAPHQL_DATABASE_URL": `postgres://postgres:${postgresKey}@deep-postgres:5432/postgres?sslmode=disable`,
      'DEEP_HASURA_GRAPHQL_LOG_LEVEL': 'error',
      "POSTGRES_MIGRATIONS_SOURCE": `postgres://postgres:${postgresKey}@deep-postgres:5432/postgres?sslmode=disable`,
      "RESTORE_VOLUME_FROM_SNAPSHOT": options.last ? '1': '0',
      "MANUAL_MIGRATIONS": "1",
      "MINIO_ROOT_USER": minioAccess,
      "MINIO_ROOT_PASSWORD": minioSecret,
      "S3_ACCESS_KEY": minioAccess,
      "S3_SECRET_KEY": minioSecret,
    }
  };
  console.log(generated);
  fs.writeFileSync(__dirname+'/deep.config.json', JSON.stringify(generated));
}

(async() => {
  let deepConfig;
  try {
    deepConfig = JSON.parse(fs.readFileSync(__dirname+'/deep.config.json', { encoding: 'utf8' }));
  } catch(e) {}
  if (!options.config && !deepConfig) {
    console.log(`${__dirname}/deep.config.json or -c "$(cat your/path/to/deep.config.json)" is not defined`);
    return;
  }
  const config = deepConfig || JSON.parse(options.config || DEEPLINKS_CALL_OPTIONS);
  console.log('config', config);

  if (config && options.run) {
    await call(config);
  }
  const envs = generateEnvs({ envs: { ...(config?.envs || {}) }, isDeeplinksDocker: 0 });
  const envsStr = _generateAndFillEnvs({ envs, isDeeplinksDocker: 0 })

  if (options.envs) {
    console.log('envs', envs);
    console.log('ENVS', envsStr);
  }

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
      console.log(data.toString());
    });

    bash.stderr.on('data', function (data) {
      console.error(data.toString());
    });

    bash.on('exit', function (code) {
      console.log('child process exited with code: ' + code.toString());
    });
  }
})()
