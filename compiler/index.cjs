const config = require('../tsconfig.json');
config.compilerOptions.module = 'commonjs';
require('ts-node').register(config);
require('dotenv').config();
module.exports = () => {};
