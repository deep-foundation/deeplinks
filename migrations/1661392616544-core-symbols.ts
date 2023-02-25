import Debug from 'debug';
import { coreSymbolsPckg } from '../imports/core-symbols';
import { importPackage } from './1664940577200-tsx';

const debug = Debug('deeplinks:migrations:core-symbols');
const log = debug.extend('log');
const error = debug.extend('error');

export const up = async () => {
  log('up');
  const importResult = await importPackage(coreSymbolsPckg);
  log(importResult);
};

export const down = async () => {
  log('down');
};