import { call } from './imports/engine'

const DEEPLINKS_CALL_OPTIONS = process.env.DEEPLINKS_CALL_OPTIONS || '{ "operation": "run" }';

(async() => {
  await call(JSON.parse(DEEPLINKS_CALL_OPTIONS));
})()
