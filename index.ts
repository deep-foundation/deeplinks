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
import { containerController, DOCKER, getJwt } from './imports/router/links';

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

export const delay = (time) => new Promise(res => setTimeout(() => res(null), time));

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

let currentServers = {};
let busy = false;

const toJSON = (data) => JSON.stringify(data, Object.getOwnPropertyNames(data), 2);

const handleRoutes = async () => {
  if (busy)
    return;
  busy = true;

  // clean up old servers
  for (const key in currentServers) {
    if (Object.prototype.hasOwnProperty.call(currentServers, key)) {
      const element = currentServers[key];
      element.close();
    }
  }
  currentServers = {};

  try {
    const portTypeId = await deep.id('@deep-foundation/core', 'Port');
    const handleRouteTypeId = await deep.id('@deep-foundation/core', 'HandleRoute');
    const routerStringUseTypeId = await deep.id('@deep-foundation/core', 'RouterStringUse');
    const routerListeningTypeId = await deep.id('@deep-foundation/core', 'RouterListening');
  
    const routesResult = await client.query({
      query: gql`
        query {
          ports: links(where: {
            type_id: { _eq: "${portTypeId}" }
          }) {
            id
            port: value
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
                  routeString: value
                  route: from {
                    id
                    handleRoute: out(where: {
                      type_id: { _eq: "${handleRouteTypeId}" }
                    }) {
                      id
                      handler: to {
                        id
                        supports: from {
                          id
                          isolation: from {
                            id
                            image: value
                          }
                        }
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
    const ports = routesResult.data.ports;
    console.log(JSON.stringify(ports, null, 2));

    // get all image values
    const imageContainers = {};
    ports.forEach(port => {
      port.routerListening.forEach(routerListening => {
        routerListening.router.routerStringUse.forEach(routerStringUse => {
          routerStringUse.route.handleRoute.forEach(handleRoute => {
            imageContainers[handleRoute.handler.supports.isolation.image.value] = {};
          });
        });
      });
    });
    const imageList = Object.keys(imageContainers);
    console.log('imageList', imageList);

    // prepare containers
    imageList.forEach(async image => {
      console.log(`preparing container ${image}`);
      imageContainers[image] = await containerController.newContainer({
        handler: image,
        forceRestart: true,
        publish: +DOCKER ? false : true,
        code: '', // TODO: Remove
        jwt: '',
        data: {}
      });
    });

    // for each port
    for (const port of ports) {
      if (port.routerListening.length > 0) {
        // start express server
        const portServer = express();
        // listen on port
        const portValue = port.port.value;
        console.log(`listening on port ${portValue}`);
        currentServers[portValue] = portServer.listen(portValue);

        // // for each router
        // for (const routerListening of port.routerListening) {
        //   const router = routerListening.router;

        const routeString = port.routerListening[0].router.routerStringUse[0].routeString.value;
        console.log(`route string ${routeString}`);
        const code = port.routerListening[0].router.routerStringUse[0].route.handleRoute[0].handler.file.code.value;
        console.log(`code ${code}`);
        const handlerId = port.routerListening[0].router.routerStringUse[0].route.handleRoute[0].handler.id;
        console.log(`handler id ${handlerId}`);
        // TODO: Fix getJWT (handler should be owned by user or package)
        const jwt = await getJwt(handlerId, console.log);
        console.log(`jwt ${jwt}`);

        // get container
        const image = port?.routerListening[0]?.router?.routerStringUse[0]?.route?.handleRoute[0]?.handler?.supports?.isolation?.image?.value;
        console.log(`preparing container ${image}`);

        const container = imageContainers[image];

        // proxy to container using its host and port
        const proxy = createProxyMiddleware({
          target: `http://${container.host}:${container.port}/http-call`,
          changeOrigin: true,
          onProxyReq: (proxyReq, req, res) => {
            proxyReq.setHeader('deep-call-options', JSON.stringify({
              jwt,
              code,
              data: {},
            }));
          }
        });
        portServer.use(routeString, proxy);
      }
    }
  } catch(e) {
    console.log(toJSON(e));
  }
  
  busy = false;
};

const startRouteHandling = async () => {
  setInterval(handleRoutes, 2000);
};

startRouteHandling();