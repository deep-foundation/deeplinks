import atob from 'atob';
import { URL } from 'url';
import express from 'express';
import router from './imports/router/index';
import generateJwtServer from './imports/router/jwt';
import generateGuestServer from './imports/router/guest';
import generatePackagerServer from './imports/router/packager';
import generateAuthorizationServer from './imports/router/authorization';
import axios from 'axios';
import http from 'http';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import expressPlayground from 'graphql-playground-middleware-express';
import moesif from 'moesif-nodejs';
import Debug from 'debug';
import waitOn from 'wait-on';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from './imports/client';
import gql from 'graphql-tag';
import { containerController, DOCKER, getJwt } from './imports/router/links';
import { MinilinkCollection, MinilinksGeneratorOptionsDefault } from './imports/minilinks';
import _ from 'lodash';
import Cors from 'cors';

const DEEPLINKS_HASURA_PATH = process.env.DEEPLINKS_HASURA_PATH || 'localhost:8080';
const DEEPLINKS_HASURA_STORAGE_URL = process.env.DEEPLINKS_HASURA_STORAGE_URL || 'http://localhost:8000';
const DEEPLINKS_HASURA_SSL = process.env.DEEPLINKS_HASURA_SSL || 0;
const DEEPLINKS_HASURA_SECRET = process.env.DEEPLINKS_HASURA_SECRET || 'myadminsecretkey';
const MOESIF_TOKEN = process.env.MOESIF_TOKEN || '';
const DEEPLINKS_PUBLIC_URL = process.env.DEEPLINKS_PUBLIC_URL || '';

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
    endpoint: `${DEEPLINKS_PUBLIC_URL}/gql`,
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

app.get(['/file'], createProxyMiddleware({
  target: DEEPLINKS_HASURA_STORAGE_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: async (path, req) => {
    const headers = req.headers;
    console.log(headers);
    const newurl = new URL(`${headers['host']}${path}`);
    const linkId = newurl.searchParams['linkId'];
    return `/v1/files/${linkId}`;
  }
}));

const cors = Cors({ methods: ['POST', 'OPTIONS'] });
app.use(cors);

app.post('/file', async (req, res, next) => {
  console.log('DEEPLINKS_HASURA_STORAGE_URL', DEEPLINKS_HASURA_STORAGE_URL);
  // canObject
  const headers = req.headers;
  let userId;
  let linkId;
  try {
    const claims = atob(`${headers['authorization'] ? headers['authorization'] : headers['Authorization']}`.split(' ')[1].split('.')[1]);
    userId = +(JSON.parse(claims)['https://hasura.io/jwt/claims']['x-hasura-user-id']);
    linkId = +(headers['linkId'] || headers['linkid']);
    console.log('linkId',linkId);
  } catch (e){
    console.log('error: ', e);
  }
  if (!userId) res.status(403).send('Update CAN NOT be processes');
  const canResult = await deep.can(linkId, userId, await deep.id('@deep-foundation/core', 'AllowUpdateType')) || userId === await deep.id('deep', 'admin');
  console.log('can', await deep.can(linkId, userId, await deep.id('@deep-foundation/core', 'AllowUpdateType')), 'isAdmin', userId === await deep.id('deep', 'admin'));
  console.log('userId', userId, typeof(userId));
  console.log('canResult', canResult);
  if (!canResult) return res.status(403).send(`You cant update link ##${linkId} as user ##${userId}, and user ##${userId} is not admin.`);
  //insert file
  await createProxyMiddleware({
    target: DEEPLINKS_HASURA_STORAGE_URL,
    selfHandleResponse: true,
    logLevel: 'debug',
    onError: (err, req, res, target) => {
      console.log('onError', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end('Something went wrong. And we are reporting a custom error message.');
    },
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      console.log('onProxyRes');
      //update linkId
      const response = responseBuffer.toString('utf8'); // convert buffer to string
      let files;
      try {
        files = JSON.parse(response)?.processedFiles;
        console.log('files', files);
        if (!files) return response;
        const UPDATE_FILE_LINKID = gql`mutation UPDATE_FILE_LINKID($linkId: bigint, $fileid: uuid) {
          updateFiles(where: {id: {_eq: $fileid}}, _set: {link_id: $linkId}){
            returning {
              id
              link_id
            }
          }
        }`;
        console.log('files[0].id', files[0].id);
        const updated = await client.mutate({
          mutation: UPDATE_FILE_LINKID,
          variables: { 
            fileid: files[0].id,
            linkId: linkId,
          },
        });
        console.log('linkid',linkId)
        console.log('data',updated?.data?.updateFiles?.returning);
      } catch (e){
        console.log('try error: ', e);
         if (files[0]?.id){
          await client.mutate({
            mutation:  gql`mutation DELETE_FILE($fileid: uuid) { deleteFiles(where: {id: {_eq: $fileid}}){ returning { id } } }`,
            variables: { 
              fileid: files[0].id,
            },
          });
          return JSON.stringify({error: 'one link - one file'});
         }
      }
      return response;
    }),
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      "/file": "/v1/files",
    },
  })(req,res,next);
});

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
  const authorizationServer = generateAuthorizationServer(httpServer);
  const guestServer = generateGuestServer(httpServer);
  const packagerServer = generatePackagerServer(httpServer);
  await jwtServer.start();
  await guestServer.start();
  await authorizationServer.start();
  await packagerServer.start();
  jwtServer.applyMiddleware({ path: '/api/jwt', app });
  guestServer.applyMiddleware({ path: '/api/guest', app });
  authorizationServer.applyMiddleware({ path: '/api/authorization', app });
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

const routesDebug = Debug('deeplinks').extend('eh').extend('routes');
const routesDebugLog = routesDebug.extend('log');
const routesDebugError = routesDebug.extend('error');

let currentServers = {};
let currentPorts = {};
let busy = false;
let portTypeId = 0;

// const ml = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
// const addedListener = (nl, recursive = true, history = {}) => {
//   if (nl.type_id == portTypeId) {
//     // TODO: Start server
//     routesDebugLog('server should be started at port', nl.value);
//   } else {
//     // TODO: Get list of servers affected by this change and restart them
//     routesDebugLog('impossible');
//   }
// };
// const updatedListener = (ol, nl, recursive = true, history = {}) => {
//   if (ol.type_id == portTypeId && nl.type_id == portTypeId) {
//     // TODO: Restart server
//     routesDebugLog('server should be restarted at port', nl.value);
//   } else {
//     // TODO: Get list of servers affected by this change and restart them
//     routesDebugLog('impossible');
//   }
// };
// const removedListener = (ol, recursive = true, history = {}) => {
//   if (ol.type_id == portTypeId) {
//     // TODO: Stop server
//     routesDebugLog('server should be stopped at port', ol.value);
//   } else {
//     // TODO: Get list of servers affected by this change and restart them
//     routesDebugLog('impossible');
//   }
// };
// ml.emitter.on('added', addedListener);
// ml.emitter.on('updated', updatedListener);
// ml.emitter.on('removed', removedListener);

const toJSON = (data) => JSON.stringify(data, Object.getOwnPropertyNames(data), 2);

const handleRoutes = async () => {
  if (busy)
    return;
  busy = true;

  // clean up old servers
  // for (const key in currentServers) {
  //   if (Object.prototype.hasOwnProperty.call(currentServers, key)) {
  //     const element = currentServers[key];
  //     element.close();
  //   }
  // }
  // currentServers = {};

  try {
    portTypeId = await deep.id('@deep-foundation/core', 'Port');
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
    const portsResult = routesResult.data.ports;
    routesDebugLog('portsResult', JSON.stringify(portsResult, null, 2));

    const ports = {};
    for (const port of portsResult) {
      const portValue = port?.port?.value;
      ports[portValue] = port;
    }
    routesDebugLog('ports', JSON.stringify(ports, null, 2));

    const updatedOrAddedPorts = [];
    for (const key in currentPorts) {
      if (currentPorts.hasOwnProperty(key)) {
        if (ports.hasOwnProperty(key)) {
          if(!_.isEqual(currentPorts[key], ports[key])) {
            currentPorts[key] = ports[key];
            updatedOrAddedPorts.push(ports[key]);
          } else {
            // do nothing
          }
        } else {
          if (currentServers.hasOwnProperty(key))
          {
            const element = currentServers[key];
            element.close();
            delete currentServers[key];
          }
          delete currentPorts[key];
        }
      }
    }
    for (const key in ports) {
      if (ports.hasOwnProperty(key)) {
        if (!currentPorts.hasOwnProperty(key)) {
          currentPorts[key] = ports[key];
          updatedOrAddedPorts.push(ports[key]);
        }
      }
    }
    routesDebugLog('updatedOrAddedPorts', JSON.stringify(updatedOrAddedPorts, null, 2));
    routesDebugLog('currentPorts', JSON.stringify(currentPorts, null, 2));

    // const mlRoutesResult = await client.query({
    //   query: gql`
    //     {
    //       ports: links(where: {
    //         _or: [
    //           {type_id: {_eq: "${portTypeId}"}}, 
    //           {_by_item: {path_item: {type_id: {_eq: "${portTypeId}"}}}}
    //         ]
    //       }) {
    //         id
    //         type_id
    //         from_id
    //         to_id
    //         value
    //       }
    //     }
    //   `, variables: {} });
    // const mlPorts = mlRoutesResult.data.ports;
    // routesDebugLog('mlPorts', JSON.stringify(mlPorts, null, 2));

    // ml.apply(mlPorts);
    // routesDebugLog('ml', toJSON(ml));

    // routesDebugLog('ml.byType', toJSON(ml.byType));

    // get all image values
    const imageContainers = {};
    updatedOrAddedPorts.forEach(port => {
      port.routerListening.forEach(routerListening => {
        routerListening?.router?.routerStringUse.forEach(routerStringUse => {
          routerStringUse?.route?.handleRoute.forEach(handleRoute => {
            imageContainers[handleRoute?.handler?.supports?.isolation?.image?.value] = {};
          });
        });
      });
    });
    const imageList = Object.keys(imageContainers);
    routesDebugLog('imageList', imageList);

    // prepare containers
    for (const image of imageList) {
      routesDebugLog(`preparing container ${image}`);
      imageContainers[image] = await containerController.newContainer({
        handler: image,
        forceRestart: true,
        publish: +DOCKER ? false : true,
        code: '', // TODO: Remove
        jwt: '',
        data: {}
      });
    }

    // // for each port
    // for (const port of ml.byType[portTypeId] ?? []) {
    //   routesDebugLog('port', toJSON(port));
    //   const routerListeningLinks = port.in.filter(l => l.type_id == routerListeningTypeId);
    //   routesDebugLog('routerListeningLinks', toJSON(routerListeningLinks));
    //   if (routerListeningLinks.length > 0) {
    //     const portValue = port?.value?.value;
    //     routesDebugLog('portValue', portValue);
    //     // routesDebugLog(`listening on port ${portValue}`);

    //     // for each router
    //     for (const routerListening of routerListeningLinks) {
    //       // routesDebugLog('routerListening', toJSON(routerListening));
    //       const router = routerListening.from;
    //       routesDebugLog('router', toJSON(router));

    //       const routerStringUseLinks = router.in.filter(l => l.type_id == routerStringUseTypeId);
    //       // for each routerStringUse
    //       for (const routerStringUse of routerStringUseLinks) {
    //         const routeString = routerStringUse?.value?.value;
    //         routesDebugLog(`route string ${routeString}`);
    //         const route = routerStringUse?.from;

    //         const handleRouteLinks = route.out.filter(l => l.type_id == handleRouteTypeId);
    //         // for each handleRoute
    //         for (const handleRoute of handleRouteLinks) {
    //           const handler = handleRoute?.to;
    //           routesDebugLog(`handler`, handler);
    //           const handlerId = handler?.id;
    //           routesDebugLog(`handler id ${handlerId}`);

    //           const jwt = await getJwt(handlerId, routesDebugLog);
    //           routesDebugLog(`jwt ${jwt}`);

    //           // get container
    //           const supports = ml.byId[handler?.from_id];
    //           routesDebugLog(`supports`, supports);
    //           const isolation = ml.byId[supports?.from_id];
    //           routesDebugLog(`isolation`, isolation);
    //           const image = isolation?.image?.value;
    //           routesDebugLog(`image`, image);
    //           const container = imageContainers[image];
    //           routesDebugLog(`container`, JSON.stringify(container, null, 2));

    //           const file = ml.byId[handler?.to_id];
    //           const code = file?.value?.value;
    //           routesDebugLog(`code ${code}`);
    //         }
    //       }
    //     }
    //   }
    // }

    // for each port
    for (const port of updatedOrAddedPorts) {
      const portValue = port?.port?.value;
      
      if (currentServers.hasOwnProperty(portValue)) {
        currentServers[portValue].close();
      }

      if (port.routerListening.length > 0) {
        // listen on port
        routesDebugLog(`listening on port ${portValue}`);
        // start express server
        const portServer = express();

        currentServers[portValue] = http.createServer({ maxHeaderSize: 10*1024*1024*1024 }, portServer).listen(portValue);

        // for each router
        for (const routerListening of port.routerListening) {
          const router = routerListening?.router;
          
          // for each routerStringUse
          for (const routerStringUse of router.routerStringUse) {
            const routeString = routerStringUse?.routeString?.value;
            routesDebugLog(`route string ${routeString}`);
            const route = routerStringUse?.route;

            // for each handleRoute
            for (const handleRoute of route.handleRoute) {
              const handler = handleRoute?.handler;
              const handlerId = handler?.id;
              routesDebugLog(`handler id ${handlerId}`);

              const jwt = await getJwt(handlerId, routesDebugLog);
              routesDebugLog(`jwt ${jwt}`);

              // get container
              const image = handler?.supports?.isolation?.image?.value;
              routesDebugLog(`image`, image);
              const container = imageContainers[image];
              routesDebugLog(`container`, JSON.stringify(container, null, 2));

              const code = handler?.file?.code?.value;
              routesDebugLog(`code ${code}`);

              routesDebugLog('container', container);

              // proxy to container using its host and port
              const proxy = createProxyMiddleware({
                target: `http://${container.host}:${container.port}`,
                changeOrigin: true,
                ws: true,
                pathRewrite: {
                  [routeString]: "/http-call",
                },
                onProxyReq: (proxyReq, req, res) => {
                  routesDebugLog('deeplinks request')
                  routesDebugLog('req.method', req.method);
                  routesDebugLog('req.body', req.body);
                  proxyReq.setHeader('deep-call-options', encodeURI(JSON.stringify({
                    jwt,
                    code,
                    data: {},
                  })));
                },
                onProxyRes: (proxyRes, req, res) => {
                  // var body = "";
                  proxyRes.on('data', async function(data) {
                    try {  
                      data = data.toString('utf-8');
                      // body += data;
                      routesDebugLog('data', data);
                      // if JSON
                      if (data.startsWith('{')) {
                        data = JSON.parse(data);
                        // log rejected
                        if (data.hasOwnProperty('rejected')) {
                          routesDebugLog('rejected', data.rejected);
                          // HandlingError type id
                          const handlingErrorTypeId = await deep.id('@deep-foundation/core', 'HandlingError');
                          routesDebugLog('handlingErrorTypeId', handlingErrorTypeId);

                          const insertResult = await deep.insert({
                            type_id: handlingErrorTypeId,
                            object: { data: { value: data.rejected } },
                            out: { data: [
                              {
                                type_id: await deep.id('@deep-foundation/core', 'HandlingErrorReason'),
                                to_id: route.id
                              },
                              {
                                type_id: await deep.id('@deep-foundation/core', 'HandlingErrorReason'),
                                to_id: handleRoute.id
                              }
                            ]},
                          }, {
                            name: 'INSERT_HANDLING_ERROR',
                          }) as any;
                        }
                      }
                    } catch (e) {
                      routesDebugError('deeplinks response error', e)
                    }
                  });
                  // routesDebugLog('body', body);
                }
              });
              portServer.use(routeString, proxy);
            }
          }
        }
      }
    }
  } catch(e) {
    routesDebugLog(toJSON(e));
  }
  
  busy = false;
};

const startRouteHandling = async () => {
  setInterval(handleRoutes, 5000);
};

startRouteHandling();