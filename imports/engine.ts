import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import internalIp from 'internal-ip';
import axios from 'axios';

const execP = promisify(exec);
const DEEPLINKS_PUBLIC_URL = process.env.DEEPLINKS_PUBLIC_URL || 'http://localhost:3006';
export interface IOptions {
  operation: 'run' | 'sleep' | 'reset';
  envs: { [key: string]: string; };
}

const _hasura = path.normalize(`${__dirname}/../../hasura`);
const _deeplinks = path.normalize(`${__dirname}/../`);

const handleEnvWindows = (k, envs) => ` set ${k} ${envs[k]} &&`;
const handleEnvUnix = (k, envs) => ` export ${k}=${envs[k]} &&`;
const handleEnv = process.platform === "win32" ? handleEnvWindows : handleEnvUnix;

const generateEnvs = (options) => {
  const { envs, isDocker } = options;
  let envsString = '';
  const isGitpod = !!process.env['GITPOD_GIT_USER_EMAIL'] && !!process.env['GITPOD_TASKS'];
  const hasuraPort = 8080;
  const deeplinksPort = 3006;
  const deepcasePort = 3007;
  if (isGitpod) {
    envsString += ` export NEXT_PUBLIC_ENGINES=1; export NEXT_PUBLIC_HIDEPATH=1; export npm_config_yes=true; export JWT_SECRET=\"{\\\"type\\\":\\\"HS256\\\",\\\"key\\\":\\\"3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R\\\"}\" export MIGRATIONS_ID_TYPE_SQL=bigint; export MIGRATIONS_ID_TYPE_GQL=bigint; export MIGRATIONS_HASURA_PATH=$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}'); export DEEPLINKS_HASURA_PATH=$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}'); export MIGRATIONS_HASURA_SSL=1; export DEEPLINKS_HASURA_SSL=1; export MIGRATIONS_HASURA_SECRET=myadminsecretkey; export DEEPLINKS_HASURA_SECRET=myadminsecretkey;  export NEXT_PUBLIC_DEEPLINKS_SERVER=https://$(echo $(gp url ${deepcasePort}) | awk -F[/:] '{print $4}'); export NEXT_PUBLIC_HASURA_PATH=$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}'); export NEXT_PUBLIC_HASURA_SSL=1 DEEPLINKS_HASURA_PATH=$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}'); export DEEPLINKS_HASURA_SSL=1; export MIGRATIONS_DEEPLINKS_APP_URL=$(gp url ${deepcasePort}); export MIGRATIONS_DEEPLINKS_URL=$(gp url ${deeplinksPort}); export NEXT_PUBLIC_DEEPLINKS_URL=$(gp url ${deeplinksPort}); `
  } else {
    envs['npm_config_yes'] = envs['npm_config_yes'] ? envs['npm_config_yes'] : 'true';
    envs['NEXT_PUBLIC_HIDEPATH'] = envs['NEXT_PUBLIC_HIDEPATH'] ? envs['NEXT_PUBLIC_HIDEPATH'] : '1';
    envs['JWT_SECRET'] = envs['JWT_SECRET'] ? envs['JWT_SECRET'] : `'{"type":"HS256","key":"3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R"}'`;
    envs['MIGRATIONS_ID_TYPE_SQL'] = envs['MIGRATIONS_ID_TYPE_SQL'] ? envs['MIGRATIONS_ID_TYPE_SQL'] : 'bigint';
    envs['MIGRATIONS_ID_TYPE_GQL'] = envs['MIGRATIONS_ID_TYPE_GQL'] ? envs['MIGRATIONS_ID_TYPE_GQL'] : 'bigint';
    envs['MIGRATIONS_HASURA_PATH'] = envs['MIGRATIONS_HASURA_PATH'] ? envs['MIGRATIONS_HASURA_PATH'] : `localhost:${hasuraPort}`;
    envs['DEEPLINKS_HASURA_PATH'] = envs['DEEPLINKS_HASURA_PATH'] ? envs['DEEPLINKS_HASURA_PATH'] : isDocker === 0 ? `localhost:${hasuraPort}` : `host.docker.internal:${hasuraPort}`;
    envs['MIGRATIONS_HASURA_SSL'] = envs['MIGRATIONS_HASURA_SSL'] ? envs['MIGRATIONS_HASURA_SSL'] : '0';
    envs['DEEPLINKS_HASURA_SSL'] = envs['DEEPLINKS_HASURA_SSL'] ? envs['DEEPLINKS_HASURA_SSL'] : '0';
    envs['MIGRATIONS_HASURA_SECRET'] = envs['MIGRATIONS_HASURA_SECRET'] ? envs['MIGRATIONS_HASURA_SECRET'] : 'myadminsecretkey';
    envs['DEEPLINKS_HASURA_SECRET'] = envs['DEEPLINKS_HASURA_SECRET'] ? envs['DEEPLINKS_HASURA_SECRET'] : 'myadminsecretkey';
    envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] = envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] ? envs['NEXT_PUBLIC_DEEPLINKS_SERVER'] : `http://localhost:${deepcasePort}`;
    envs['NEXT_PUBLIC_HASURA_PATH'] = envs['NEXT_PUBLIC_HASURA_PATH'] ? envs['NEXT_PUBLIC_HASURA_PATH'] : `localhost:${hasuraPort}`;
    envs['NEXT_PUBLIC_HASURA_SSL'] = envs['NEXT_PUBLIC_HASURA_SSL'] ? envs['NEXT_PUBLIC_HASURA_SSL'] : '0';
    envs['DEEPLINKS_HASURA_PATH'] = envs['DEEPLINKS_HASURA_PATH'] ? envs['DEEPLINKS_HASURA_PATH'] : `localhost:${hasuraPort}`;
    envs['DEEPLINKS_HASURA_SSL'] = envs['DEEPLINKS_HASURA_SSL'] ? envs['DEEPLINKS_HASURA_SSL'] : '0';
    envs['MIGRATIONS_DEEPLINKS_APP_URL'] = envs['MIGRATIONS_DEEPLINKS_APP_URL'] ? envs['MIGRATIONS_DEEPLINKS_APP_URL'] : `http://host.docker.internal:${deepcasePort}`;
    envs['MIGRATIONS_DEEPLINKS_URL'] = envs['MIGRATIONS_DEEPLINKS_URL'] ? envs['MIGRATIONS_DEEPLINKS_URL'] : `http://host.docker.internal:${deeplinksPort}`;
    envs['NEXT_PUBLIC_DEEPLINKS_URL'] = envs['NEXT_PUBLIC_DEEPLINKS_URL'] ? envs['NEXT_PUBLIC_DEEPLINKS_URL'] : `http://localhost:${deeplinksPort}`;
  }
  Object.keys(envs).forEach(k => envsString += handleEnv(k, envs));
  return envsString;
};

const checkStatus = async () => {
  let result;
  try {
    result = await axios.get(`${DEEPLINKS_PUBLIC_URL}/api/healthz`, { validateStatus: status => true });
  } catch (error){
    console.log(error);
  }
  return result?.data?.docker;
};

export async function call (options: IOptions) {
  const envs = { ...options.envs, DOCKERHOST: await internalIp.v4() };
  const isDocker = await checkStatus();
  let envsString = generateEnvs({ envs, isDocker});
  let str;
  try {
    if (options.operation === 'run') {
      str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && npm run docker && npx -q wait-on tcp:8080 && cd ${_deeplinks} ${isDocker===undefined ? `&& ${ process.platform === "win32" ? 'set COMPOSE_CONVERT_WINDOWS_PATHS 1 &&' : ''} npm run start-deeplinks-docker && npx -q wait-on ${DEEPLINKS_PUBLIC_URL}/api/healthz --timeout 10000` : ''} && ${ process.platform === "win32" ? 'set MIGRATIONS_DIR .migrate &&' : 'export MIGRATIONS_DIR=/tmp/.deep-migrate &&'} rm -rf $MIGRATIONS_DIR && npm run migrate -- -f $MIGRATIONS_DIR`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
    if (options.operation === 'sleep') {
      str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down ${isDocker ? '--remove-orphans' : ''}`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
    if (options.operation === 'reset') {
      str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down ${isDocker || isDocker===undefined ? '--remove-orphans' : ''} && docker container prune -f && docker system prune --volumes -f && cd ${_deeplinks} && npx rimraf .migrate`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
  } catch(error) {
    return { ...options, str, envs, error };
  }
  return options;
};
