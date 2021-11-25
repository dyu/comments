#!/bin/sh

BASE_DIR=$PWD
UNAME=`uname`
WIN_SUFFIX=""
[ "$UNAME" != "Linux" ] && [ "$UNAME" != "Darwin" ] && WIN_SUFFIX='.exe'
TARGET_BIN="target/protostuffdb$WIN_SUFFIX"

#if [ "$1" != "" ] && [ -e "/opt/protostuffdb/bin/$1" ]; then
#    BIN=/opt/protostuffdb/bin/$1
if [ -e target/protostuffdb-rjre ]; then
    BIN=$BASE_DIR/target/protostuffdb-rjre
elif [ -e "$TARGET_BIN" ]; then
    BIN=$BASE_DIR/$TARGET_BIN
else
    echo "The $TARGET_BIN binary must exist" && exit 1
fi

DATA_DIR=target/data/main
JAR=comments-all/target/comments-all-jarjar.jar
ARGS=$(cat ARGS.txt)
PORT=$(cat PORT.txt)
BIND_IP='*'
[ "$UNAME" != "Linux" ] && BIND_IP='127.0.0.1'

jarjar() {
  cd comments-all
  rm -f target/*.jar
  mvn -o -Pjwd -Djwd=compile -Dmaven.javadoc.skip=true compile
  cd - > /dev/null
}

case "$1" in
    0)
    # recompile and skip run
    rm -f $JAR
    jarjar
    exit 0
    ;;

    1)
    # recompile
    rm -f $JAR
    ;;

    *)
    # regenerate and recompile module
    [ "$1" != "" ] && [ -e "modules/$1" ] && \
        ./modules/codegen.sh $1 && \
        cd modules/$1 && \
        mvn -o -Dmaven.javadoc.skip=true install && \
        cd - > /dev/null && \
        rm -f $JAR
    ;;
esac

[ -e $JAR ] || jarjar

mkdir -p $DATA_DIR

if [ -n "$WIN_SUFFIX" ]; then
[ -e target/jre/bin/server ] || { echo 'Missing windows jre: target/jre'; exit 1; }
cd target/jre/bin/server
fi

$BIN $BIND_IP:$PORT $BASE_DIR/comments-ts/g/user/UserServices.json $ARGS -Djava.class.path=$BASE_DIR/$JAR comments.all.Main $BASE_DIR

