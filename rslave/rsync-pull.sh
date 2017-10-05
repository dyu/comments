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

MASTER_IP=$1
[ -n "$MASTER_IP" ] || { echo "1st arg (master ip) is required."; exit 1; }

MASTER_PORT=$2
[ -n "$MASTER_PORT" ] || MASTER_PORT=$(cat ../PORT.txt)

MODULE=user
export MASTER_IP_PORT="$MASTER_IP:$MASTER_PORT"

if [ ! -n "$BACKUP_NAME" ]; then
    # perform backup
    DATE=$(date)
    export BACKUP_NAME=$(date -d "$DATE" +%Y-%m-%d_%H-%M-%S)
    ./backup.sh 0 $MODULE || { echo "Backup failed."; exit 1; }
fi

RSYNC_SRC_DIR=/home/deploy/tmp/rmaster/target/data/main/$MODULE/backup-live/$BACKUP_NAME
RSYNC_DEST_DIR=target/data/rsync/$MODULE
mkdir -p $RSYNC_DEST_DIR

PEM_FILE=$HOME/.ssh/rsync.pem
rsync -Phave "ssh -i $PEM_FILE" rsync@$MASTER_IP:$RSYNC_SRC_DIR $RSYNC_DEST_DIR/ || { echo "Rsync failed."; exit 1; }

[ "$3" != "1" ] && exit 0

# stop server
RUN_PID=$(cat target/run.pid)
[ -n "$RUN_PID" ] && kill -s 0 $RUN_PID 2> /dev/null && kill $RUN_PID && wait $RUN_PID

MAIN_DIR=target/data/main
PREV_DIR=target/data/prev
mkdir -p $MAIN_DIR $PREV_DIR/$MODULE

# move dirs
[ -e $MAIN_DIR/$MODULE ] && mv $MAIN_DIR/$MODULE $PREV_DIR/$MODULE/$BACKUP_NAME
mv $RSYNC_DEST_DIR/$BACKUP_NAME $MAIN_DIR/$MODULE && ./run.sh $MASTER_PORT $4

