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

const last = async () => {
  const files = await fs.readdir('./snapshots');
  const snapshots = files.filter(file => /^-?[0-9]+$/.test(file));
  const last = snapshots[snapshots.length - 1];
  console.log(`docker run -v ${_deeplinks}:/deeplinks -v deep-db-data:/data --rm --name links --entrypoint "sh" deepf/deeplinks:main -c "cd / && tar xf snapshots/${last} --strip 1 && cp snapshots/${last}.migrate .migrate"`);
  const { stdout, stderr } = await execP(`docker run -v ${_deeplinks}:/deeplinks -v deep-db-data:/data --rm --name links --entrypoint "sh" deepf/deeplinks:main -c "cd / && tar xf snapshots/${last} --strip 1 && cp snapshots/${last}.migrate .migrate"`);
  console.log('stdout',stdout);
  console.log('stderr',stderr);
}

last();