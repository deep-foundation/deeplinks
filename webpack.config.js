const path = require('path');
const packageJson = require(path.resolve(__dirname,`./node_modules/${process.env.LIBNAME}/package.json`));
module.exports = {
  entry: path.resolve(__dirname, `./node_modules/${process.env.LIBNAME}`, packageJson.main),
  output: {
    filename: `${process.env.LIBNAME}.js`,
    path: path.resolve(__dirname, 'bundles'),
  },
  resolve: {
    fallback: {
      assert: require.resolve('assert'),
      buffer: require.resolve('buffer'),
      console: require.resolve('console-browserify'),
      constants: require.resolve('constants-browserify'),
      crypto: require.resolve('crypto-browserify'),
      domain: require.resolve('domain-browser'),
      events: require.resolve('events'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      path: require.resolve('path-browserify'),
      punycode: require.resolve('punycode'),
      process: require.resolve('process/browser'),
      querystring: require.resolve('querystring-es3'),
      stream: require.resolve('stream-browserify'),
      string_decoder: require.resolve('string_decoder'),
      sys: require.resolve('util'),
      timers: require.resolve('timers-browserify'),
      tty: require.resolve('tty-browserify'),
      url: require.resolve('url'),
      util: require.resolve('util'),
      vm: require.resolve('vm-browserify'),
      zlib: require.resolve('browserify-zlib'),
    },
  },
};
console.log(module.exports);

//npm i console-browserify constants-browserify crypto-browserify domain-browser stream-http https-browserify https-browserify path-browserify querystring-es3 stream-browserify util timers-browserify tty-browserify vm-browserify browserify-zlib