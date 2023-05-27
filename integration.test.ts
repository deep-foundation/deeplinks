require('dotenv').config();

jest.setTimeout(1000000);

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

// Slow tests here:
import './tests/sync-handlers';
import './tests/handlers';