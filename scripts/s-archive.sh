#!/bin/sh

[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }

OUT_DIR=target/bin

[ -e $OUT_DIR ] || mkdir -p $OUT_DIR

TAR_FILE=$OUT_DIR/comments-linux-standalone-x64.tar.gz

TAR_ARGS='target/hprotostuffdb-rjre target/jre/*/'
[ "$1" != "" ] && TAR_ARGS=$1

echo "========== tar.gz"
rm -f $TAR_FILE
echo '#!/bin/sh' > start.sh && tail --lines=+4 scripts/s-start.sh >> start.sh && chmod +x start.sh && \
    tar -cvzf $TAR_FILE start.sh $TAR_ARGS -T scripts/files.txt
rm start.sh
