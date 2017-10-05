To backup the remote master:
```sh
MASTER_IP_PORT=192.168.1.92:5020 ./backup.sh 0 user

# If successful, the last line printed will be the backup name
```

To ensure slaves are connected before doing a backup:
```sh
MASTER_IP_PORT=192.168.1.92:5020 ./backup.sh 2 user
```

To specify a custom backup name:
```sh
BACKUP_NAME=foo MASTER_IP_PORT=192.168.1.92:5020 ./backup.sh 0 user
```

To pull data from the remote master:
```sh
BACKUP_NAME=foo ./rsync-pull.sh 192.168.1.92

# If successful, the pulled data will be in target/data/rsync/user/foo
```
