#!/bin/sh
[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }
[ -e target/jre ] || { echo 'The target/jre dir is missing.'; exit 1; }

BIN=target/hprotostuffdb-rjre
DATA_DIR=target/data/main
JAR=comments-all/target/comments-all-jarjar.jar
ASSETS=-Dprotostuffdb.assets_dir=comments-ts/
PUBSUB=-Dprotostuffdb.with_pubsub=true
ARGS=$(cat ARGS.txt)
PORT=$(cat PORT.txt)

echo "The app is available at http://127.0.0.1:$PORT"
$BIN $PORT comments-ts/g/user/UserServices.json $ARGS $PUBSUB $ASSETS -Djava.class.path=$JAR comments.all.Main

