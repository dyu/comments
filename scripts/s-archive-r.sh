#!/bin/sh

[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }

OUT_DIR=target/bin

[ -e $OUT_DIR ] || mkdir -p $OUT_DIR

RMASTER_FILE=$OUT_DIR/comments-linux-master-x64.tar.gz
RSLAVE_FILE=$OUT_DIR/comments-linux-slave-x64.tar.gz

TAR_ARGS='target/jre/*/'
[ "$1" != "" ] && TAR_ARGS=$1

echo "========== tar.gz"
mv comments-ts/index.html /tmp/ || exit 1
cp comments-ts/rmaster.html comments-ts/index.html || exit 1

rm -f $RMASTER_FILE $RSLAVE_FILE

echo '#!/bin/sh' > start.sh && \
    printf 'BIN=target/hprotostuffdb-rmaster-rjre\n' >> start.sh && \
    tail --lines=+6 scripts/s-start.sh >> start.sh && \
    chmod +x start.sh && \
    tar -cvzf $RMASTER_FILE start.sh target/hprotostuffdb-rmaster-rjre $TAR_ARGS -T scripts/files.txt

head --lines=11 comments-ts/rslave.html > comments-ts/index.html && \
    printf '    <script src="master_ip_port.js"></script>\n' >> comments-ts/index.html && \
    tail --lines=+12 comments-ts/rslave.html >> comments-ts/index.html && \
    echo '#!/bin/sh' > start.sh && \
    printf '[ ! -n "$1" ] && echo "1st arg (ip:port of master) is required." && exit 1\necho "window.master_ip_port = \"$1\"" > comments-ts/master_ip_port.js\nBIN=target/hprotostuffdb-rslave-rjre\nARGS_TXT=$(cat ARGS.txt)\nARGS="$ARGS_TXT -Dprotostuffdb.master=ws://$1"\n' >> start.sh && \
    tail --lines=+7 scripts/s-start.sh >> start.sh && \
    chmod +x start.sh && \
    tar -cvzf $RSLAVE_FILE start.sh target/hprotostuffdb-rslave-rjre $TAR_ARGS -T scripts/files.txt

rm -f start.sh comments-ts/master_ip_port.js
mv /tmp/index.html comments-ts/
