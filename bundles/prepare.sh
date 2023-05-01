export LOCALPATH=$(cd ./node_modules/$LIBNAME && cat package.json | grep -o '"main": "[^"]*' | grep -o '[^"]*$')
if [[  $(echo $LOCALPATH | grep -o "." | head -n 1) == '.' ]]; then
  export LOCALPATH="${LOCALPATH:2}"
fi
if ! [[  $(echo $LOCALPATH | tail -c 4) == '.js' ]]; then
  if ! [[  $(echo $LOCALPATH | tail -c 2) == '/' ]]; then
    export LOCALPATH=$LOCALPATH/
  fi
  export LOCALPATH="$LOCALPATH"index.js
fi

export LIBPATH=./node_modules/$LIBNAME/$LOCALPATH;
echo $LIBPATH;
if ! [[ $(cat $LIBPATH | tail -c 42) == "sync__handlers__exports = module.exports;" ]]; then
  echo 'sync__handlers__exports = module.exports;' >> $LIBPATH;
fi