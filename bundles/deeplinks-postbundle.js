const path = require('path');
const fs = require('fs');

const libName = process.env.LIBNAME;
const bundlePath = path.resolve(__dirname,`../bundles/${libName}.js`);

if (fs.readFileSync(bundlePath, { encoding: 'utf8', flag: 'r' }).slice(-18) !== 'console.log("ok");'){
  let bundle = fs.readFileSync(bundlePath).toString().split('\n');
  bundle.unshift('const sync__handlers__package = ()=>{let sync__handlers__exports;');
  fs.writeFileSync(bundlePath, bundle.join('\n'));
  fs.appendFileSync(bundlePath, 'return sync__handlers__exports;}\nexports.code = sync__handlers__package.toString();\nconsole.log("ok");');
}