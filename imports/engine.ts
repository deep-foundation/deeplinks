import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import internalIp from 'internal-ip';
import axios from 'axios';
import Debug from 'debug';

const debug = Debug('deeplinks:engine');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const execP = promisify(exec);
const DOCKER = process.env.DOCKER || '0';
const DEEPLINKS_PUBLIC_URL = process.env.DEEPLINKS_PUBLIC_URL || 'http://localhost:3006';
export interface IOptions {
  operation: 'run' | 'sleep' | 'reset';
  envs: { [key: string]: string; };
}

const _hasura = path.normalize(`${__dirname}/../../hasura`);
const _deepcase = path.normalize(`${__dirname}/../../deepcase`);
const _deeplinks = path.normalize(`${__dirname}/../`);

const handleEnvWindows = (k, envs) => ` set ${k}=${envs[k]} &&`;
const handleEnvUnix = (k, envs) => ` export ${k}=${envs[k]} &&`;
const handleEnv = process.platform === "win32" ? handleEnvWindows : handleEnvUnix;

const generateEnvs = (options) => {
  const { envs, idDeeplinksDocker } = options;
  let envsStr = '';
  const isGitpod = !!process.env['GITPOD_GIT_USER_EMAIL'] && !!process.env['GITPOD_TASKS'];
  const hasuraPort = 8080;
  const deeplinksPort = 3006;
  const deepcasePort = 3007;

  envs['npm_config_yes'] = envs['npm_config_yes'] ? envs['npm_config_yes'] : 'true';
  envs['NEXT_PUBLIC_HIDEPATH'] = envs['NEXT_PUBLIC_HIDEPATH'] ? envs['NEXT_PUBLIC_HIDEPATH'] : '1';
  envs['JWT_SECRET'] = envs['JWT_SECRET'] ? envs['JWT_SECRET'] : `'{"type":"HS256","key":"3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R"}'`;
  envs['MIGRATIONS_ID_TYPE_SQL'] = envs['MIGRATIONS_ID_TYPE_SQL'] ? envs['MIGRATIONS_ID_TYPE_SQL'] : 'bigint';
  envs['MIGRATIONS_ID_TYPE_GQL'] = envs['MIGRATIONS_ID_TYPE_GQL'] ? envs['MIGRATIONS_ID_TYPE_GQL'] : 'bigint';
  envs['MIGRATIONS_HASURA_SECRET'] = envs['MIGRATIONS_HASURA_SECRET'] ? envs['MIGRATIONS_HASURA_SECRET'] : 'myadminsecretkey';
  envs['DEEPLINKS_HASURA_SECRET'] = envs['DEEPLINKS_HASURA_SECRET'] ? envs['DEEPLINKS_HASURA_SECRET'] : 'myadminsecretkey';
  envs['DOCKER_DEEPLINKS_URL'] = envs['DOCKER_DEEPLINKS_URL'] ? envs['DOCKER_DEEPLINKS_URL'] : `http://host.docker.internal:${deeplinksPort}`;
  envs['MIGRATIONS_DIR'] = envs['MIGRATIONS_DIR'] ? envs['MIGRATIONS_DIR'] : process.platform === "win32" ? '.migrate' : '/tmp/.deep-migrate';
  if (isGitpod) {
    envs['MIGRATIONS_HASURA_PATH'] = envs['MIGRATIONS_HASURA_PATH'] ? envs['MIGRATIONS_HASURA_PATH'] : +DOCKER ? `host.docker.internal:${hasuraPort}` : `$(gp url ${hasuraPort})`;
    envs['DEEPLINKS_HASURA_PATH'] = envs['DEEPLINKS_HASURA_PATH'] ? envs['DEEPLINKS_HASURA_PATH'] : idDeeplinksDocker === 0 ? `$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}')` : `host.docker.internal:${hasuraPort}`;
    envs['MIGRATIONS_HASURA_SSL'] = envs['MIGRATIONS_HASURA_SSL'] ? envs['MIGRATIONS_HASURA_SSL'] : +DOCKER ? '0' : '1';
    envs['DEEPLINKS_HASURA_SSL'] = envs['DEEPLINKS_HASURA_SSL'] ? envs['DEEPLINKS_HASURA_SSL'] : idDeeplinksDocker === 0 ? '1' : '0';
    envs['NEXT_PUBLIC_HASURA_SSL'] = envs['NEXT_PUBLIC_HASURA_SSL'] ? envs['NEXT_PUBLIC_HASURA_SSL'] : '1';
    envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] = envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] ? envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] : `https://$(echo $(gp url ${deepcasePort}) | awk -F[/:] '{print $4}')`;
    envs['NEXT_PUBLIC_HASURA_PATH'] = envs['NEXT_PUBLIC_HASURA_PATH'] ? envs['NEXT_PUBLIC_HASURA_PATH'] : `$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}')`;
    envs['NEXT_PUBLIC_DEEPLINKS_URL'] = envs['NEXT_PUBLIC_DEEPLINKS_URL'] ? envs['NEXT_PUBLIC_DEEPLINKS_URL'] : `$(gp url ${deeplinksPort})`;
    envs['NEXT_PUBLIC_ENGINES'] = envs['NEXT_PUBLIC_ENGINES'] ? envs['NEXT_PUBLIC_ENGINES'] : '1';
  } else {
    envs['MIGRATIONS_HASURA_PATH'] = envs['MIGRATIONS_HASURA_PATH'] ? envs['MIGRATIONS_HASURA_PATH'] : +DOCKER ? `host.docker.internal:${hasuraPort}` : `localhost:${hasuraPort}`;
    envs['DEEPLINKS_HASURA_PATH'] = envs['DEEPLINKS_HASURA_PATH'] ? envs['DEEPLINKS_HASURA_PATH'] : idDeeplinksDocker === 0 ? `localhost:${hasuraPort}` : `host.docker.internal:${hasuraPort}`;
    envs['MIGRATIONS_HASURA_SSL'] = envs['MIGRATIONS_HASURA_SSL'] ? envs['MIGRATIONS_HASURA_SSL'] : '0';
    envs['DEEPLINKS_HASURA_SSL'] = envs['DEEPLINKS_HASURA_SSL'] ? envs['DEEPLINKS_HASURA_SSL'] : '0';
    envs['NEXT_PUBLIC_HASURA_SSL'] = envs['NEXT_PUBLIC_HASURA_SSL'] ? envs['NEXT_PUBLIC_HASURA_SSL'] : '0';
    envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] = envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] ? envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] : `http://localhost:${deepcasePort}`;
    envs['NEXT_PUBLIC_HASURA_PATH'] = envs['NEXT_PUBLIC_HASURA_PATH'] ? envs['NEXT_PUBLIC_HASURA_PATH'] : `localhost:${hasuraPort}`;
    envs['MIGRATIONS_DEEPLINKS_URL'] = envs['MIGRATIONS_DEEPLINKS_URL'] ? envs['MIGRATIONS_DEEPLINKS_URL'] : `http://host.docker.internal:${deeplinksPort}`;
    envs['NEXT_PUBLIC_DEEPLINKS_URL'] = envs['NEXT_PUBLIC_DEEPLINKS_URL'] ? envs['NEXT_PUBLIC_DEEPLINKS_URL'] : `http://localhost:${deeplinksPort}`;
  }
  Object.keys(envs).forEach(k => envsStr += handleEnv(k, envs));
  return envsStr;
};

const checkStatus = async () => {
  let result;
  try {
    result = await axios.get(`${+DOCKER ? 'http://host.docker.internal:3006' : DEEPLINKS_PUBLIC_URL}/api/healthz`, { validateStatus: status => true });
  } catch (e){
    error(e)
  }
  return result?.data?.docker;
};

export async function call (options: IOptions) {
  const envs = { ...options.envs, DOCKERHOST: await internalIp.v4() };
  const idDeeplinksDocker = await checkStatus();
  let envsStr = generateEnvs({ envs, idDeeplinksDocker});
  let str;
  let composeVersion;

  const getCompose = async (operation) => {
    if (operation == 'run') return;
    const { stdout } = await execP('docker-compose version --short');
    return stdout.match(/\d+/)[0];
  };

  const execEngine = async (operation, composeVersion, idDeeplinksDocker, envsStr) => {
    if (operation === 'run') {
      str = `cd ${path.normalize(`${_hasura}/local/`)} && npm run docker && npx -q wait-on --timeout 10000 ${+DOCKER ? 'http-get://host.docker.internal' : 'tcp'}:8080 && cd ${_deeplinks} ${idDeeplinksDocker===undefined ? `&& ${ process.platform === "win32" ? 'set COMPOSE_CONVERT_WINDOWS_PATHS 1 &&' : ''} npm run start-deeplinks-docker && npx -q wait-on --timeout 10000 ${+DOCKER ? 'http-get://host.docker.internal:3006'  : DEEPLINKS_PUBLIC_URL}/api/healthz --timeout 10000` : ''} && npm run migrate -- -f $MIGRATIONS_DIR`;
    }
    if (operation === 'sleep') {
      if (process.platform === "win32") {
        str = `powershell -command docker stop $(docker ps -a --filter name=deep_ -q --format '{{ $a:= false }}{{ $name:= .Names }}{{ range $splited := (split .Names \`"_\`") }}{{ if eq \`"case\`" $splited }}{{$a = true}}{{ end }}{{end}}{{ if eq $a false }}{{ $name }}{{end}}')`;
      } else {
        str = `docker stop $(docker ps --filter name=deep_ -q --format '{{ $a:= false }}{{ range $splited := (split .Names "_") }}{{ if eq "case" $splited }}{{$a = true}}{{ end }}{{ end }}{{ if eq $a false }}{{.ID}}{{end}}')`;
      }
    }
    if (operation === 'reset') {
      if (process.platform === "win32") {
        str = `powershell -command (docker rm -fv $(docker ps -a --filter name=deep${composeVersion == '1' ? '_' : '-'} -q --format '{{ $a:= false }}{{ $name:= .Names }}{{ range $splited := (split .Names \`"_\`") }}{{ if eq \`"case\`" $splited }}{{$a = true}}{{ end }}{{end}}{{ if eq $a false }}{{ $name }}{{end}}') || true); docker volume rm $(docker volume ls -q --filter name=deep_)${ !+DOCKER ? '; docker network rm $(docker network ls -q -f name=deep_) ' : ''}; npx rimraf ${envs['MIGRATIONS_DIR']}`;
      } else {
        str = `(docker rm -fv $(docker ps -a --filter name=deep_ -q --format '{{ $a:= false }}{{ range $splited := (split .Names "_") }}{{ if eq "case" $splited }}{{$a = true}}{{ end }}{{ end }}{{ if eq $a false }}{{.ID}}{{end}}') || true) && (docker volume rm $(docker volume ls -q --filter name=deep_) || true)${ !+DOCKER ? ' && (docker network rm $(docker network ls -q -f name=deep_) || true)' : ''} && npx rimraf ${envs['MIGRATIONS_DIR']}`;
      }
    }
    const { stdout, stderr } = await execP(`${envsStr} ${str}`);
    return { stdout, stderr }
  }
  try {
    const composeVersion = await getCompose(options.operation);
    const engine = await execEngine(options.operation, composeVersion, idDeeplinksDocker, envsStr) ;
    return { ...options, composeVersion, envs, str, fullStr: `${envsStr} ${str}`, stdout: engine.stdout, stderr: engine.stderr };
  } catch(e) {
    return { ...options, composeVersion, envs, str, fullStr: `${envsStr} ${str}`, error: e };
  }
  return options;
}