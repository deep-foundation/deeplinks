import { promisify } from 'util';
import { exec } from 'child_process';

const execP = promisify(exec);

export interface IOptions {
  operation: 'run' | 'sleep' | 'reset';
  handle?: (exec: string) => string;
}

const _hasura = `${__dirname}/../../hasura`;
const _deeplinks = `${__dirname}/../`;

export async function call (options: IOptions) {
  if (options.operation === 'run') {
    let str = `((cd ${_hasura}/local/ && npm run docker) && sleep 10 && (cd ${_deeplinks} && npm run migrate))`;
    str = options.handle ? options.handle(str) : str;
    const { stdout, stderr } = await execP(str);
    console.log(stdout);
    console.log(stderr);
  }
  if (options.operation === 'sleep') {
    let str = `(cd ${_hasura}/local/ && docker-compose down)`;
    str = options.handle ? options.handle(str) : str;
    const { stdout, stderr } = await execP(str);
    console.log(stdout);
    console.log(stderr);
  }
  if (options.operation === 'reset') {
    let str = `((cd ${_hasura}/local/ && docker rm -f $(docker ps -a -q) && docker volume rm $(docker volume ls -q)) && (cd ${_deeplinks} && find . -type f -name '.migrate' -exec rm {} +))`;
    str = options.handle ? options.handle(str) : str;
    const { stdout, stderr } = await execP(str);
    console.log(stdout);
    console.log(stderr);
  }
  console.log('called', options);
  return options;
};
