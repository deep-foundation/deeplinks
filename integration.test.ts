import { createRequire } from 'module';
import { jest } from '@jest/globals';
const require = createRequire(import.meta.url);

require('dotenv').config();

jest.setTimeout(120000);

// Please move slowest tests to bottom to make progress bar more dynamic and get more tests done first.

import './tests/client';
import './tests/join-insert';
import './tests/typing';
import './tests/selectors';
import './tests/bool_exp';
import './tests/permissions';
import './tests/demo';
import './tests/packager';
// import './tests/messanger';
import './tests/tree';
import './tests/experimental/client'

// Slow tests here:
import './tests/sync-handlers';
import './tests/handlers';