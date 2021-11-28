import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import internalIp from 'internal-ip';
import axios from 'axios';

const execP = promisify(exec);
const DEEPLINKS_URL = process.env.DEEPLINKS_URL;

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

export async function call (options: IOptions) {
  const envs = { ...options.envs, DOCKERHOST: await internalIp.v4() };
  let envsString = generateEnvs(envs);
  try {
    if (options.operation === 'run') {
      const isDocker = await axios.get(`${DEEPLINKS_URL}/api/healthz`);
      console.log(isDocker);
      let str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && npm run docker && npx -q wait-on tcp:8080 && cd ${_deeplinks} && npm run migrate`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
    if (options.operation === 'sleep') {
      let str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
    if (options.operation === 'reset') {
      let str = `${envsString} cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down && docker container prune -f && docker system prune --volumes -f && cd ${_deeplinks} && npx rimraf .migrate`;
      const { stdout, stderr } = await execP(str);
      return { ...options, envs, str, stdout, stderr };
    }
  } catch(error) {
    return { ...options, envs, error };
  }
  return options;
};
