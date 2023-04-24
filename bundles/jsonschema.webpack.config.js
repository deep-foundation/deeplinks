const path = require('path');
module.exports = {
  entry: './node_modules/jsonschema/lib/index.js',
  output: {
    filename: 'jsonschema.js',
    path: path.resolve(__dirname),
  },
  resolve: {
    fallback: { "url": require.resolve("url/") }
  }
};
