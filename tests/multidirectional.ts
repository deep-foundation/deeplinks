require('dotenv').config();

import Debug from 'debug';
import { gql } from 'apollo-boost';
import Chance from 'chance';
// import { check, checkManual } from '../check';
// import { client } from '../client';
import fs from 'fs';
// import { beforeAllHandler, prepare, testMinus15, testPlus15, testRecursive, testRecursiveSameRoot, testSeparation1, testSeparation2 } from '../imports/multidirectional';

const chance = new Chance();
const debug = Debug('materialized-path:test');

const SCHEMA = process.env.MIGRATIONS_SCHEMA || 'public';
const MP_TABLE = process.env.MIGRATIONS_MP_TABLE || 'mp_example__links__mp_md';
const GRAPH_TABLE = process.env.MIGRATIONS_GRAPH_TABLE || 'mp_example__links_md';
const ID_TYPE = process.env.MIGRATIONS_ID_TYPE_GQL || 'Int';

const DELAY = +process.env.DELAY || 0;
const delay = time => new Promise(res => setTimeout(res, time));

const itDelay = () => {
  if (DELAY) {
    (it)('delay', async () => {
      await delay(DELAY);
    });
  }
};

export const beforeAllHandler = () => { };
export const prepare = () => { };
export const testMinus15 = (x: boolean) => async () => { };
export const testPlus15 = (x: boolean) => async () => { }
export const testRecursive = (x: boolean) => async () => { };
export const testRecursiveSameRoot = (x: boolean) => async () => { }
export const testSeparation1 = (x: boolean) => async () => { }
export const testSeparation2 = (x: boolean) => async () => { }

beforeAll(beforeAllHandler); 
(it)('prepare', prepare);
it('+15', testPlus15(true));
itDelay();
it('-15', testMinus15(true));
itDelay();

it('recursive', testRecursive(true));
itDelay();
it('recursiveSameRoot', testRecursiveSameRoot(true));
itDelay();
it('testSeparation1', testSeparation1(true));
itDelay();
it('testSeparation2', testSeparation2(true));
