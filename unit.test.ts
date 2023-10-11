import { jest } from '@jest/globals';

require('dotenv').config();

jest.setTimeout(120000);

import './tests/minilinks';
import './tests/minilinks-query';