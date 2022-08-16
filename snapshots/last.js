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

const last = async () => {
  const files = await fs.readdir('./snapshots');
  const snapshots = files.filter(file => /^-?[0-9]+$/.test(file));
  const last = snapshots[snapshots.length - 1];
  const volumeName = await getCompose() === '2' ? 'deep-db_data' : 'deep_db_data';
  const { stdout, stderr } = await execP(`cd docker-prod/deep && (docker-compose -f docker-compose.yml stop graphql-engine postgres || true ) && docker run -v ${_deeplinks}:/deeplinks -v ${volumeName}:/data --rm --name links --entrypoint \"sh\" deepf/deeplinks:main -c \"cd / && tar xf deeplinks/snapshots/${last} --strip 1\" && (docker-compose -f docker-compose.yml start graphql-engine postgres || true) && cd ../.. && cp snapshots/${last}.migrate .migrate`);
  console.log('stdout',stdout);
  console.log('stderr',stderr);
}

last();
