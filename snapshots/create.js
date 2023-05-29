import { createRequire } from 'module';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const  { promisify } = require('util');
const { exec } = require('child_process');
const { promises: fs } = require('fs');
const execP = promisify(exec);
const path = require('path');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const _deeplinks = path.normalize(`${__dirname}/..`);

const create = async () => {
  const files = await fs.readdir('./snapshots');
  const snapshots = files.filter(file => /^-?[0-9]+$/.test(file));
  const last = snapshots[snapshots.length - 1];
  const time = (new Date()).getTime();
  const { stdout, stderr } = await execP(`cd docker-prod/deep && (docker-compose -f docker-compose.yml stop hasura postgres || true) && docker run -v ${_deeplinks}:/deeplinks --volumes-from deep-postgres --rm --name links --entrypoint \"sh\" deepf/deeplinks:main -c \"cd / && ls var/lib/postgresql && tar -c -v -C /var/lib/postgresql -f /deeplinks/snapshots/${time} ./data" && docker-compose -f docker-compose.yml start hasura postgres && cd ../.. && cp .migrate snapshots/${time}.migrate`);
  console.log('stdout',stdout);
  console.log('stderr',stderr);
}

create();
