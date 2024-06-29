#!/usr/bin/env node
import { call } from './imports/engine-server.js';

const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS || '{ "operation": "run" }';

(async() => {
  await call(JSON.parse(DEEPLINKS_CALL_OPTIONS));
})()
