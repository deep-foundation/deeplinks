const path = require('path');
const fs = require('fs');

const libName = process.env.LIBNAME;

const packageJson = require(path.resolve(__dirname,`../node_modules/${libName}/package.json`));
let packagePath;
if (packageJson.main){
  packagePath = packageJson.main.slice(-3) === '.js' ? packageJson.main : `${packageJson.main}/index.js`;
} else {
  if (packageJson.exports?.['.'])
  packagePath = packageJson.exports?.['.']?.default ? packageJson.exports?.['.']?.default : packageJson.exports?.['.']?.node;
}

const libPath = path.resolve(__dirname, `../node_modules/${process.env.LIBNAME}`, packagePath);

const libText = fs.readFileSync(libPath, { encoding: 'utf8', flag: 'r' });

if (libText.indexOf('module.exports') !== -1){
  if (libText.slice(-9) !== "//bundled"){
    fs.appendFileSync(libPath, '\nbundles__exports = module.exports; //bundled');
  }
} else {
  import(libPath).then( imported => {
    const allExports = Object.keys(imported);
    console.log({allExports})
    if (libText.slice(-9) !== `//bundled`){
      fs.appendFileSync(libPath, `\nbundles__exports = { ${allExports.join(', ')} }; //bundled`);
    }
  });
}

