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

// const _deeplinks = path.normalize(`${__dirname}/..`);

const last = async () => {
  const last = fs.readdirSync('./snapshots').filter(file => /^-?[0-9]+$/.test(file)).pop();
  const { stdout, stderr } = await execP(`cd / && tar xf snapshots/${last} --strip 1 && cp snapshots/${last}.migrate .migrate`);
  console.log('stdout',stdout);
  console.log('stderr',stderr);
}

last();
