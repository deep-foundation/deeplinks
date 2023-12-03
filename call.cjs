#!/usr/bin/env node

const { call } = require('./imports/engine-server.cjs');

const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS || '{ "operation": "run" }';

(async() => {
  await call(JSON.parse(DEEPLINKS_CALL_OPTIONS));
})()
