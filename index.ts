import express from 'express';
import router from './imports/router/index';
import apolloServer from './imports/router/jwt'

const app = express();

app.use('/', router);

app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Listening ${process.env.PORT} port`);
})

apolloServer.applyMiddleware({ path: '/api/jwt', app });