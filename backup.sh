#!/bin/bash

BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

mkdir -p "$BACKUP_PATH"

docker cp $(docker ps -q --filter "ancestor=dyhs-dev"):/app/database.sqlite "$BACKUP_PATH/"
docker cp $(docker ps -q --filter "ancestor=dyhs-dev"):/app/public/uploads "$BACKUP_PATH/"

cd "$BACKUP_DIR"
tar -czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP"
rm -rf "backup_$TIMESTAMP"
