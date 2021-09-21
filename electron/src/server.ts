import express from 'express';
import fkill from 'fkill';
import { call } from '@deepcase/deeplinks/imports/engine';

import { promisify } from 'util';
import { exec } from 'child_process';

const execP = promisify(exec);

(async () => {
  const app = express();
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.post('/api/deeplinks', async (req, res) => {
    res.json(await call({ ...req.body, PATH: `${__dirname}/../../resources/bin` }));
  });
  app.post('/test', async (req, res) => {
    const PATH = `${__dirname}/../../resources/bin`;
    const path = PATH ? `export PATH=${PATH}:$PATH;` : '';
    res.json(await execP(`${path}${req.body.exec}`));
  });
  app.post('/eval', async (req, res) => {
    res.json({ eval: eval(req.body.eval) });
  });
  await fkill(':3007', { silent: true });
  app.listen(3007, () => {
    console.log(`Example app listening at http://localhost:3007`)
  });
})().catch(console.error);