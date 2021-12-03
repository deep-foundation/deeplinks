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
  return envsString;
};

const checkStatus = async () => {
  const result = await axios.get(`${NEXT_PUBLIC_DEEPLINKS_URL}/api/healthz`, { validateStatus: status => status === 404 || status === 200 });
  return result?.data?.docker;
}

const deeplinksEnvs = `MIGRATIONS_HASURA_SECRET=myadminsecretkey MIGRATIONS_HASURA_SSL=0 MIGRATIONS_HASURA_PATH=http://localhost:8080/ JWT_SECRET='{"type":"HS256","key":"3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R"}'`;

export async function call (options: IOptions) {
  const envs = { ...options.envs, DOCKERHOST: await internalIp.v4() };
  let envsString = generateEnvs(envs);
  try {
    const isDocker = await checkStatus();
    if (options.operation === 'run') {
      let str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && npm run docker && npx -q wait-on tcp:8080 && cd ${_deeplinks} ${isDocker===undefined ? `&& ${deeplinksEnvs} npm run start-docker && npx -q wait-on tcp:3006` : ''} && npm run migrate`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
    if (options.operation === 'sleep') {
      let str = `${envsString} cd ${_deeplinks} && ${isDocker ? '(npm run docker-stop || true)' : isDocker === 0 ? 'npx -q fkill :3006' : ''} && cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
    if (options.operation === 'reset') {
      let str = `${envsString} cd ${_deeplinks} && ${isDocker ? '(npm run docker-stop || true) &&' : isDocker === 0 ? 'npx -q fkill :3006 &&' : ''} cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down && docker container prune -f && docker system prune --volumes -f && cd ${_deeplinks} && npx rimraf .migrate`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
  } catch(error) {
    return { ...options, envs, error };
  }
  return options;
};
