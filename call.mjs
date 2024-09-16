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
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isGitpod = !!process?.env?.GITPOD_WORKSPACE_ID;

const execP = promisify(exec);

// const __filename = fileURLToPath(import.meta.url);
// const cwd = dirname(__filename);
const cwd = process.cwd();

function generateRandomKey(length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

async function getPublicIP() {
  return (await axios.get('https://api.ipify.org'))?.data;
}

async function gitpodUrl(port) {
  const r = await execP(`echo $(gp url ${port})`);
  return r.stdout.replace('\n','')
}

// const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS || '{ "operation": "run" }';
const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS;

const _exec = (command) => {
  const bash = exec(command, (err, stdout, stderr) => {
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
    console.log(data.toString());
  });

  bash.on('exit', function (code) {
    console.log('child process exited with code: ' + code.toString());
  });
};

const optionDefinitions = [
  { name: 'config', type: String },
  { name: 'exec', type: Boolean },
  { name: 'up', type: Boolean },
  { name: 'down', type: Boolean },
  { name: 'snapshot', type: Boolean }, // restore from snapshot
  { name: 'bash', type: String },

  { name: 'migrate', type: Boolean }, // migrate
  { name: 'unmigrate', type: Boolean }, // unmigrate

  { name: 'generate', type: Boolean },
  { name: 'deeplinks', type: String },
  { name: 'perception', type: String },
  { name: 'ssl', type: Boolean },

  { name: 'envs', type: Boolean },

  { name: 'force', type: Boolean },
  { name: 'localhost', type: Boolean },
];

const options = commandLineArgs(optionDefinitions);

if (options.generate && (options.force || !fs.existsSync(`${cwd}/deep.config.json`))) {
  const hasuraKey = generateRandomKey(32);
  const postgresKey = 'd2ef4e87ecc262ff4615887006d8b7b4'; // generateRandomKey(32);
  const minioAccess = generateRandomKey(32);
  const minioSecret = generateRandomKey(32);
  // const jwt_secret = JSON.stringify(jwt({ secret: hasuraKey })).replace('"', '\"'); 
  let publicIp;
  try {
    publicIp = await getPublicIP();
  } catch(e) {}
  const deeplinks = options.deeplinks || `http://${publicIp}:3006`;
  const perception = options.perception || `http://${publicIp}:3007`;
  if ((!options.deeplinks || !options.perception) && !publicIp) throw new Error(`--perception and --deeplinks must be defined, or publicIp available`);
  const jwtSecret = `'{\"type\":\"HS256\",\"key\":\"${crypto.randomBytes(50).toString('base64')}\"}'`;
  const generated = {
    "operation": "run",
    "envs": {
      "DEEPLINKS_PUBLIC_URL": isGitpod ? await gitpodUrl(3006) : `${deeplinks}`,
      "NEXT_PUBLIC_DEEPLINKS_URL": isGitpod ? await gitpodUrl(3006) : `${deeplinks}`,
      "NEXT_PUBLIC_GQL_PATH": isGitpod ? await gitpodUrl(3006)+'/gql' : `${deeplinks}/gql`,
      "NEXT_PUBLIC_GQL_SSL": "0",
      "NEXT_PUBLIC_DEEPLINKS_SERVER": isGitpod ? await gitpodUrl(3007) : `${perception}`,
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
      "RESTORE_VOLUME_FROM_SNAPSHOT": '0',
      "MANUAL_MIGRATIONS": '0',
      // "RESTORE_VOLUME_FROM_SNAPSHOT": options.last || isGitpod ? '1': '0',
      // "MANUAL_MIGRATIONS": options.migrate ? '1': '0',
      "MINIO_ROOT_USER": minioAccess,
      "MINIO_ROOT_PASSWORD": minioSecret,
      "S3_ACCESS_KEY": minioAccess,
      "S3_SECRET_KEY": minioSecret,
    }
  };
  console.log(generated);
  fs.writeFileSync(cwd+'/deep.config.json', JSON.stringify(generated, null, 2));
}

(async() => {
  let deepConfig;
  try {
    deepConfig = JSON.parse(fs.readFileSync(cwd+'/deep.config.json', { encoding: 'utf8' }));
  } catch(e) {}
  if (!options.config && !deepConfig) {
    console.log(`${cwd}/deep.config.json or -c "$(cat your/path/to/deep.config.json)" is not defined`);
    return;
  }
  const config = deepConfig || JSON.parse(options.config || DEEPLINKS_CALL_OPTIONS);
  if (options.localhost) {
    config.DEEPLINKS_PUBLIC_URL = 'http://localhost:3006'
    config.NEXT_PUBLIC_DEEPLINKS_URL = 'http://localhost:3006'
    config.NEXT_PUBLIC_GQL_PATH = 'http://localhost:3006/gql'
  }
  console.log('config', config);

  if (config && options.down) {
    _exec(`cd ${__dirname} && docker compose -p deep down`);
  }
  if (config && options.up) {
    await call(config);
  }
  const envs = generateEnvs({ envs: { ...(config?.envs || {}) }, isDeeplinksDocker: 0 });
  const envsStr = _generateAndFillEnvs({ envs, isDeeplinksDocker: 0 })

  if (options.envs) {
    console.log('envs', envs);
    console.log('ENVS', envsStr);
  }

  if (options.snapshot) {
    await execP(`npx -y -q wait-on --timeout 100000 ${envs.NEXT_PUBLIC_GQL_PATH}`);
    _exec(`${envsStr} cd ${__dirname} && docker compose -p deep stop hasura postgres && (docker exec deep-links sh -c "npm run snapshot:last" || true) && docker compose -p deep start hasura postgres`);
  }
  
  if (options.migrate) {
    await execP(`npx -y -q wait-on --timeout 100000 ${envs.NEXT_PUBLIC_GQL_PATH}`);
    _exec(`${envsStr} cd ${__dirname} && npm run migrate`);
  }
  
  if (options.unmigrate) {
    await execP(`npx -y -q wait-on --timeout 100000 ${envs.NEXT_PUBLIC_GQL_PATH}`);
    _exec(`${envsStr} cd ${__dirname} && npm run unmigrate`);
  }
  
  if (options.exec) {
    await execP(`npx -y -q wait-on --timeout 100000 ${envs.NEXT_PUBLIC_GQL_PATH}`);
    const start = envs.NEXT_PUBLIC_GQL_PATH.indexOf('://') + 3;
    const path = envs.NEXT_PUBLIC_GQL_PATH.slice(start);
    const deep = new DeepClient({
      apolloClient: generateApolloClient({
        path: path,
        ssl: !!+envs.DEEPLINKS_HASURA_SSL,
        secret: envs.DEEPLINKS_HASURA_SECRET,
      }),
    })
    const r = repl.start('> ');
    r.context.__dirname = __dirname;
    r.context.config = config;
    r.context.deep = deep;
  }

  if (options.bash) {
    _exec(`${envsStr} cd ${__dirname} && ${options.bash}`);
  }
})()
