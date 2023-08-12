import atob from 'atob';
import { URL } from 'url';
import express from 'express';
import router from './imports/router/index.js';
import generateJwtServer from './imports/router/jwt.js';
import generateGuestServer from './imports/router/guest.js';
import generatePackagerServer from './imports/router/packager.js';
import generateAuthorizationServer from './imports/router/authorization.js';
import axios from 'axios';
import http from 'http';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const expressPlayground = require('graphql-playground-middleware-express').default;
import moesif from 'moesif-nodejs';
import Debug from 'debug';
import waitOn from 'wait-on';
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from './imports/client.js';
import gql from 'graphql-tag';
import { containerController, DOCKER, getJwt } from './imports/router/links.js';
import { MinilinkCollection, MinilinksGeneratorOptionsDefault } from './imports/minilinks.js';
import _ from 'lodash';
import Cors from 'cors';
import cookieParser from 'cookie-parser';

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

const makeDeepClient = (token: string) => {
  return new DeepClient({
    apolloClient: generateApolloClient({
      path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
      ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
      token
    }),
  });
}

const app = express();
app.use(cookieParser());
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
  logLevel: 'debug',
  pathRewrite: {
    "/gql": "/v1/graphql",
  },
}));

// const getQueryStringParam = (req, paramName) => {
//   // protocol and hostname here are mean nothing, these are only required to create URL
//   const urlString = `${req.protocol}://${req.hostname}${req.url}`;
//   console.log('getQueryStringParam', 'urlString', urlString);
//   const url = new URL(urlString);
//   console.log('getQueryStringParam', 'url', url);
//   console.log('getQueryStringParam', 'url.searchParams', url.searchParams);
//   const paramValue = url.searchParams.get(paramName);
//   console.log('getQueryStringParam', paramName, paramValue);
//   return paramValue;
// }

app.get(['/file'], createProxyMiddleware({
  target: DEEPLINKS_HASURA_STORAGE_URL,
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: async (path, req) => {
    console.log('/file get proxy', 'path', path);
    console.log('/file get proxy', 'req.baseUrl', req.baseUrl);
    console.log('/file get proxy', 'req.originalUrl', req.originalUrl);
    console.log('/file get proxy', 'req.protocol', req.protocol);
    console.log('/file get proxy', 'req.hostname', req.hostname);
    console.log('/file get proxy', 'req.url', req.url);
    console.log('/file get proxy', 'req.query.linkId', req.query.linkId)
    req.params
    const headers = req.headers;
    console.log('/file get proxy', 'headers', headers);
    const cookies = req.cookies;
    console.log('/file get proxy', 'cookies', JSON.stringify(cookies, null, 2));

    let token = '';
    let authorizationHeader = headers['authorization'];
    if (authorizationHeader) {
      token = authorizationHeader.split(' ')[1];
      console.log('/file get proxy', 'header token', token);
    } else {
      const tokenCookie = cookies?.['dc-dg-token'];
      if (tokenCookie) {
        token = JSON.parse(tokenCookie)?.value;
        console.log('/file get proxy', 'cookie token', token);
        if (token) {
          req.headers.authorization = `Bearer ${token}`;
        }
        console.log('/file get proxy', 'cookie token is set as header token');
      }
    }
    console.log('/file get proxy', 'result token', token);

    const deep = makeDeepClient(token);
    const linkId = req.query.linkId;
    const result = await deep.apolloClient.query({
      query: gql`{
        files(where: {link_id: {_eq: ${linkId}}}) {
          id
        }
      }`
    })
    console.log('/file get proxy', 'result', result)
    const fileId = result?.data?.files?.[0]?.id;
    console.log('/file get proxy', 'fileId', fileId)

    if (fileId) {
      return `/v1/files/${fileId}`;
    } else {
      return `/v1/files/00000000-0000-0000-0000-000000000000`; // This should generate 404 error
    }
  }
}));

const cors = Cors({ methods: ['POST', 'OPTIONS'] });
app.use(cors);

app.post('/file', async (req, res, next) => {
  console.log('/file post proxy','DEEPLINKS_HASURA_STORAGE_URL', DEEPLINKS_HASURA_STORAGE_URL);
  // canObject
  const headers = req.headers;
  console.log('/file post proxy', 'headers', JSON.stringify(headers, null, 2));
  const cookies = req.cookies;
  console.log('/file post proxy', 'cookies', JSON.stringify(cookies, null, 2));
  let userId;
  let linkId;
  try {
    const claims = atob(`${headers['authorization'] ? headers['authorization'] : headers['Authorization']}`.split(' ')[1].split('.')[1]);
    userId = +(JSON.parse(claims)['https://hasura.io/jwt/claims']['x-hasura-user-id']);
    linkId = +(headers['linkId'] || headers['linkid']);
    console.log('/file post proxy','linkId',linkId);
  } catch (e){
    console.log('/file post proxy','error: ', e);
  }
  if (!userId) res.status(403).send('Update CAN NOT be processes');
  const canResult = await deep.can(linkId, userId, await deep.id('@deep-foundation/core', 'AllowUpdateType')) || await deep.can(null, userId, await deep.id('@deep-foundation/core', 'AllowAdmin'));
  console.log('/file post proxy','can', await deep.can(linkId, userId, await deep.id('@deep-foundation/core', 'AllowUpdateType')), 'isAdmin', await deep.can(null, userId, await deep.id('@deep-foundation/core', 'AllowAdmin')));
  console.log('/file post proxy','userId', userId, typeof(userId));
  console.log('/file post proxy','canResult', canResult);
  if (!canResult) return res.status(403).send(`You cant update link ##${linkId} as user ##${userId}, and user ##${userId} is not admin.`);
  //insert file
  await createProxyMiddleware({
    target: DEEPLINKS_HASURA_STORAGE_URL,
    selfHandleResponse: true,
    logLevel: 'debug',
    onError: (err, req, res, target) => {
      console.log('/file post proxy','onError', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end('Something went wrong. And we are reporting a custom error message.');
    },
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      console.log('/file post proxy','onProxyRes');
      //update linkId
      const response = responseBuffer.toString('utf8'); // convert buffer to string
      console.log('/file post proxy',`RESPONSE ${response}`);
      let files;
      try {
        files = JSON.parse(response);
        console.log('/file post proxy','files', files);
        if (!files) return response;
        const UPDATE_FILE_LINKID = gql`mutation UPDATE_FILE_LINKID($linkId: bigint, $fileid: uuid, $uploadedByLinkId: bigint) {
          updateFiles(where: {id: {_eq: $fileid}}, _set: {link_id: $linkId, uploadedByLinkId: $uploadedByLinkId }){
            returning {
              id
              link_id
              uploadedByLinkId
            }
          }
        }`;
        console.log('/file post proxy','files[0].id', files.id);
        const updated = await client.mutate({
          mutation: UPDATE_FILE_LINKID,
          variables: { 
            fileid: files.id,
            linkId: linkId,
            uploadedByLinkId: userId
          },
        });
        console.log('/file post proxy','linkid',linkId)
        console.log('/file post proxy','data',updated?.data?.updateFiles?.returning);
      } catch (e){
        console.log('/file post proxy','try error: ', e);
         if (files[0]?.id){
          await client.mutate({
            mutation:  gql`mutation DELETE_FILE($fileid: uuid) { deleteFiles(where: {id: {_eq: $fileid}}){ returning { id } } }`,
            variables: { 
              fileid: files.id,
            },
          });
          return JSON.stringify({error: 'one link - one file'});
         }
      }
      return response;
    }),
    changeOrigin: true,
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
  logLevel: 'debug',
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