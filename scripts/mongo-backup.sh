#!/bin/sh
# Ежедневный бэкап MongoDB: gzip-архив дампа + ротация старых.
# Запускается сервисом mongo-backup из docker-compose (образ mongo содержит
# mongodump). Первый бэкап — сразу при старте контейнера, далее раз в сутки.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

while true; do
  STAMP="$(date +%Y-%m-%d_%H-%M)"
  FILE="$BACKUP_DIR/mongo-$STAMP.archive.gz"
  echo "[backup] dumping to $FILE"
  if mongodump --uri="$MONGO_URI" --archive --gzip > "$FILE.tmp"; then
    mv "$FILE.tmp" "$FILE"
    echo "[backup] done: $(du -h "$FILE" | cut -f1)"
  else
    rm -f "$FILE.tmp"
    echo "[backup] FAILED" >&2
  fi

  # Ротация: удаляем архивы старше KEEP_DAYS
  find "$BACKUP_DIR" -name 'mongo-*.archive.gz' -mtime "+$KEEP_DAYS" -delete

  sleep 86400
done
