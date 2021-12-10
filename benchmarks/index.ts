import { generateApolloClient } from '@deep-foundation/hasura/client';
import { Suite } from 'benchmark';
import { DeepClient } from '../imports/client';

const delay = time => new Promise(res => setTimeout(res, time));

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  secret: process.env.HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

(async () => {
  var suite = new Suite();

  suite.add('3000', { defer: true, fn: async function(deferred) {
    await delay(3000);
    deferred.resolve();
  } });
  suite.add('deepClient.id', { defer: true, fn: async function(deferred) {
    await deep.id('@deep-foundation/core', 'Promise');
    deferred.resolve();
  } });

  suite.on('cycle', function(event) {
    console.log(String(event.target));
  });
  suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  });
  // run async
  suite.run({ 'async': false });
})();