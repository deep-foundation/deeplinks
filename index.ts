import express from 'express';
import router from './imports/router/index';
import jwtServer from './imports/router/jwt'
import guestServer from './imports/router/guest'

const app = express();

app.use('/', router);

app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Listening ${process.env.PORT} port`);
})

jwtServer.applyMiddleware({ path: '/api/jwt', app });
guestServer.applyMiddleware({ path: '/api/guest', app });