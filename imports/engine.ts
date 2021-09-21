import { promisify } from 'util';
import { exec } from 'child_process';

const execP = promisify(exec);

export interface IOptions {
  operation: 'run' | 'sleep' | 'reset';
  path: string;
}

const {
  MIGRATIONS_HASURA_PATH,
  MIGRATIONS_HASURA_SSL,
  MIGRATIONS_HASURA_SECRET,
  MIGRATIONS_DEEPLINKS_APP_URL,
} = process.env;

const envsObj = {
  MIGRATIONS_HASURA_PATH,
  MIGRATIONS_HASURA_SSL,
  MIGRATIONS_HASURA_SECRET,
  MIGRATIONS_DEEPLINKS_APP_URL,
};

const envsKeys = Object.keys(envsObj);
let envs = '';
for (let e = 0; e < envsKeys.length; e++) {
  const en = envsKeys[e];
  envs += `export ${en}='${envsObj[en]}';`;
}

const _hasura = `${__dirname}/../../hasura`;
const _deeplinks = `${__dirname}/../`;

export async function call (options: IOptions) {
  console.log('call', options);
  if (options.operation === 'run') {
    const { stdout, stderr } = await execP(`export PATH=$PATH:${options.path};((cd ${_hasura}/local/; npm run docker); sleep 10; (cd ${_deeplinks}; npm run migrate))`);
    console.log(stdout);
    console.log(stderr);
  }
  if (options.operation === 'sleep') {
    const { stdout, stderr } = await execP(`export PATH=$PATH:${options.path};(cd ${_hasura}/local/; docker-compose down;)`);
    console.log(stdout);
    console.log(stderr);
  }
  if (options.operation === 'reset') {
    const { stdout, stderr } = await execP(`export PATH=$PATH:${options.path};((cd ${_hasura}/local/; docker rm -f $(docker ps -a -q); docker volume rm $(docker volume ls -q)); (cd ${_deeplinks}; find . -type f -name '.migrate' -exec rm {} +))`);
    console.log(stdout);
    console.log(stderr);
  }
  console.log('called', options);
  return options;
};
