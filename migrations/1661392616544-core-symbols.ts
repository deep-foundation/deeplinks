import Debug from 'debug';
import { coreSymbolsPckg } from '../imports/core-symbols.js';
import { importPackage, packageExists } from './1664940577200-tsx.js';

const debug = Debug('deeplinks:migrations:core-symbols');
const log = debug.extend('log');
const error = debug.extend('error');

export const up = async () => {
  log('up');
  if (!await packageExists('@deep-foundation/core-symbols')) {
    const importResult = await importPackage(coreSymbolsPckg);
    log(importResult);
  }
};

export const down = async () => {
  log('down');
};