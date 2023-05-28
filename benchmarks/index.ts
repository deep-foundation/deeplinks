import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { Suite } from 'benchmark';
import { DeepClient } from '../imports/client.js';
import _ from 'lodash';
import Debug from 'debug';

const debug = Debug('deeplinks:benchmarks');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const delay = time => new Promise(res => setTimeout(res, time));

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

(async () => {
  var suite = new Suite();
  const admin = await deep.jwt({ linkId: await deep.id('deep', 'admin') });
  const deepAdmin = new DeepClient({ deep: deep, token: admin.token, linkId: admin.linkId });
  const Query = await deep.id('@deep-foundation/core', 'Query');
  const guest = await deep.guest({});
  const deepGuest = new DeepClient({ deep: deepAdmin, ...guest });

  await deepAdmin.insert({
    type_id: await deep.id('@deep-foundation/core', 'Rule'),
    out: { data: [
      {
        type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Selector'),
          out: { data: [
            {
              type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
              to_id: guest.linkId,
              out: { data: {
                type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
                to_id: await deep.id('@deep-foundation/core', 'containTree'),
              } },
            },
          ] }
        } }
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Selector'),
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: await deep.id('@deep-foundation/core'),
            out: { data: {
              type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
              to_id: await deep.id('@deep-foundation/core', 'containTree'),
            } },
          } }
        } }
      },
      {
        type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
        to: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Selector'),
          out: { data: {
            type_id: await deep.id('@deep-foundation/core', 'SelectorInclude'),
            to_id: await deep.id('@deep-foundation/core', 'AllowInsertType'),
            out: { data: {
              type_id: await deep.id('@deep-foundation/core', 'SelectorTree'),
              to_id: await deep.id('@deep-foundation/core', 'containTree'),
            } },
          } }
        } }
      },
    ] },
  });

  await (new Promise((res) => {
    suite.add('3000', { defer: true, fn: async function(deferred) {
      await delay(3000);
      deferred.resolve();
    } });
    suite.add('by deepRoot.id', { defer: true, fn: async function(deferred) {
      await deep.id('@deep-foundation/core', 'Promise');
      deferred.resolve();
    } });
    // suite.add('by deepGuest.id', { defer: true, fn: async function(deferred) {
    //   await deepGuest.id('@deep-foundation/core', 'Promise');
    //   deferred.resolve();
    // } });
    suite.add('deepAdmin.insert { type: Any } x1/1tr', { defer: true, fn: async function(deferred) {
      await deepAdmin.insert({ type_id: Query });
      deferred.resolve();
    } });
    suite.add('deepAdmin.insert { type: Any } x100/1tr', { defer: true, fn: async function(deferred) {
      await deepAdmin.insert(_.times(100, (t) => ({ type_id: Query })));
      deferred.resolve();
    } });
    suite.add('deepAdmin.insert { type: Any } x1000/1tr', { defer: true, fn: async function(deferred) {
      await deepAdmin.insert(_.times(1000, (t) => ({ type_id: Query })));
      deferred.resolve();
    } });
    // suite.add('deepGuest.insert { type: Any } x1/1tr', { defer: true, fn: async function(deferred) {
    //   await deepGuest.insert({ type_id: Query });
    //   deferred.resolve();
    // } });
    // suite.add('deepGuest.insert { type: Any } x100/1tr', { defer: true, fn: async function(deferred) {
    //   await deepGuest.insert(_.times(100, (t) => ({ type_id: Query })));
    //   deferred.resolve();
    // } });
    // suite.add('deepGuest.insert { type: Any } x1000/1tr', { defer: true, fn: async function(deferred) {
    //   await deepGuest.insert(_.times(1000, (t) => ({ type_id: Query })));
    //   deferred.resolve();
    // } });
  
    suite.on('cycle', function(event) {
      log(String(event.target));
    });
    suite.on('complete', function() {
      log('Fastest is ' + this.filter('fastest').map('name'));
      res(undefined);
    });
    // run async
    suite.run({ 'async': false });
  }));
})();