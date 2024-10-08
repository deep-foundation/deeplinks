import Debug from 'debug';

const debug = Debug('deeplinks:migrations:deepcase');
const log = debug.extend('log');
const error = debug.extend('error');

export const up = async () => {
  log('up');
  // disable support deepcase and make migrations in gh-actions faster
  // moved to packages/deeplinks/migrations/1678940577209-deepcase.ts
};

export const down = async () => {
  log('down');
};