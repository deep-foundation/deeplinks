import express from 'express';
import router from './imports/router/index';
import generateJwtServer from './imports/router/jwt';
import generateGuestServer from './imports/router/guest';
import generatePackagerServer from './imports/router/packager';
import axios from 'axios';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import expressPlayground from 'graphql-playground-middleware-express';
import moesif from 'moesif-nodejs';
import Debug from 'debug';
import waitOn from 'wait-on';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from './imports/client';
import gql from 'graphql-tag';

const DEEPLINKS_HASURA_PATH = process.env.DEEPLINKS_HASURA_PATH || 'localhost:8080';
const DEEPLINKS_HASURA_SSL = process.env.DEEPLINKS_HASURA_SSL || 0;
const DEEPLINKS_HASURA_SECRET = process.env.DEEPLINKS_HASURA_SECRET || 'myadminsecretkey';
const MOESIF_TOKEN = process.env.MOESIF_TOKEN || '';

const debug = Debug('deeplinks');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const app = express();
const httpServer = http.createServer(app);

app.get('/gql', expressPlayground({
  tabs: [{ 
    endpoint: '/gql',
    query: `query MyQuery {
      links(limit: 1) {
        id
      }
    }`,
    headers: {
      Authorization: 'Bearer TOKEN',
    },
  }],
}));

app.use('/gql', createProxyMiddleware({
  target: `http${DEEPLINKS_HASURA_SSL === '1' ? 's' : ''}://${DEEPLINKS_HASURA_PATH}`,
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    "/gql": "/v1/graphql",
  },
}));

//   hasura-admin

app.use(['/v1','/v1alpha1','/v2','/console'], createProxyMiddleware({
  target: `http${DEEPLINKS_HASURA_SSL === '1' ? 's' : ''}://${DEEPLINKS_HASURA_PATH}`,
  changeOrigin: true,
  ws: true,
}));

//   hasura-admin

if (MOESIF_TOKEN) {
  const moesifMiddleware = moesif({applicationId: MOESIF_TOKEN});
  app.use(moesifMiddleware);
  moesifMiddleware.startCaptureOutgoing();
}


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
  log(`Hello bugfixers! Listening ${process.env.PORT} port`);
  try {
    await waitOn({ resources: [`http${DEEPLINKS_HASURA_SSL === '1' ? 's' : ''}-get://${DEEPLINKS_HASURA_PATH}/console`] });
    await axios({
      method: 'post',
      url: `http${DEEPLINKS_HASURA_SSL === '1' ? 's' : ''}://${DEEPLINKS_HASURA_PATH}/v1/metadata`,
      headers: { 'x-hasura-admin-secret': DEEPLINKS_HASURA_SECRET, 'Content-Type': 'application/json'},
      data: { type: 'reload_metadata', args: {}}
    }).then(() => {
      log('hasura metadata reloaded');
    }, () => {
      error('hasura metadata broken');
    });
  } catch(e){
    error(e);
  }
}

start();

const client = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({
  apolloClient: client,
})

const handleRoutes = async () => {
  try {
    const portTypeId = await deep.id('@deep-foundation/core', 'Port');
    const handleRouteTypeId = await deep.id('@deep-foundation/core', 'HandleRoute');
    const routerStringUseTypeId = await deep.id('@deep-foundation/core', 'RouterStringUse');
    const routerListeningTypeId = await deep.id('@deep-foundation/core', 'RouterListening');
  
    const routes = await client.query({
      query: gql`
        query {
          links(where: {
            type_id: { _eq: "${portTypeId}" }
          }) {
            id
            routerListening: in(where: {
              type_id: { _eq: "${routerListeningTypeId}" }
            }) {
              id
              router: from {
                id
                routerStringUse: in(where: {
                  type_id: { _eq: "${routerStringUseTypeId}" }
                }) {
                  id
                  route: from {
                    id
                    handleRoute: out(where: {
                      type_id: { _eq: "${handleRouteTypeId}" }
                    }) {
                      id
                      supports: from {
                        id
                        isolation: from {
                          id
                          image: value
                        }
                      }
                      handler: to {
                        id
                        file: to {
                          id
                          code: value
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `, variables: {} });
    const links = routes.data.links;
    console.log(JSON.stringify(links, null, 2));
  } catch(e) {
    console.log(JSON.stringify(e, null, 2));
  }
};

const startRouteHandling = async () => {
  setInterval(handleRoutes, 1000);
};

startRouteHandling();