import express from 'express';
import router from './imports/router/index';
import generateJwtServer from './imports/router/jwt';
import generateGuestServer from './imports/router/guest';
import generatePackagerServer from './imports/router/packager';
import axios from 'axios';
import http from 'http';

const NEXT_PUBLIC_HASURA_PATH = process.env.NEXT_PUBLIC_HASURA_PATH || 'localhost:8080';
const NEXT_PUBLIC_HASURA_SSL = process.env.NEXT_PUBLIC_HASURA_PATH || 0;
const HASURA_SECRET = process.env.HASURA_SECRET || 'myadminsecretkey';

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use('/', router);

const start = async () => {
  const jwtServer = generateJwtServer(httpServer);
  const guestServer = generateGuestServer(httpServer);
  const packagerServer = generatePackagerServer(httpServer);
  await jwtServer.start();
  await guestServer.start();
  await packagerServer.start();
  jwtServer.applyMiddleware({ path: '/api/jwt', app });
  guestServer.applyMiddleware({ path: '/api/guest', app });
  packagerServer.applyMiddleware({ path: '/api/packager', app });
  await new Promise<void>(resolve => httpServer.listen({ port: process.env.PORT }, resolve));
  console.log(`Hello bugfixers! Listening ${process.env.PORT} port`);
  try {
    await axios.get(`http${NEXT_PUBLIC_HASURA_SSL ? 's' : ''}://${NEXT_PUBLIC_HASURA_PATH}/v1/metadata`, { headers: { 'X-Hasura-Admin-Secret': HASURA_SECRET}, data: '{"type": "reload_metadata", "args": {}}' });
  } catch(e) {
    console.error(e);
  }
}

start();