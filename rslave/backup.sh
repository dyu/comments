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

BIN=/opt/protostuffdb/bin/ws-cli-backup

if [ ! -n "$MASTER_IP_PORT" ]; then
    [ -n "$MASTER_IP" ] || MASTER_IP=127.0.0.1
    [ -n "$MASTER_PORT" ] || MASTER_PORT=$(cat ../PORT.txt)
    
    MASTER_IP_PORT="$MASTER_IP:$MASTER_PORT"
fi

CONNECT_URL="ws://$MASTER_IP_PORT/comments123456781234567812345678"

DATE=$(date)
BACKUP_NAME=$(date -d "$DATE" +%Y-%m-%d_%H-%M-%S)

$BIN $CONNECT_URL $BACKUP_NAME $@
