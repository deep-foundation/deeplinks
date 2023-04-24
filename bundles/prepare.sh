if ! [[ $(cat ./node_modules/jsonschema/lib/index.js | tail -c 42) == "sync__handlers__exports = module.exports;" ]]; then
  echo 'sync__handlers__exports = module.exports;' >> $LIBPATH;
fi