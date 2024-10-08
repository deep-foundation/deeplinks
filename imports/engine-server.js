import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import internalIp from 'internal-ip';
import axios from 'axios';
import Debug from 'debug';
// @ts-ignore
import fixPath from 'fix-path';
import fs from 'fs';
import { rootPath } from 'root-path-electron';
import sudo from 'sudo-prompt';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const debug = Debug('deeplinks:engine-server');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const platform = process?.platform;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function isElectron() {
  // @ts-ignore
  if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process?.type === 'renderer') {
      return true;
  }
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process?.versions?.electron) {
      return true;
  }
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator?.userAgent.indexOf('Electron') >= 0) {
      return true;
  }
  return false;
}

const printLog = (logPath, logObject, title) => {
  const textToLog = `${title ? `${title}: ` : ''}${typeof logObject === 'string' ? logObject : JSON.stringify(logObject, null, 2)?.replace("\\n", "\n")}`;
  console.log('MIGRATIONS_DIR', logPath);
  console.log('existsSync deep', fs.existsSync(path.normalize(`${logPath}`)));
  console.log('existsSync logs', fs.existsSync(path.normalize(`${logPath}/deeplogs.txt`)));
  if (!fs.existsSync(path.normalize(`${logPath}`))) fs.mkdirSync(logPath);
  if (!fs.existsSync(path.normalize(`${logPath}/deeplogs.txt`))) fs.writeFileSync(path.normalize(`${logPath}/deeplogs.txt`), '\n\nDeep-logs started... Hello bugfixers!\n\n');
  fs.appendFileSync(path.normalize(`${logPath}/deeplogs.txt`), `${textToLog}\n\n`);
  log(textToLog);
}


// const appPath = isElectron() ? remote.app.getAppPath() : process.cwd();
function findParentPackageJson(dir) {
  if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
  }
  const parentDir = path.resolve(dir, '..');
  if (dir === parentDir) {
      return null;
  }
  return findParentPackageJson(parentDir);
}

let rootDir = findParentPackageJson(__dirname);

if (rootDir && path.basename(rootDir) === 'app') {
  rootDir = path.dirname(rootDir);
}

const appPath = isElectron() ? rootPath : (rootDir || process.cwd());
const filePath = path.normalize(`${appPath}/package.json`);
const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));


const execP = promisify(exec);
const DOCKER = process.env.DOCKER || '0';
const DEEPLINKS_PUBLIC_URL = process.env.DEEPLINKS_PUBLIC_URL || 'http://localhost:3006';
const NEXT_PUBLIC_DEEPLINKS_SERVER = process.env.NEXT_PUBLIC_DEEPLINKS_SERVER || 'http://localhost:3007';
// export interface ICallOptions {
//   operation: 'run' | 'sleep' | 'reset';
//   envs: { [key: string]: string; };
// }

// interface ICheckDeeplinksStatusReturn {
//   result?: 1 | 0 | undefined;
//   error?: any;
// }
// interface IExecEngineReturn {
//   result?: {
//     stdout: string;
//     stderr: string;
//   };
//   error?: any;
// }
// interface ICheckPermissionReturn {
//   result?: {
//     stdout: string;
//     stderr: string;
//   };
//   error?: any;
// }

// interface IGenerateEngineStrOptions {
//   operation: string;
//   isDeeplinksDocker: 0 | 1 | undefined;
//   isDeepcaseDocker: 0 | 1 | undefined;
//   envs: any;
//   needNPX: boolean;
// }
// interface IGenerateEnvsOptions {
//   isDeeplinksDocker: 0 | 1 | undefined;
//   envs: any;
// }

const _hasura = path.normalize(`${packageJson.name === '@deep-foundation/deeplinks' ? (rootDir || process.cwd()) : appPath}/node_modules/@deep-foundation/hasura`); // даже если мы не в дипкейсе, то это скрипт из диплинкса, который зависит от хасуры, а значит в модулях есть хасура.
const _deeplinks = path.normalize( packageJson.name === '@deep-foundation/deeplinks' ? (rootDir || process.cwd()) : `${appPath}/node_modules/@deep-foundation/deeplinks`); // если в package.json название пакета не диплинксовое - то мы не там, а значит идём в модули

const handleEnvWindows = (k, envs) => ` set ${k}=${typeof(envs[k]) === 'object' ? JSON.stringify(envs[k]) : envs[k]}&&`;
const handleEnvUnix = (k, envs) => ` export ${k}=${typeof(envs[k]) === 'object' ? JSON.stringify(envs[k]) : envs[k]} &&`;
const handleEnv = platform === "win32" ? handleEnvWindows : handleEnvUnix;

export const generateEnvs = ({ envs, isDeeplinksDocker }) => {
  const isGitpod = !!process.env['GITPOD_GIT_USER_EMAIL'] && !!process.env['GITPOD_TASKS'];
  const hasuraPort = '8080';
  const deeplinksPort = '3006';
  const deepcasePort = '3007';

  envs['DEEPLINKS_PORT'] = envs['DEEPLINKS_PORT'] ? envs['DEEPLINKS_PORT'] : deeplinksPort;
  envs['DEEPCASE_PORT'] = envs['DEEPCASE_PORT'] ? envs['DEEPCASE_PORT'] : deepcasePort;
  envs['DEEPLINKS_PUBLIC_URL'] = envs['DEEPLINKS_PUBLIC_URL'] ? envs['DEEPLINKS_PUBLIC_URL'] : DEEPLINKS_PUBLIC_URL;
  envs['DEEPLINKS_HASURA_STORAGE_URL'] = envs['DEEPLINKS_HASURA_STORAGE_URL'] ? envs['DEEPLINKS_HASURA_STORAGE_URL'] : 'http://localhost:8000';
  envs['RESTORE_VOLUME_FROM_SNAPSHOT'] = envs['RESTORE_VOLUME_FROM_SNAPSHOT'] ? envs['RESTORE_VOLUME_FROM_SNAPSHOT'] : '1';
  envs['MANUAL_MIGRATIONS'] = envs['MANUAL_MIGRATIONS'] ? envs['MANUAL_MIGRATIONS'] : '0';
  envs['npm_config_yes'] = envs['npm_config_yes'] ? envs['npm_config_yes'] : 'true';
  envs['JWT_SECRET'] = envs['JWT_SECRET'] ? envs['JWT_SECRET'] : `${platform !== "win32" ? "'" : ''}{"type":"HS256","key":"3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R"}${platform !== "win32" ? "'" : ''}`;

  // <hasura>

  envs['DEEP_HASURA_PORT'] = envs['DEEP_HASURA_PORT'] || 8080;

  envs['HASURA_GRAPHQL_DATABASE_URL'] = envs['HASURA_GRAPHQL_DATABASE_URL'] ? envs['HASURA_GRAPHQL_DATABASE_URL'] : `postgres://postgres:${envs['POSTGRES_PASSWORD'] ? envs['POSTGRES_PASSWORD'] : 'postgrespassword'}@host.docker.internal:5432/postgres?sslmode=disable`; // к удалению
  envs['DEEP_HASURA_GRAPHQL_DATABASE_URL'] = envs['HASURA_GRAPHQL_DATABASE_URL']; 
  
  envs['HASURA_GRAPHQL_ENABLE_CONSOLE'] = envs['HASURA_GRAPHQL_ENABLE_CONSOLE'] ? envs['HASURA_GRAPHQL_ENABLE_CONSOLE'] : 'true'; // к удалению
  envs['DEEP_HASURA_GRAPHQL_ENABLE_CONSOLE'] = envs['HASURA_GRAPHQL_ENABLE_CONSOLE']; 

  envs['HASURA_GRAPHQL_DEV_MODE'] = envs['HASURA_GRAPHQL_DEV_MODE'] ? envs['HASURA_GRAPHQL_DEV_MODE'] : 'true'; // к удалению
  envs['DEEP_HASURA_GRAPHQL_DEV_MODE'] = envs['HASURA_GRAPHQL_DEV_MODE']; 
  
  envs['HASURA_GRAPHQL_LOG_LEVEL'] = envs['HASURA_GRAPHQL_LOG_LEVEL'] ? envs['HASURA_GRAPHQL_LOG_LEVEL'] : 'debug'; // к удалению
  envs['DEEP_HASURA_GRAPHQL_LOG_LEVEL'] = envs['HASURA_GRAPHQL_LOG_LEVEL']; 
  
  envs['HASURA_GRAPHQL_ENABLED_LOG_TYPES'] = envs['HASURA_GRAPHQL_ENABLED_LOG_TYPES'] ? envs['HASURA_GRAPHQL_ENABLED_LOG_TYPES'] : 'startup,http-log,webhook-log,websocket-log,query-log'; // к удалению
  envs['DEEP_HASURA_GRAPHQL_ENABLED_LOG_TYPES'] = envs['HASURA_GRAPHQL_ENABLED_LOG_TYPES']; 
  
  envs['HASURA_GRAPHQL_ADMIN_SECRET'] = envs['HASURA_GRAPHQL_ADMIN_SECRET'] ? envs['HASURA_GRAPHQL_ADMIN_SECRET'] : 'myadminsecretkey'; // к удалению
  envs['DEEP_HASURA_GRAPHQL_ADMIN_SECRET'] = envs['HASURA_GRAPHQL_ADMIN_SECRET']; 
  
  envs['HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS'] = envs['HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS'] ? envs['HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS'] : 'true'; // к удалению
  envs['DEEP_HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS'] = envs['HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS']; 
  
  envs['HASURA_GRAPHQL_UNAUTHORIZED_ROLE'] = envs['HASURA_GRAPHQL_UNAUTHORIZED_ROLE'] ? envs['HASURA_GRAPHQL_UNAUTHORIZED_ROLE'] : 'undefined'; // к удалению
  envs['DEEP_HASURA_GRAPHQL_UNAUTHORIZED_ROLE'] = envs['HASURA_GRAPHQL_UNAUTHORIZED_ROLE']; 

  // </hasura>


  // <postgres>

  envs['DEEP_POSTGRES_PORT'] = envs['DEEP_POSTGRES_PORT'] || 5432;

  envs['POSTGRES_USER'] = envs['POSTGRES_USER'] ? envs['POSTGRES_USER'] : 'postgres'; // к удалению
  envs['DEEP_POSTGRES_USER'] = envs['POSTGRES_USER'];
  
  envs['POSTGRES_PASSWORD'] = envs['POSTGRES_PASSWORD'] ? envs['POSTGRES_PASSWORD'] : 'postgrespassword'; // к удалению
  envs['DEEP_POSTGRES_PASSWORD'] = envs['POSTGRES_PASSWORD'];
  
  envs['PGGSSENCMODE'] = envs['PGGSSENCMODE'] ? envs['PGGSSENCMODE'] : 'disable'; // к удалению
  envs['DEEP_POSTGRES_GSS_ENCODING_MODE'] = envs['PGGSSENCMODE'];
  
  envs['PGSSLMODE'] = envs['PGSSLMODE'] ? envs['PGSSLMODE'] : 'disable'; // к удалению
  envs['DEEP_POSTGRES_SSL_MODE'] = envs['PGSSLMODE'];
  
  envs['PGREQUIRESSL'] = envs['PGREQUIRESSL'] ? envs['PGREQUIRESSL'] : '0' ;// к удалению
  envs['DEEP_POSTGRES_REQUIRE_SSL'] = envs['PGREQUIRESSL'];
  
  // </postgres>
  
  
  // <hasura-storage>

  envs['DEEP_HASURA_STORAGE_PORT'] = envs['DEEP_HASURA_STORAGE_PORT'] || 8000;

  envs['DEEP_HASURA_STORAGE_HASURA_GRAPHQL_ADMIN_SECRET'] = envs['DEEP_HASURA_GRAPHQL_ADMIN_SECRET'];
  
  envs['HASURA_STORAGE_DEBUG'] = envs['HASURA_STORAGE_DEBUG'] ? envs['HASURA_STORAGE_DEBUG'] : 'true'; // к удалению
  envs['DEEP_HASURA_STORAGE_DEBUG'] = envs['HASURA_STORAGE_DEBUG'];

  envs['HASURA_METADATA'] = envs['HASURA_METADATA'] ? envs['HASURA_METADATA'] : '1'; // к удалению
  envs['DEEP_HASURA_STORAGE_HASURA_METADATA'] = envs['HASURA_METADATA'];

  envs['HASURA_ENDPOINT'] = envs['HASURA_ENDPOINT'] ? envs['HASURA_ENDPOINT'] : 'http://deep-hasura:8080/v1'; // к удалению
  envs['DEEP_HASURA_STORAGE_HASURA_ENDPOINT'] = envs['HASURA_ENDPOINT'];

  envs['S3_ENDPOINT'] = envs['S3_ENDPOINT'] ? envs['S3_ENDPOINT'] : 'http://deep-minio:9000'; // к удалению
  envs['DEEP_HASURA_STORAGE_S3_ENDPOINT'] = envs['S3_ENDPOINT'];
  
  envs['S3_ACCESS_KEY'] = envs['S3_ACCESS_KEY'] ? envs['S3_ACCESS_KEY'] : 'minioaccesskey'; // к удалению
  envs['DEEP_HASURA_STORAGE_S3_ACCESS_KEY'] = envs['S3_ACCESS_KEY'];
  
  envs['S3_SECRET_KEY'] = envs['S3_SECRET_KEY'] ? envs['S3_SECRET_KEY'] : 'miniosecretkey'; // к удалению
  envs['DEEP_HASURA_STORAGE_S3_SECRET_KEY'] = envs['S3_SECRET_KEY'];
  
  envs['S3_BUCKET'] = envs['S3_BUCKET'] ? envs['S3_BUCKET'] : 'default'; // к удалению
  envs['DEEP_HASURA_STORAGE_S3_BUCKET'] = envs['S3_BUCKET'];
  
  envs['S3_ROOT_FOLDER'] = envs['S3_ROOT_FOLDER'] ? envs['S3_ROOT_FOLDER'] : 'default'; // к удалению
  envs['DEEP_HASURA_STORAGE_S3_ROOT_FOLDER'] = envs['S3_ROOT_FOLDER'];
  
  envs['POSTGRES_MIGRATIONS'] = envs['POSTGRES_MIGRATIONS'] ? envs['POSTGRES_MIGRATIONS'] : '0'; // к удалению
  envs['DEEP_HASURA_STORAGE_POSTGRES_MIGRATIONS'] = envs['POSTGRES_MIGRATIONS'];
  
  envs['POSTGRES_MIGRATIONS_SOURCE'] = envs['POSTGRES_MIGRATIONS_SOURCE'] ? envs['POSTGRES_MIGRATIONS_SOURCE'] : `postgres://postgres:${envs['POSTGRES_PASSWORD'] ? envs['POSTGRES_PASSWORD'] : 'postgrespassword'}@host.docker.internal:5432/postgres?sslmode=disable`; // к удалению
  envs['DEEP_HASURA_STORAGE_POSTGRES_MIGRATIONS_SOURCE'] = envs['POSTGRES_MIGRATIONS_SOURCE'];
  
  // </hasura-storage>


  // <minio>

  envs['DEEP_MINIO_PORT'] = 9000;
  envs['DEEP_MINIO_CONSOLE_PORT'] = 32765;

  envs['MINIO_ROOT_USER'] = envs['MINIO_ROOT_USER'] ? envs['MINIO_ROOT_USER'] : 'minioaccesskey'; // к удалению
  envs['DEEP_MINIO_ROOT_USER'] = envs['MINIO_ROOT_USER'];

  envs['MINIO_ROOT_PASSWORD'] = envs['MINIO_ROOT_PASSWORD'] ? envs['MINIO_ROOT_PASSWORD'] : 'miniosecretkey'; // к удалению
  envs['DEEP_MINIO_ROOT_PASSWORD'] = envs['MINIO_ROOT_PASSWORD'];

  // </minio>


  envs['MIGRATIONS_ID_TYPE_SQL'] = envs['MIGRATIONS_ID_TYPE_SQL'] ? envs['MIGRATIONS_ID_TYPE_SQL'] : 'bigint';
  envs['MIGRATIONS_ID_TYPE_GQL'] = envs['MIGRATIONS_ID_TYPE_GQL'] ? envs['MIGRATIONS_ID_TYPE_GQL'] : 'bigint';
  envs['MIGRATIONS_HASURA_SECRET'] = envs['MIGRATIONS_HASURA_SECRET'] ? envs['MIGRATIONS_HASURA_SECRET'] : 'myadminsecretkey';
  envs['DEEPLINKS_HASURA_SECRET'] = envs['DEEPLINKS_HASURA_SECRET'] ? envs['DEEPLINKS_HASURA_SECRET'] : 'myadminsecretkey';
  envs['MIGRATIONS_SCHEMA'] = envs['MIGRATIONS_SCHEMA'] ? envs['MIGRATIONS_SCHEMA'] : 'public';
  envs['MIGRATIONS_RL_TABLE'] = envs['MIGRATIONS_RL_TABLE'] ? envs['MIGRATIONS_RL_TABLE'] : 'rl_example__links__reserved';
  envs['MIGRATIONS_DATE_TYPE_SQL'] = envs['MIGRATIONS_DATE_TYPE_SQL'] ? envs['MIGRATIONS_DATE_TYPE_SQL'] : 'timestamp';
  envs['RESERVED_LIFETIME_MS'] = envs['RESERVED_LIFETIME_MS'] ? envs['RESERVED_LIFETIME_MS'] : String(24 * 60 * 60 * 1000);
  // DL may be not in docker, when DC in docker, so we use host.docker.internal instead of docker-network link deep_links_1
  envs['DOCKER_DEEPLINKS_URL'] = envs['DOCKER_DEEPLINKS_URL'] ? envs['DOCKER_DEEPLINKS_URL'] : `http://host.docker.internal:${deeplinksPort}`;
  envs['MIGRATIONS_DIR'] = envs['MIGRATIONS_DIR'] ? envs['MIGRATIONS_DIR'] : `${platform == "win32" ? `${os.tmpdir()}\\deep` : '/tmp/deep'}`;
  if (isGitpod) {
    envs['MIGRATIONS_HASURA_PATH'] = envs['MIGRATIONS_HASURA_PATH'] ? envs['MIGRATIONS_HASURA_PATH'] : +DOCKER ? `deep-hasura:${hasuraPort}` : `$(gp url ${hasuraPort})`;
    envs['DEEPLINKS_HASURA_PATH'] = envs['DEEPLINKS_HASURA_PATH'] ? envs['DEEPLINKS_HASURA_PATH'] : isDeeplinksDocker === 0 ? `$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}')` : `deep-hasura:${hasuraPort}`;
    envs['MIGRATIONS_HASURA_SSL'] = envs['MIGRATIONS_HASURA_SSL'] ? envs['MIGRATIONS_HASURA_SSL'] : +DOCKER ? '0' : '1';
    envs['DEEPLINKS_HASURA_SSL'] = envs['DEEPLINKS_HASURA_SSL'] ? envs['DEEPLINKS_HASURA_SSL'] : isDeeplinksDocker === 0 ? '1' : '0';
    envs['NEXT_PUBLIC_GQL_SSL'] = envs['NEXT_PUBLIC_GQL_SSL'] ? envs['NEXT_PUBLIC_GQL_SSL'] : '1';
    envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] = envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] ? envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] : `https://$(echo $(gp url ${deepcasePort}) | awk -F[/:] '{print $4}')`;
    envs['NEXT_PUBLIC_GQL_PATH'] = envs['NEXT_PUBLIC_GQL_PATH'] ? envs['NEXT_PUBLIC_GQL_PATH'] : `$(echo $(gp url ${deeplinksPort}) | awk -F[/:] '{print $4}')/gql`;
    envs['NEXT_PUBLIC_ENGINES'] = envs['NEXT_PUBLIC_ENGINES'] ? envs['NEXT_PUBLIC_ENGINES'] : '1';
  } else {
    envs['MIGRATIONS_HASURA_PATH'] = envs['MIGRATIONS_HASURA_PATH'] ? envs['MIGRATIONS_HASURA_PATH'] : +DOCKER ? `deep-hasura:${hasuraPort}` : `localhost:${hasuraPort}`;
    envs['DEEPLINKS_HASURA_PATH'] = envs['DEEPLINKS_HASURA_PATH'] ? envs['DEEPLINKS_HASURA_PATH'] : isDeeplinksDocker === 0 ? `localhost:${hasuraPort}` : `deep-hasura:${hasuraPort}`;
    envs['MIGRATIONS_HASURA_SSL'] = envs['MIGRATIONS_HASURA_SSL'] ? envs['MIGRATIONS_HASURA_SSL'] : '0';
    envs['DEEPLINKS_HASURA_SSL'] = envs['DEEPLINKS_HASURA_SSL'] ? envs['DEEPLINKS_HASURA_SSL'] : '0';
    envs['NEXT_PUBLIC_GQL_SSL'] = envs['NEXT_PUBLIC_GQL_SSL'] ? envs['NEXT_PUBLIC_GQL_SSL'] : '0';
    envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] = envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] ? envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] : `http://localhost:${deepcasePort}`;
    envs['NEXT_PUBLIC_GQL_PATH'] = envs['NEXT_PUBLIC_GQL_PATH'] ? envs['NEXT_PUBLIC_GQL_PATH'] : `localhost:${deeplinksPort}/gql`;
    envs['MIGRATIONS_DEEPLINKS_URL'] = envs['MIGRATIONS_DEEPLINKS_URL'] ? envs['MIGRATIONS_DEEPLINKS_URL'] : isDeeplinksDocker === 0 ? `http://host.docker.internal:${deeplinksPort}` : `http://deep-links:${deeplinksPort}`;
  }
  return envs;
};

export const _generateAndFillEnvs = ({ envs, isDeeplinksDocker }) => {
  generateEnvs({ envs, isDeeplinksDocker });
  let envsStr = '';
  // const _deepEnvs = {};
  Object.keys(envs).forEach(k => {
    envsStr += handleEnv(k, envs);
    // if (k.indexOf('DEEP_') === 0) _deepEnvs[k] = envs[k];
  });
  // console.log(_deepEnvs);
  return envsStr;
};

let userAddedtoDockerGroup = false;
let userAddingToDockerGroupInProcess = false;
let user;
let homeDir;
let needNPX = false;

export const _checkDeeplinksStatus = async () => {
  let status;
  let err;
  try {
    // DL may be not in docker, when DC in docker, so we use host.docker.internal instead of docker-network link deep_links_1
    status = await axios.get(`${+DOCKER ? 'http://host.docker.internal:3006' : DEEPLINKS_PUBLIC_URL}/api/healthz`, { validateStatus: status => true, timeout: 7000 });
  } catch(e){
    error(e)
    err = e;
  }
  return { result: status?.data?.docker, error: err };
};
// exports._checkDeeplinksStatus = _checkDeeplinksStatus;

export const _checkDeepcaseStatus = async () => {
  let status;
  let err;
  try {
    // DL may be not in docker, when DC in docker, so we use host.docker.internal instead of docker-network link deep_links_1
    status = await axios.get(`${+DOCKER ? 'http://host.docker.internal:3007' : NEXT_PUBLIC_DEEPLINKS_SERVER}/api/healthz`, { validateStatus: status => true, timeout: 7000 });
  } catch(e){
    error(e)
    err = e;
  }
  return { result: status?.data?.docker, error: err };
};
// exports._checkDeepcaseStatus = _checkDeepcaseStatus;

const _generateEngineStr = ({ needNPX, operation, isDeeplinksDocker, isDeepcaseDocker, envs }) => {
  let str;
  if (![ 'init', 'migrate', 'check', 'run', 'sleep', 'reset', 'dock', 'compose' ].includes(operation)) return ' echo "not valid operation"';
  if (operation === 'init') {
    str = ` cd "${path.normalize(`${_deeplinks}/`)}" && docker compose -p deep stop postgres hasura && docker volume create deep-db-data && docker pull deepf/deeplinks:main`;
  }
  if (operation === 'migrate') {
    str = ` cd "${path.normalize(`${_deeplinks}`)}" ${platform === "win32" ? '' : ` && mkdir -p ${envs['MIGRATIONS_DIR']}`} && docker run -v "${envs['MIGRATIONS_DIR']}":/migrations -v deep-db-data:/data --rm --name links --entrypoint "sh" deepf/deeplinks:main -c "cd / && tar xf /backup/volume.tar --strip 1 && cp /backup/.migrate /migrations/.migrate"`;
  }
  if (operation === 'check') {
    str = ` ${ platform === "win32" && needNPX ? 'npm i -g npx &&' : ''} cd "${path.normalize(`${_deeplinks}/`)}" ${isDeeplinksDocker===undefined ? `&& ${ platform === "win32" ? 'set COMPOSE_CONVERT_WINDOWS_PATHS=1&& ' : ''} npm run start-deeplinks-docker && npx -y -q wait-on --timeout 100000 ${+DOCKER ? 'http-get://host.docker.internal:3006'  : DEEPLINKS_PUBLIC_URL}/api/healthz` : ''} && cd "${path.normalize(`${_deeplinks}/`)}" && docker compose -p deep up -d && npx -y -q wait-on --timeout 100000 ${+DOCKER ? `http-get://deep-hasura` : 'http-get://localhost'}:8080/healthz`;
  }
  if (operation === 'run') {
    console.log('isDeepcaseDocker', isDeepcaseDocker);
    const arr = []
    arr.push(`cd "${path.normalize(`${_deeplinks}/`)}"`);
    arr.push(`docker compose pull`);
    arr.push(`docker volume create deep-db-data`);
    if (platform === "win32") arr.push(`mkdir -p ${envs['MIGRATIONS_DIR']}`);
    arr.push(`docker compose -p deep up -d`);
    arr.push(`npx -y -q wait-on --timeout 100000 ${
      +DOCKER ?
      `http-get://deep-hasura` :
      'http-get://localhost'
    }:8080/healthz`);
    // if (+envs['RESTORE_VOLUME_FROM_SNAPSHOT']) arr.push(`docker run -v "${envs['MIGRATIONS_DIR']}":/migrations -v deep-db-data:/data --rm --name links --entrypoint "sh" deepf/deeplinks:main -c "cd / && tar xf /backup/volume.tar --strip 1 && cp /backup/.migrate /migrations/.migrate"`);
    // if (+envs['RESTORE_VOLUME_FROM_SNAPSHOT']) arr.push(`docker run --entrypoint "sh" deepf/deeplinks:main -c "node snapshots/last.js"`);
    // arr.push(`docker compose -p deep up -d`);
    // if (+envs['MANUAL_MIGRATIONS']) arr.push(`npm run migrate -- -f ${envs['MIGRATIONS_DIR']}/.migrate`);
    str = arr.join(' && ');
  }
  if (operation === 'sleep') {
    if (platform === "win32") {
      str = ` powershell -command docker stop $(docker ps -a --filter name=deep- -q --format '{{ $a:= false }}{{ $name:= .Names }}{{ range $splited := (split .Names \`"_\`") }}{{ if eq \`"case\`" $splited }}{{$a = true}}{{ end }}{{end}}{{ if eq $a false }}{{ $name }}{{end}}')`;
    } else {
      str = ` docker stop $(docker ps --filter name=deep- -q --format '{{ $a:= false }}{{ range $splited := (split .Names "_") }}{{ if eq "case" $splited }}{{$a = true}}{{ end }}{{ end }}{{ if eq $a false }}{{.ID}}{{end}}')`;
    }
  }
  if (operation === 'reset') {
    if (platform === "win32") {
      str = ` cd "${_deeplinks}" && ${needNPX ? 'npm i -g npx &&' : ''} npx -y rimraf ${envs['MIGRATIONS_DIR']}/.migrate && powershell -command docker rm -fv $(docker ps -a --filter name=deep- -q --format '{{ $a:= false }}{{ $name:= .Names }}{{ range $splited := (split .Names \`"-\`") }}{{ if eq \`"case\`" $splited }}{{$a = true}}{{ end }}{{end}}{{ if eq $a false }}{{ $name }}{{end}}'); docker volume rm $(docker volume ls -q --filter name=deep-)${ !+DOCKER ? `; docker network rm $(docker network ls -q -f name=deep-) ` : ''};`;
    } else {
      str = ` cd "${_deeplinks}" && npx -y rimraf ${envs['MIGRATIONS_DIR']}/.migrate && (docker rm -fv $(docker ps -a --filter name=deep- -q --format '{{ $a:= false }}{{ range $splited := (split .Names "-") }}{{ if eq "case" $splited }}{{$a = true}}{{ end }}{{ end }}{{ if eq $a false }}{{.ID}}{{end}}') || true) && (docker volume rm $(docker volume ls -q --filter name=deep-) || true)${ !+DOCKER ? ` && (docker network rm $(docker network ls -q -f name=deep-) || true)` : ''}`;
    }
  }
  if (operation === 'dock') {
    str = ` docker version -f ${platform === "win32" ? 'json' : "'{{json .}}'"}`;
  }
  if (operation === 'compose') {
    str = ` docker compose version --short`;
  }
  return str;
}

const _execEngine = async ({ envsStr, envs, engineStr } ) => {
  try {
    const command = `${envsStr} ${engineStr}`;
    console.log(command);
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
      console.error(data.toString());
    });

    bash.on('exit', function (code) {
      console.log('child process exited with code: ' + code.toString());
    });
  } catch(e) {
    error(e);
    return { error: e };
  }
}

const _AddUserToDocker = async (envs, user) => {
  if (userAddingToDockerGroupInProcess) {
    while(userAddingToDockerGroupInProcess) {
      await delay(1000);
    }
  } else {
    if (isElectron()) {
      userAddingToDockerGroupInProcess = true;

      const icns = path.normalize(`${appPath}/resources/assets/appIcon.icns`);
      const options = {
        name: 'Deep Case',
        icns,
        env: envs,
      };
      const execPromise = new Promise((resolve, reject) => {
        sudo.exec(`usermod -aG docker ${user}`, options, (error, stdout, stderr) => {
          if (error) {
            printLog(envs['MIGRATIONS_DIR'], { result: { stdout, stderr }, error }, 'permissions error');
            resolve({ error });
          } else {
            printLog(envs['MIGRATIONS_DIR'], { result: { stdout, stderr } }, 'permissionsResult');
            resolve({ result: { stdout, stderr } });
          }
        });
      });
      const result = await execPromise;
      userAddedtoDockerGroup = !result.error;
      userAddingToDockerGroupInProcess = false;
      return result;
    }
  }
}

const _AddNvmDirToPathEnv = async (envs) => {
  const whoami =  await execP('whoami');
  const home =  await execP('echo $HOME');
  homeDir = home.stdout.trim();
  user = whoami.stdout.trim();

  printLog(envs['MIGRATIONS_DIR'], user, 'whoami');
  printLog(envs['MIGRATIONS_DIR'], homeDir, 'homeDir');

  // let nvmExists;

  // try {
  //   fs.accessSync(`/home/menzorg/.nvm/versions/node`, fs.constants.F_OK);
  //   nvmExists = true;
  // } catch(e){
  //   printLog(envs['MIGRATIONS_DIR'], e?.message, 'nvmError');
  //   nvmExists = false;
  // }

  // printLog(envs['MIGRATIONS_DIR'], nvmExists, 'nvmExists');
  // if (!nvmExists) {
  //   return true;
  // }

  // var fs = require('fs'); var versions = fs.readdirSync(${process.env['HOME']}/.nvm/versions/node); console.log(versions[versions.length-1])

  let versions = [];
  try {
    versions = fs.readdirSync(`${homeDir}/.nvm/versions/node`);
    printLog(envs['MIGRATIONS_DIR'], versions, 'versions');
  } catch(e){
    printLog(envs['MIGRATIONS_DIR'], e.toString(), 'versions error');
  }

  if (!versions?.length) {
    return true;
  }
  const lastVersion = versions.sort()[versions.length -1];
  printLog(envs['MIGRATIONS_DIR'], lastVersion, 'lastVersion');
  const addition = `:${path.normalize(`${homeDir}/.nvm/versions/node/${lastVersion}/bin`)}`;
  printLog(envs['MIGRATIONS_DIR'], addition, 'addition');
  envs['PATH'] = `'${process?.env?.['PATH']}${addition}'`;
  return true;
}

export const call = async (options) => {
  const isDeeplinksDocker = await _checkDeeplinksStatus();
  const isDeepcaseDocker = await _checkDeepcaseStatus();
  const envs = { ...options.envs, DOCKERHOST: String(internalIp?.v4?.sync()) };
  let envsStr = _generateAndFillEnvs({ envs, isDeeplinksDocker: isDeeplinksDocker.result });

  printLog(envs['MIGRATIONS_DIR'], user, `user`);
  printLog(envs['MIGRATIONS_DIR'], envs, `envs`);
  printLog(envs['MIGRATIONS_DIR'], options, `options`);
  printLog(envs['MIGRATIONS_DIR'], isDeeplinksDocker, `isDeeplinksDocker`);
  printLog(envs['MIGRATIONS_DIR'], isDeepcaseDocker, `isDeepcaseDocker`);

  if (platform !== "win32"){
    fixPath();
    if (!envs['PATH']?.includes('nvm')) {
      await _AddNvmDirToPathEnv(envs);
    } else {
      envs['PATH'] = `'${process?.env?.['PATH']}'`;
    }
    // if (!userAddedtoDockerGroup) await _AddUserToDocker(envs, user);
   
  } else {
    envs['PATH'] = process?.env?.['Path'];

    printLog(envs['MIGRATIONS_DIR'], envs['PATH'].includes('nvm'), `envs['PATH'].includes('nvm')`);
    if (envs['PATH'].includes('nvm')) {
      const whereNvm =  (await execP('where nvm'));
      printLog(envs['MIGRATIONS_DIR'], whereNvm, `whereNvm`);      
      if (whereNvm.stderr)
        needNPX = true;
    } else {
      needNPX = true;
    }
    printLog(envs['MIGRATIONS_DIR'], needNPX, `needNPX`);
  }
  printLog(envs['MIGRATIONS_DIR'], envs['PATH'], `PATH`);

  envsStr = _generateAndFillEnvs({ envs, isDeeplinksDocker: isDeeplinksDocker.result });
  const engineStr = _generateEngineStr({ needNPX, operation: options.operation, isDeeplinksDocker: isDeeplinksDocker.result, isDeepcaseDocker: isDeepcaseDocker.result, envs} )
  const engine = await _execEngine({ envsStr, envs, engineStr });
  
  return { ...options, user, homeDir, platform, _hasura, _deeplinks, isDeeplinksDocker, isDeepcaseDocker, envs, engineStr, fullStr: `${envsStr} ${engineStr}`, ...engine };
}
// exports.call = call;
