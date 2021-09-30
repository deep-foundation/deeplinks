const { spawn, execSync } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');
var express = require('express');
var app = express();

app.use('/hasura', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    "^/hasura": "/",
  }
}));
app.use('/', createProxyMiddleware({ target: `http://localhost:${process.env.NEXTPORT}`, changeOrigin: true }));
app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Wrapped app listening at ${process.env.PORT} port`);
})

const url = execSync('echo -n $DATABASE_URL', { encoding: 'utf-8' });
const gql = spawn('./graphql-engine', ['serve'], {
  env: {
    ...process.env,
    HASURA_GRAPHQL_DATABASE_URL: url,
  }
});

const deeplinksApp = spawn('npm', ['run', 'heroku-next-start'], {
    env: {
      ...process.env,
      PORT: process.env.NEXTPORT
    }
  });

gql.stdout.on('data', (data) => {
  console.log(`{ "logtype": "hasura", "log": ${data}`);
});

gql.stderr.on('data', (data) => {
  console.log(`{ "logtype": "hasura", "error": ${data}`);
});

gql.on('close', (code) => {
  console.log(`gql exited with code ${code}`);
});

deeplinksApp.stdout.on('data', (data) => {
 console.log(`{ "logtype": "app", "log": ${data}`);
});

deeplinksApp.stderr.on('data', (data) => {
  console.log(`{ "logtype": "app", "error": ${data}`);
});

deeplinksApp.on('close', (code) => {
  console.log(`deeplinksApp exited with code ${code}`);
});

let migrations;
setTimeout(()=>{
  migrations = spawn('npm', ['run', 'migrate']);
  deeplinksApp.stderr.on('data', (data) => {
    console.log(`{ "logtype": "migrations", "error": ${data}`);
  });
  migrations.stdout.on('data', (data) => {
   console.log(`{ "logtype": "migrations", "log": "${data}""`);
  });
  migrations.on('close', (code) => {
    console.log(`migrations exited with code ${code}`);
  });
}, 20000);