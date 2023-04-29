export LOCALPATH=$(cd ./node_modules/$LIBNAME && cat package.json | grep -o '"main": "[^"]*' | grep -o '[^"]*$')
if [[  $(echo $LOCALPATH | grep -o "." | head -n 1) == '.' ]]; then
  export LOCALPATH="${LOCALPATH:2}"
fi
export LIBPATH=./node_modules/$LIBNAME/$LOCALPATH;
echo $LIBPATH;
if ! [[ $(cat $LIBPATH | tail -c 42) == "sync__handlers__exports = module.exports;" ]]; then
  echo 'sync__handlers__exports = module.exports;' >> $LIBPATH;
fi