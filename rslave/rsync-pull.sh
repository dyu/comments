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

# perform backup
MODULE=user
DATE=$(date)
export BACKUP_NAME=$(date -d "$DATE" +%Y-%m-%d_%H-%M-%S)
export MASTER_IP_PORT="$MASTER_IP:$MASTER_PORT"
./backup.sh 0 $MODULE || { echo "Backup failed."; exit 1; }

RSYNC_SRC_DIR=/home/deploy/tmp/rmaster/target/data/main/$MODULE/backup-live/$BACKUP_NAME
RSYNC_DEST_DIR=target/data/rsync/$MODULE
mkdir -p $RSYNC_DEST_DIR

PEM_FILE=$HOME/.ssh/rsync.pem
rsync -Phave "ssh -i $PEM_FILE" rsync@$MASTER_IP:$RSYNC_SRC_DIR $RSYNC_DEST_DIR/ || { echo "Rsync failed."; exit 1; }

[ "$3" != "1" ] && exit 0

# restart server


