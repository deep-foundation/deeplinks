import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
// import {internalIpV4} from 'internal-ip';
import axios from 'axios';
import Debug from 'debug';
// @ts-ignore
import * as fixPath from 'fix-path';

let internalIpV4;
import('internal-ip').then((internalIp) => {
  internalIpV4 = internalIp.internalIpV4;
});

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

const debug = Debug('deeplinks:engine');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
const platform = process?.platform;
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

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

interface IGenerateEngineStrOptions {
  operation: string;
  isDeeplinksDocker: 0 | 1 | undefined;
  isDeepcaseDocker: 0 | 1 | undefined;
  envs: any;
}
interface IGenerateEnvsOptions {
  isDeeplinksDocker: 0 | 1 | undefined;
  envs: any;
}

const _hasura = path.normalize(`${__dirname}/../node_modules/@deep-foundation/hasura`);
const _deeplinks = path.normalize(`${__dirname}/../`);

const handleEnvWindows = (k, envs) => ` set ${k}=${envs[k]}&&`;
const handleEnvUnix = (k, envs) => ` export ${k}=${envs[k]} &&`;
const handleEnv = platform === "win32" ? handleEnvWindows : handleEnvUnix;

const _generateEnvs = ({ envs, isDeeplinksDocker }: IGenerateEnvsOptions): string => {
  let envsStr = '';
  const isGitpod = !!process.env['GITPOD_GIT_USER_EMAIL'] && !!process.env['GITPOD_TASKS'];
  const hasuraPort = 8080;
  const deeplinksPort = 3006;
  const deepcasePort = 3007;

  envs['DEEPLINKS_PORT'] = envs['DEEPLINKS_PORT'] ? envs['DEEPLINKS_PORT'] : deeplinksPort;
  envs['DEEPCASE_PORT'] = envs['DEEPCASE_PORT'] ? envs['DEEPCASE_PORT'] : deepcasePort;
  envs['DEEPLINKS_PUBLIC_URL'] = envs['DEEPLINKS_PUBLIC_URL'] ? envs['DEEPLINKS_PUBLIC_URL'] : DEEPLINKS_PUBLIC_URL;
  envs['DEEPLINKS_HASURA_STORAGE_URL'] = envs['DEEPLINKS_HASURA_STORAGE_URL'] ? envs['DEEPLINKS_HASURA_STORAGE_URL'] : 'http://localhost:8000';
  envs['npm_config_yes'] = envs['npm_config_yes'] ? envs['npm_config_yes'] : 'true';
  envs['JWT_SECRET'] = envs['JWT_SECRET'] ? envs['JWT_SECRET'] : `${platform !== "win32" ? "'" : ''}{"type":"HS256","key":"3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R"}${platform !== "win32" ? "'" : ''}`;
  envs['MIGRATIONS_ID_TYPE_SQL'] = envs['MIGRATIONS_ID_TYPE_SQL'] ? envs['MIGRATIONS_ID_TYPE_SQL'] : 'bigint';
  envs['MIGRATIONS_ID_TYPE_GQL'] = envs['MIGRATIONS_ID_TYPE_GQL'] ? envs['MIGRATIONS_ID_TYPE_GQL'] : 'bigint';
  envs['MIGRATIONS_HASURA_SECRET'] = envs['MIGRATIONS_HASURA_SECRET'] ? envs['MIGRATIONS_HASURA_SECRET'] : 'myadminsecretkey';
  envs['DEEPLINKS_HASURA_SECRET'] = envs['DEEPLINKS_HASURA_SECRET'] ? envs['DEEPLINKS_HASURA_SECRET'] : 'myadminsecretkey';
  envs['MIGRATIONS_SCHEMA'] = envs['MIGRATIONS_SCHEMA'] ? envs['MIGRATIONS_SCHEMA'] : 'public';
  envs['MIGRATIONS_RL_TABLE'] = envs['MIGRATIONS_RL_TABLE'] ? envs['MIGRATIONS_RL_TABLE'] : 'rl_example__links__reserved';
  envs['MIGRATIONS_DATE_TYPE_SQL'] = envs['MIGRATIONS_DATE_TYPE_SQL'] ? envs['MIGRATIONS_DATE_TYPE_SQL'] : 'timestamp';
  envs['RESERVED_LIFETIME_MS'] = envs['RESERVED_LIFETIME_MS'] ? envs['RESERVED_LIFETIME_MS'] : 24 * 60 * 60 * 1000;
  // DL may be not in docker, when DC in docker, so we use host.docker.internal instead of docker-network link deep_links_1
  envs['DOCKER_DEEPLINKS_URL'] = envs['DOCKER_DEEPLINKS_URL'] ? envs['DOCKER_DEEPLINKS_URL'] : `http://host.docker.internal:${deeplinksPort}`;
  envs['MIGRATIONS_DIR'] = envs['MIGRATIONS_DIR'] ? envs['MIGRATIONS_DIR'] : `${platform == "win32" ? '' : '/tmp/'}.migrate`;
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

const _generateEngineStr = ({ operation, isDeeplinksDocker, isDeepcaseDocker, envs }: IGenerateEngineStrOptions): string => {
  let str;
  if (![ 'init', 'migrate', 'check', 'run', 'sleep', 'reset', 'dock', 'compose' ].includes(operation)) return ' echo "not valid operation"';
  if (operation === 'init') {
    str = ` cd "${path.normalize(`${_hasura}/local/`)}" && docker-compose -p deep stop postgres hasura && docker volume create deep-db-data && docker pull deepf/deeplinks:main`;
  }
  if (operation === 'migrate') {
    str = ` cd "${path.normalize(`${_hasura}/local/`)}" && docker run -v ${platform === "win32" ? _deeplinks : '/tmp'}:/migrations -v deep-db-data:/data --rm --name links --entrypoint "sh" deepf/deeplinks:main -c "cd / && tar xf /backup/volume.tar --strip 1 && cp /backup/.migrate /migrations/.migrate"`;
  }
  if (operation === 'check') {
    str = ` cd "${path.normalize(`${_hasura}/local/`)}"  && npm run docker && npx -q wait-on --timeout 10000 ${+DOCKER ? `http-get://deep-hasura` : 'tcp'}:8080 && cd "${_deeplinks}" ${isDeeplinksDocker===undefined ? `&& ${ platform === "win32" ? 'set COMPOSE_CONVERT_WINDOWS_PATHS=1&& ' : ''} npm run start-deeplinks-docker && npx -q wait-on --timeout 10000 ${+DOCKER ? 'http-get://host.docker.internal:3006'  : DEEPLINKS_PUBLIC_URL}/api/healthz` : ''} && npm run migrate -- -f ${envs['MIGRATIONS_DIR']}`;
  }
  if (operation === 'run') {
    str = ` cd "${path.normalize(`${_hasura}/local/`)}" && docker-compose -p deep stop postgres hasura && docker volume create deep-db-data && docker pull deepf/deeplinks:main && docker run -v ${platform === "win32" ? _deeplinks : '/tmp'}:/migrations -v deep-db-data:/data --rm --name links --entrypoint "sh" deepf/deeplinks:main -c "cd / && tar xf /backup/volume.tar --strip 1 && cp /backup/.migrate /migrations/.migrate" && npm run docker && npx -q wait-on --timeout 10000 ${+DOCKER ? `http-get://deep-hasura` : 'tcp'}:8080 && cd "${_deeplinks}" ${isDeeplinksDocker===undefined ? `&& ${ platform === "win32" ? 'set COMPOSE_CONVERT_WINDOWS_PATHS=1&& ' : ''} npm run start-deeplinks-docker && npx -q wait-on --timeout 10000 ${+DOCKER ? 'http-get://host.docker.internal:3006'  : DEEPLINKS_PUBLIC_URL}/api/healthz` : ''} && ( cd ${_deeplinks}/local/deepcase ${ isDeepcaseDocker === undefined ? '&& docker-compose pull && docker-compose -p deep up -d' : '' } ) && npm run migrate -- -f ${envs['MIGRATIONS_DIR']}`;
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
      str = ` cd "${_deeplinks}" && npx rimraf ${envs['MIGRATIONS_DIR']} && powershell -command docker rm -fv $(docker ps -a --filter name=deep- -q --format '{{ $a:= false }}{{ $name:= .Names }}{{ range $splited := (split .Names \`"-\`") }}{{ if eq \`"case\`" $splited }}{{$a = true}}{{ end }}{{end}}{{ if eq $a false }}{{ $name }}{{end}}'); docker volume rm $(docker volume ls -q --filter name=deep-)${ !+DOCKER ? `; docker network rm $(docker network ls -q -f name=deep-) ` : ''};`;
    } else {
      str = ` cd "${_deeplinks}" && npx rimraf ${envs['MIGRATIONS_DIR']} && (docker rm -fv $(docker ps -a --filter name=deep- -q --format '{{ $a:= false }}{{ range $splited := (split .Names "-") }}{{ if eq "case" $splited }}{{$a = true}}{{ end }}{{ end }}{{ if eq $a false }}{{.ID}}{{end}}') || true) && (docker volume rm $(docker volume ls -q --filter name=deep-) || true)${ !+DOCKER ? ` && (docker network rm $(docker network ls -q -f name=deep-) || true)` : ''}`;
    }
  }
  if (operation === 'dock') {
    str = ` docker version -f '{{json .}}'`;
  }
  if (operation === 'compose') {
    str = ` docker-compose version --short`;
  }
  return str;
}

const _execEngine = async ({ envsStr, engineStr }: { envsStr: string; engineStr: string; } ): Promise<IExecEngineReturn> => {
  try {
    const command = `${envsStr} ${engineStr}`;
    console.log(command);
    const { stdout, stderr } = await execP(command);
    return { result: { stdout, stderr } }
  } catch(e) {
    error(e);
    return { error: e };
  }
}

export async function call (options: ICallOptions) {

  const envs = { ...options.envs, DOCKERHOST: await internalIpV4() };
  if (platform !== "win32"){
    fixPath();
    envs['PATH'] = `'${process?.env?.['PATH']}'`;
  } else {
    envs['PATH'] = process?.env?.['Path'];
  }
  log({options});
  const isDeeplinksDocker = await _checkDeeplinksStatus();
  const isDeepcaseDocker = await _checkDeepcaseStatus();
  log({isDeeplinksDocker});

  const envsStr = _generateEnvs({ envs, isDeeplinksDocker: isDeeplinksDocker.result });
  log({envs});
  const engineStr = _generateEngineStr({ operation: options.operation, isDeeplinksDocker: isDeeplinksDocker.result, isDeepcaseDocker: isDeepcaseDocker.result, envs} )
  log({engineStr});
  const engine = await _execEngine({ envsStr, engineStr }) ;
  log({engine});

  return { ...options, platform, isDeeplinksDocker, envs, engineStr, fullStr: `${envsStr} ${engineStr}`, ...engine };
}