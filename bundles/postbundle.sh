export BUNDLED=$(pwd)/bundles/$LIBNAME.js
{ echo 'const sync__handlers__package = ()=>{let sync__handlers__exports;'; cat $BUNDLED; } >$BUNDLED.new && mv $BUNDLED{.new,}
echo "return sync__handlers__exports;}"$'\n'"exports.code = sync__handlers__package.toString();"$'\n'"console.log('ok');" >> $BUNDLED;


