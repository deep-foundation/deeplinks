const path = require('path');
const fs = require('fs');

const libName = process.env.LIBNAME;

const packageJson = require(path.resolve(__dirname,`../node_modules/${libName}/package.json`));
const libPath = path.resolve(__dirname, `../node_modules/${process.env.LIBNAME}`, packageJson.main, `${packageJson.main.slice(-3) === '.js' ? '' : 'index.js'}`);

if (fs.readFileSync(libPath, { encoding: 'utf8', flag: 'r' }).slice(-41) !== "sync__handlers__exports = module.exports;"){
  fs.appendFileSync(libPath, 'sync__handlers__exports = module.exports;');
}
