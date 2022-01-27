require('dotenv').config();

jest.setTimeout(30000);

import './tests/client';
import './tests/join-insert';
import './tests/typing';
import './tests/selectors';
import './tests/bool_exp';
import './tests/permissions';
import './tests/handlers';
import './tests/minilinks';

// import './tests/packager';
// TODO error if duplicates