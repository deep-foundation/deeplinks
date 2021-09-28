import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import internalIp from 'internal-ip';

const execP = promisify(exec);

export interface IOptions {
  operation: 'run' | 'sleep' | 'reset';
  handle?: (exec: string) => string;
}

const _hasura = path.normalize(`${__dirname}/../../hasura`);
const _deeplinks = path.normalize(`${__dirname}/../`);

export async function call (options: IOptions) {
  console.log('called', options);
  try {
    if (options.operation === 'run') {
      let str = `cd ${path.normalize(`${_hasura}/local/`)} && cross-env-shell DOCKERHOST=${await internalIp.v4()} "npm run docker" && wait-on tcp:8080 && cd ${_deeplinks} && npm run migrate`;
      str = options.handle ? options.handle(str) : str;
      const { stdout, stderr } = await execP(str);
      return { ...options, str, stdout, stderr };
    }
    if (options.operation === 'sleep') {
      let str = `cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down`;
      str = options.handle ? options.handle(str) : str;
      const { stdout, stderr } = await execP(str);
      return { ...options, str, stdout, stderr };
    }
    if (options.operation === 'reset') {
      let str = `cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down && docker container prune -f && docker system prune --volumes -f && cd ${_deeplinks} && rimraf .migrate`;
      str = options.handle ? options.handle(str) : str;
      const { stdout, stderr } = await execP(str);
      return { ...options, str, stdout, stderr };
    }
  } catch(error) {
    return { ...options, error };
  }
  return options;
};
