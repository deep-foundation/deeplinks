import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import internalIp from 'internal-ip';
import axios from 'axios';

const execP = promisify(exec);
const NEXT_PUBLIC_DEEPLINKS_URL = process.env.NEXT_PUBLIC_DEEPLINKS_URL || 'http://localhost:3006';

export interface IOptions {
  operation: 'run' | 'sleep' | 'reset';
  envs: { [key: string]: string; };
}

const _hasura = path.normalize(`${__dirname}/../../hasura`);
const _deeplinks = path.normalize(`${__dirname}/../`);

const handleEnvWindows = (k, envs, envString) => envString+` set ${k} ${envs[k]} &&`;
const handleEnvUnix = (k, envs, envString) => envString+` export ${k}=${envs[k]} &&`;
const handleEnv = process.platform === "win32" ? handleEnvWindows : handleEnvUnix;

const generateEnvs = (envs) => {
  let envsString = '';
  Object.keys(envs).forEach(k => envsString += handleEnv(k, envs, envsString));
  const isGitpod = !!process.env['GITPOD_GIT_USER_EMAIL'] && !!process.env['GITPOD_TASKS'];
  const hasuraPort = 8080;
  const deeplinksPort = 3006;
  const deepcasePort = 3007;
  if (isGitpod) {
    envsString += ` export npm_config_yes=true; export NEXT_PUBLIC_PLATFORM=gitpod; export JWT_SECRET='{"type":"HS256","key":"3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R"}'; export MIGRATIONS_ID_TYPE_SQL=bigint; export MIGRATIONS_ID_TYPE_GQL=bigint; export MIGRATIONS_HASURA_PATH=$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}'); export MIGRATIONS_HASURA_SSL=1; export MIGRATIONS_HASURA_SECRET=myadminsecretkey; export NEXT_PUBLIC_DEEPLINKS_SERVER=https://$(echo $(gp url ${deepcasePort}) | awk -F[/:] '{print $4}'); export NEXT_PUBLIC_HASURA_PATH=$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}'); export NEXT_PUBLIC_HASURA_SSL=1 HASURA_PATH=$(echo $(gp url ${hasuraPort}) | awk -F[/:] '{print $4}'); export HASURA_SSL=1; export MIGRATIONS_DEEPLINKS_APP_URL=$(gp url ${deepcasePort}); export DEEPLINKS_URL=$(gp url ${deeplinksPort}); export NEXT_PUBLIC_DEEPLINKS_URL=$(gp url ${deeplinksPort});`
  } else {
    envsString += ` cross-env npm_config_yes=true JWT_SECRET=\"{\\\"type\\\":\\\"HS256\\\",\\\"key\\\":\\\"3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R\\\"}\" MIGRATIONS_ID_TYPE_SQL=bigint MIGRATIONS_ID_TYPE_GQL=bigint MIGRATIONS_HASURA_PATH=localhost:${hasuraPort} MIGRATIONS_HASURA_SSL=0 MIGRATIONS_HASURA_SECRET=myadminsecretkey NEXT_PUBLIC_DEEPLINKS_SERVER=http://localhost:${deepcasePort} NEXT_PUBLIC_HASURA_PATH=localhost:${hasuraPort} NEXT_PUBLIC_HASURA_SSL=0 HASURA_PATH=localhost:${hasuraPort} HASURA_SSL=0 MIGRATIONS_DEEPLINKS_APP_URL=http://host.docker.internal:${deepcasePort} DEEPLINKS_URL=http://host.docker.internal:${deeplinksPort} NEXT_PUBLIC_DEEPLINKS_URL=http://localhost:${deeplinksPort}`
  }
  return envsString;
};

const checkStatus = async () => {
  const result = await axios.get(`${NEXT_PUBLIC_DEEPLINKS_URL}/api/healthz`, { validateStatus: status => status === 404 || status === 200 });
  return result?.data?.docker;
};

export async function call (options: IOptions) {
  const envs = { ...options.envs, DOCKERHOST: await internalIp.v4() };
  let envsString = generateEnvs(envs);
  try {
    const isDocker = await checkStatus();
    if (options.operation === 'run') {
      let str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && npm run docker && npx -q wait-on tcp:8080 && cd ${_deeplinks} ${isDocker===undefined ? `&& npm run start-docker && npx -q wait-on ${NEXT_PUBLIC_DEEPLINKS_URL}/api/healthz` : ''} && npm run migrate`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
    if (options.operation === 'sleep') {
      let str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down ${isDocker ? '--remove-orphans' : ''}`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
    if (options.operation === 'reset') {
      let str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down ${isDocker ? '--remove-orphans' : ''} && docker container prune -f && docker system prune --volumes -f && cd ${_deeplinks} && npx rimraf .migrate`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
  } catch(error) {
    return { ...options, envs, error };
  }
  return options;
};
