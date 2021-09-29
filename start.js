const { spawn, execSync } = require('child_process');
const url = execSync('echo -n $DATABASE_URL', { encoding: 'utf-8' });
var express = require('express');
var app = express();

app.get('/hasura/api', function(req, res) {
  res.send('hello hasura');
});

app.ws('/hasura/api', function(ws, req) {
  ws.on('message', function(msg) {
    ws.send(msg);
  });
});

app.get('/hasura', function(req, res) {
  res.send('hello hasura');
});
app.get('/', function(req, res) {
  res.send('hello world');
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at ${process.env.PORT} port`);
})


const gql = spawn('./graphql-engine', ['serve'], {
  env: {
    ...process.env,
    HASURA_GRAPHQL_DATABASE_URL: url
  }
});

const deeplinksApp = spawn('npm', ['run', 'heroku-next-start'], {
  env: {
    ...process.env,
    NEXTPORT: "3007"
  }
});

let migrations;
console.log(`Hello bugfixers! This hasura wrapped by menzorg@deep.foundation`);
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

setTimeout(()=>{
  migrations = spawn('npm', ['run', 'migrate']);
  console.log(3);
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