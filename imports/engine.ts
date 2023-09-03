import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import * as internalIp from 'internal-ip';
import axios from 'axios';
import Debug from 'debug';
import os from 'os';
// @ts-ignore
import fixPath from 'fix-path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { rootPath } from 'root-path-electron';
// import { remote } from 'electron'

const debug = Debug('deeplinks:engine');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
const platform = process?.platform;
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

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
function findParentPackageJson(dir) : string {
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

console.log('__dirname', __dirname);
console.log('rootDir', rootDir);
const appPath = isElectron() ? rootPath : (rootDir || process.cwd());
const filePath = path.normalize(`${appPath}/package.json`);
const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));


const execP = promisify(exec);
const DOCKER = process.env.DOCKER || '0';
const DEEPLINKS_PUBLIC_URL = process.env.DEEPLINKS_PUBLIC_URL || 'http://localhost:3006';
const NEXT_PUBLIC_DEEPLINKS_SERVER = process.env.NEXT_PUBLIC_DEEPLINKS_SERVER || 'http://localhost:3007';
export interface ICallOptions {
  operation: 'run' | 'sleep' | 'reset';
  envs: { [key: string]: string; };
}

interface ICheckDeeplinksStatusReturn {
  result?: 1 | 0 | undefined;
  error?: any;
}
interface IExecEngineReturn {
  result?: {
    stdout: string;
    stderr: string;
  };
  error?: any;
}
interface ICheckPermissionReturn {
  result?: {
    stdout: string;
    stderr: string;
  };
  error?: any;
}

interface IGenerateEngineStrOptions {
  operation: string;
  isDeeplinksDocker: 0 | 1 | undefined;
  isDeepcaseDocker: 0 | 1 | undefined;
  envs: any;
  needNPX: boolean;
}
interface IGenerateEnvsOptions {
  isDeeplinksDocker: 0 | 1 | undefined;
  envs: any;
}

const _hasura = path.normalize(`${packageJson.name === '@deep-foundation/deeplinks' ? (rootDir || process.cwd()) : appPath}/node_modules/@deep-foundation/hasura`); // даже если мы не в дипкейсе, то это скрипт из диплинкса, который зависит от хасуры, а значит в модулях есть хасура.
const _deeplinks = path.normalize( packageJson.name === '@deep-foundation/deeplinks' ? (rootDir || process.cwd()) : `${appPath}/node_modules/@deep-foundation/deeplinks`); // если в package.json название пакета не диплинксовое - то мы не там, а значит идём в модули

const handleEnvWindows = (k, envs) => ` set ${k}=${envs[k]}&&`;
const handleEnvUnix = (k, envs) => ` export ${k}=${envs[k]} &&`;
const handleEnv = platform === "win32" ? handleEnvWindows : handleEnvUnix;

const _generateAndFillEnvs = ({ envs, isDeeplinksDocker }: IGenerateEnvsOptions): string => {
  let envsStr = '';
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
  envs['HASURA_GRAPHQL_DATABASE_URL'] = envs['HASURA_GRAPHQL_DATABASE_URL'] ? envs['HASURA_GRAPHQL_DATABASE_URL'] : 'postgres://postgres:postgrespassword@postgres:5432/postgres';
  envs['HASURA_GRAPHQL_ENABLE_CONSOLE'] = envs['HASURA_GRAPHQL_ENABLE_CONSOLE'] ? envs['HASURA_GRAPHQL_ENABLE_CONSOLE'] : 'true';
  envs['HASURA_GRAPHQL_DEV_MODE'] = envs['HASURA_GRAPHQL_DEV_MODE'] ? envs['HASURA_GRAPHQL_DEV_MODE'] : 'true';
  envs['HASURA_GRAPHQL_LOG_LEVEL'] = envs['HASURA_GRAPHQL_LOG_LEVEL'] ? envs['HASURA_GRAPHQL_LOG_LEVEL'] : 'debug';
  envs['HASURA_GRAPHQL_ENABLED_LOG_TYPES'] = envs['HASURA_GRAPHQL_ENABLED_LOG_TYPES'] ? envs['HASURA_GRAPHQL_ENABLED_LOG_TYPES'] : 'startup,http-log,webhook-log,websocket-log,query-log';
  envs['HASURA_GRAPHQL_ADMIN_SECRET'] = envs['HASURA_GRAPHQL_ADMIN_SECRET'] ? envs['HASURA_GRAPHQL_ADMIN_SECRET'] : 'myadminsecretkey';
  envs['HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS'] = envs['HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS'] ? envs['HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS'] : 'true';
  envs['HASURA_GRAPHQL_UNAUTHORIZED_ROLE'] = envs['HASURA_GRAPHQL_UNAUTHORIZED_ROLE'] ? envs['HASURA_GRAPHQL_UNAUTHORIZED_ROLE'] : 'undefined';
  envs['POSTGRES_USER'] = envs['POSTGRES_USER'] ? envs['POSTGRES_USER'] : 'postgres';
  envs['POSTGRES_PASSWORD'] = envs['POSTGRES_PASSWORD'] ? envs['POSTGRES_PASSWORD'] : 'postgrespassword';
  envs['PGGSSENCMODE'] = envs['PGGSSENCMODE'] ? envs['PGGSSENCMODE'] : 'disable';
  envs['PGSSLMODE'] = envs['PGSSLMODE'] ? envs['PGSSLMODE'] : 'disable';
  envs['PGREQUIRESSL'] = envs['PGREQUIRESSL'] ? envs['PGREQUIRESSL'] : '0';
  envs['MINIO_ROOT_USER'] = envs['MINIO_ROOT_USER'] ? envs['MINIO_ROOT_USER'] : 'minioaccesskey';
  envs['MINIO_ROOT_PASSWORD'] = envs['MINIO_ROOT_PASSWORD'] ? envs['MINIO_ROOT_PASSWORD'] : 'miniosecretkey';
  envs['HASURA_STORAGE_DEBUG'] = envs['HASURA_STORAGE_DEBUG'] ? envs['HASURA_STORAGE_DEBUG'] : 'true';
  envs['HASURA_METADATA'] = envs['HASURA_METADATA'] ? envs['HASURA_METADATA'] : '1';
  envs['HASURA_ENDPOINT'] = envs['HASURA_ENDPOINT'] ? envs['HASURA_ENDPOINT'] : 'http://host.docker.internal:8080/v1';
  envs['S3_ENDPOINT'] = envs['S3_ENDPOINT'] ? envs['S3_ENDPOINT'] : 'http://host.docker.internal:9000';
  envs['S3_ACCESS_KEY'] = envs['S3_ACCESS_KEY'] ? envs['S3_ACCESS_KEY'] : 'minioaccesskey';
  envs['S3_SECRET_KEY'] = envs['S3_SECRET_KEY'] ? envs['S3_SECRET_KEY'] : 'miniosecretkey';
  envs['S3_BUCKET'] = envs['S3_BUCKET'] ? envs['S3_BUCKET'] : 'default';
  envs['S3_ROOT_FOLDER'] = envs['S3_ROOT_FOLDER'] ? envs['S3_ROOT_FOLDER'] : 'default';
  envs['POSTGRES_MIGRATIONS'] = envs['POSTGRES_MIGRATIONS'] ? envs['POSTGRES_MIGRATIONS'] : '0';
  envs['POSTGRES_MIGRATIONS_SOURCE'] = envs['POSTGRES_MIGRATIONS_SOURCE'] ? envs['POSTGRES_MIGRATIONS_SOURCE'] : 'postgres://postgres:postgrespassword@host.docker.internal:5432/postgres?sslmode=disable';
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
  Object.keys(envs).forEach(k => envsStr += handleEnv(k, envs));
  return envsStr;
};

let userAddedtoDockerGroup = false;
let userAddingToDockerGroupInProcess = false;
let user;
let homeDir;
let needNPX = false;

export const _checkDeeplinksStatus = async (): Promise<ICheckDeeplinksStatusReturn> => {
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


export const _checkDeepcaseStatus = async (): Promise<ICheckDeeplinksStatusReturn> => {
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

const _generateEngineStr = ({ needNPX, operation, isDeeplinksDocker, isDeepcaseDocker, envs }: IGenerateEngineStrOptions): string => {
  let str;
  if (![ 'init', 'migrate', 'check', 'run', 'sleep', 'reset', 'dock', 'compose' ].includes(operation)) return ' echo "not valid operation"';
  if (operation === 'init') {
    str = ` cd "${path.normalize(`${_hasura}/local/`)}" && docker-compose -p deep stop postgres hasura && docker volume create deep-db-data && docker pull deepf/deeplinks:main`;
  }
  if (operation === 'migrate') {
    str = ` cd "${path.normalize(`${_hasura}/local/`)}" ${platform === "win32" ? '' : ` && mkdir -p ${envs['MIGRATIONS_DIR']}`} && docker run -v "${envs['MIGRATIONS_DIR']}":/migrations -v deep-db-data:/data --rm --name links --entrypoint "sh" deepf/deeplinks:main -c "cd / && tar xf /backup/volume.tar --strip 1 && cp /backup/.migrate /migrations/.migrate"`;
  }
  if (operation === 'check') {
    str = ` ${ platform === "win32" && needNPX ? 'npm i -g npx &&' : ''} cd "${_deeplinks}" ${isDeeplinksDocker===undefined ? `&& ${ platform === "win32" ? 'set COMPOSE_CONVERT_WINDOWS_PATHS=1&& ' : ''} npm run start-deeplinks-docker && npx -q wait-on --timeout 100000 ${+DOCKER ? 'http-get://host.docker.internal:3006'  : DEEPLINKS_PUBLIC_URL}/api/healthz` : ''} && cd "${path.normalize(`${_hasura}/local/`)}" && npm run docker-local && npx -q wait-on --timeout 100000 ${+DOCKER ? `http-get://deep-hasura` : 'http-get://localhost'}:8080/healthz`;
  }
  if (operation === 'run') {
    str = ` cd "${path.normalize(`${_hasura}/local/`)}" && docker-compose -p deep stop postgres hasura && docker volume create deep-db-data ${platform === "win32" ? '' : `&& mkdir -p ${envs['MIGRATIONS_DIR']}`} && docker pull deepf/deeplinks:main && ${+envs['RESTORE_VOLUME_FROM_SNAPSHOT'] ? `docker run -v "${envs['MIGRATIONS_DIR']}":/migrations -v deep-db-data:/data --rm --name links --entrypoint "sh" deepf/deeplinks:main -c "cd / && tar xf /backup/volume.tar --strip 1 && cp /backup/.migrate /migrations/.migrate" && ` : '' } cd "${_deeplinks}" ${isDeeplinksDocker===undefined ? `&& ${ platform === "win32" ? 'set COMPOSE_CONVERT_WINDOWS_PATHS=1&& ' : ''} npm run start-deeplinks-docker && npx -q wait-on --timeout 10000 ${+DOCKER ? 'http-get://host.docker.internal:3006'  : DEEPLINKS_PUBLIC_URL}/api/healthz` : ''} && cd "${path.normalize(`${_hasura}/local/`)}" && npm run docker-local && npx -q wait-on --timeout 100000 ${+DOCKER ? `http-get://deep-hasura` : 'http-get://localhost'}:8080/healthz && ( cd ${_deeplinks}/local/deepcase ${ isDeepcaseDocker === undefined ? '&& docker-compose pull && docker-compose -p deep up -d' : '' } ) ${+envs['MANUAL_MIGRATIONS'] ? `&& ( cd "${_deeplinks}" && npm run migrate -- -f ${envs['MIGRATIONS_DIR']}/.migrate )` : ''}`;
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
      str = ` ${needNPX ? 'npm i -g npx &&' : ''} npx rimraf ${envs['MIGRATIONS_DIR']}/.migrate && powershell -command docker rm -fv $(docker ps -a --filter name=deep- -q --format '{{ $a:= false }}{{ $name:= .Names }}{{ range $splited := (split .Names \`"-\`") }}{{ if eq \`"case\`" $splited }}{{$a = true}}{{ end }}{{end}}{{ if eq $a false }}{{ $name }}{{end}}'); docker volume rm $(docker volume ls -q --filter name=deep-)${ !+DOCKER ? `; docker network rm $(docker network ls -q -f name=deep-) ` : ''};`;
    } else {
      str = ` npx rimraf ${envs['MIGRATIONS_DIR']}/.migrate && (docker rm -fv $(docker ps -a --filter name=deep- -q --format '{{ $a:= false }}{{ range $splited := (split .Names "-") }}{{ if eq "case" $splited }}{{$a = true}}{{ end }}{{ end }}{{ if eq $a false }}{{.ID}}{{end}}') || true) && (docker volume rm $(docker volume ls -q --filter name=deep-) || true)${ !+DOCKER ? ` && (docker network rm $(docker network ls -q -f name=deep-) || true)` : ''}`;
    }
  }
  if (operation === 'dock') {
    str = ` docker version -f ${platform === "win32" ? 'json' : "'{{json .}}'"}`;
  }
  if (operation === 'compose') {
    str = ` docker-compose version --short`;
  }
  return str;
}

const _execEngine = async ({ envsStr, envs, engineStr }: { envsStr: string; envs:any; engineStr: string; } ): Promise<IExecEngineReturn> => {
  try {
    const command = `${envsStr} ${engineStr}`;
    console.log(command);
    const { stdout, stderr } = await execP(command);
    return { result: { stdout, stderr } };
  } catch(e) {
    error(e);
    return { error: e };
  }
}

const _AddNvmDirToPathEnv = async (envs: any): Promise<boolean> => {
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

export async function call (options: ICallOptions) {
  
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

  printLog(envs['MIGRATIONS_DIR'], engineStr, `engineStr`);
  printLog(envs['MIGRATIONS_DIR'], engine, `engine`);
  
  return { ...options, user, homeDir, platform, _hasura, _deeplinks, isDeeplinksDocker, isDeepcaseDocker, envs, engineStr, fullStr: `${envsStr} ${engineStr}`, ...engine };
}
