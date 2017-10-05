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

jarjar() {
  cd ../comments-all
  rm -f target/*.jar
  mvn -o -Pjwd -Djwd=compile -Dmaven.javadoc.skip=true compile
  cd - > /dev/null
}

if [ ! -n "$MASTER_IP_PORT" ]; then
    [ -n "$MASTER_IP" ] || MASTER_IP=127.0.0.1
    [ -n "$MASTER_PORT" ] || MASTER_PORT=$(cat ../PORT.txt)
    
    MASTER_IP_PORT="$MASTER_IP:$MASTER_PORT"
fi

ARGS_TXT=$(cat ../ARGS.txt)

BIN=/opt/protostuffdb/bin/hprotostuffdb-rslave
ARGS="$ARGS_TXT -Dprotostuffdb.with_backup=true -Dprotostuffdb.master=ws://$MASTER_IP_PORT"

DATA_DIR=target/data/main
JAR=../comments-all/target/comments-all-jarjar.jar
PORT=$1

[ -n "$PORT" ] || PORT=$(cat PORT.txt)

[ -e $JAR ] || jarjar

mkdir -p $DATA_DIR

$BIN $PORT ../comments-ts/g/user/UserServices.json $ARGS -Djava.class.path=$JAR comments.all.Main

