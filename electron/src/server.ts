import express from 'express';
import fkill from 'fkill';
import { call } from '@deepcase/deeplinks/imports/engine';

(async () => {
  const app = express();
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.post('/api/deeplinks', async (req, res) => {
    res.json(await call(req.body));
    res.json(await call({ ...req.body }));
  });
  await fkill(':3007', { silent: true });
  app.listen(3007, () => {
    console.log(`Example app listening at http://localhost:3007`)
  });
})().catch(console.error);