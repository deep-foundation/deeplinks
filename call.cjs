#!/usr/bin/env node

const engine = require('./imports/engine.cjs');

const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS || '{ "operation": "run" }';

(async() => {
  await engine.call(JSON.parse(DEEPLINKS_CALL_OPTIONS));
})()
