const path = require('path');
module.exports = {
  entry: './node_modules/mathjs/lib/cjs/index.js',
  output: {
    filename: 'mathjs.js',
    path: path.resolve(__dirname),
  },
};
