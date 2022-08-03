const  { promisify } = require('util');
const { exec } = require('child_process');
const { promises: fs } = require('fs');
const execP = promisify(exec);
const path = require('path');
const _deeplinks = path.normalize(`${__dirname}/..`);

const getCompose = async () => {
  try {
    const { stdout } = await execP(`docker-compose version --short`);
    return stdout.match(/\d+/)[0];
  } catch(e){
    error(e);
    return { error: e };
  }
};

const create = async () => {
  const files = await fs.readdir('./snapshots');
  const snapshots = files.filter(file => /^-?[0-9]+$/.test(file));
  const last = snapshots[snapshots.length - 1];
  const time = (new Date()).getTime();
  const containerName = await getCompose() === '2' ? 'deep-postgres-1' : 'deep_postgres_1';
  const { stdout, stderr } = await execP(`cd docker-prod/deep && (docker-compose -f docker-compose.yml stop graphql-engine postgres || true) && docker run -v ${_deeplinks}:/deeplinks --volumes-from ${containerName} --rm --name links --entrypoint \"sh\" deepf/deeplinks:main -c \"cd / && ls var/lib/postgresql && tar -c -v -C /var/lib/postgresql -f /deeplinks/snapshots/${time} ./data" && docker-compose -f docker-compose.yml start graphql-engine postgres && cd ../.. && cp .migrate snapshots/${time}.migrate`);
  console.log('stdout',stdout);
  console.log('stderr',stderr);
}

create();
