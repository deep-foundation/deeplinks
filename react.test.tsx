import { createRequire } from 'module';
import { jest } from '@jest/globals';
const require = createRequire(import.meta.url);

require('dotenv').config();

jest.setTimeout(120000);

import './tests/client.react'