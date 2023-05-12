const path = require('path');
const webpack = require("webpack");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const packageJson = require(path.resolve(__dirname,`./node_modules/${process.env.LIBNAME}/package.json`));
let packagePath;
if (packageJson.main){
  packagePath = packageJson.main.slice(-3) === '.js' ? packageJson.main : `${packageJson.main}/index.js`;
} else {
  if (packageJson.exports?.['.'])
  packagePath = packageJson.exports?.['.']?.default ? packageJson.exports?.['.']?.default : packageJson.exports?.['.']?.node;
}

module.exports = {
  entry: path.resolve(__dirname, `./node_modules/${process.env.LIBNAME}`, packagePath),
  output: {
    publicPath: '',
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
      fs: require.resolve("graceful-fs"),
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
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
    new CleanWebpackPlugin({
      protectWebpackAssets: false,
      cleanAfterEveryBuildPatterns: ['*.LICENSE.txt'],
      cleanOnceBeforeBuildPatterns: [], 
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
  }),
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        const mod = resource.request.replace(/^node:/, "");
        switch (mod) {
            case "buffer":
                resource.request = "buffer";
                break;
            case "stream":
                resource.request = "stream-browserify";
                break;
            default:
                throw new Error(`Not found ${mod}`);
        }
    })
  ],
  ignoreWarnings: [/Failed to parse source map/],
};
console.log(module.exports);

// npm i console-browserify constants-browserify crypto-browserify domain-browser stream-http https-browserify https-browserify path-browserify querystring-es3 stream-browserify util timers-browserify tty-browserify vm-browserify browserify-zlib