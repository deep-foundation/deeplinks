import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';

const execP = promisify(exec);

export interface IOptions {
  operation: 'run' | 'sleep' | 'reset';
  handle?: (exec: string) => string;
}

const _hasura = path.normalize(`${__dirname}/../../hasura`);
const _deeplinks = path.normalize(`${__dirname}/../`);

export async function call (options: IOptions) {
  if (options.operation === 'run') {
    let str = `cd ${path.normalize(`${_hasura}/local/`)} && npm run docker && cd ${__dirname} && wait-on tcp:8080 && cd ${_deeplinks} && npm run migrate`;
    str = options.handle ? options.handle(str) : str;
    console.log(str);
    const { stdout, stderr } = await execP(str);
    console.log(stdout);
    console.log(stderr);
  }
  if (options.operation === 'sleep') {
    let str = `cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down && cd ${__dirname}`;
    str = options.handle ? options.handle(str) : str;
    console.log(str);
    const { stdout, stderr } = await execP(str);
    console.log(stdout);
    console.log(stderr);
  }
  if (options.operation === 'reset') {
    let str = `cd ${path.normalize(`${_hasura}/local/`)} && docker-compose down && cd ${__dirname} && docker container prune -f && docker system prune --volumes -f && cd ${_deeplinks} && rimraf .migrate`;
    str = options.handle ? options.handle(str) : str;
    console.log(str);
    const { stdout, stderr } = await execP(str);
    console.log(stdout);
    console.log(stderr);
  }
  console.log('called', options);
  return options;
};
