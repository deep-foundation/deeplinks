const { spawn, execSync } = require('child_process');
const url = execSync('echo -n $DATABASE_URL', { encoding: 'utf-8' }); 
console.log('url = ',url);

const gql = spawn('./graphql-engine', ['serve'], {
  env: {
    HASURA_GRAPHQL_DATABASE_URL: url
  }
});
const deeplinksApp = spawn('npm', ['run', 'start'], {
  env: {
    PORT: 3007
  }
});
let migrations;
console.log(`Hello bugfixers! This hasura wrapped by menzorg@deep.foundation`);
gql.stdout.on('data', (data) => {
  console.log(`{ "logtype": "hasura", "log": ${data}`);
});

gql.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

gql.on('close', (code) => {
  console.log(`gql exited with code ${code}`);
});

deeplinksApp.stdout.on('data', (data) => {
 console.log(`{ "logtype": "app", "log": ${data}`);
});

deeplinksApp.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

deeplinksApp.on('close', (code) => {
  console.log(`deeplinksApp exited with code ${code}`);
});

setTimeout(()=>{
  migrations = spawn('npm', ['run', 'migrate']);
  migrations.stdout.on('data', (data) => {
   console.log(`{ "logtype": "migrations", "log": "${data}""`);
  });
  migrations.on('close', (code) => {
    console.log(`migrations exited with code ${code}`);
  });
}, 10000);