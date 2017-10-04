#!/bin/sh

# locate
if [ ! -n "$BASH_SOURCE" ]; then
    SCRIPT_DIR=`dirname "$(readlink -f "$0")"`
else
    F=$BASH_SOURCE
    while [ -h "$F" ]; do
        F="$(readlink "$F")"
    done
    SCRIPT_DIR=`dirname "$F"`
fi

cd $SCRIPT_DIR

# master
head --lines=-7 index.html > rmaster.html && \
printf "        rpc_host: 'http://' + window.location.hostname + ('80' !== window.location.port && ':5020' || ''),\n        post_id: 1\n    }\n    </script><script src=\"/dist/build.js\"></script>\n    <link rel=\"stylesheet\" href=\"/dist/build.css\" />\n  </body>\n</html>\n" >> rmaster.html

# slave
head --lines=-17 index.html > rslave.html && \
printf '    <script>(function(){\n' >> rslave.html && \
cat rslave.js >> rslave.html && \
printf '    uri_w_map = ' >> rslave.html && \
tr -d ' \t\n\r\f' < g/user/w/UserServices.json >> rslave.html && \
printf '\n    appendEl("script", "src", "/dist/build.js")\n    })();</script>\n    <link rel="stylesheet" href="/dist/build.css" />\n  </body>\n</html>\n' >> rslave.html
