#!/bin/sh
# Ежедневный бэкап MongoDB + офсайт-копия в Яндекс Object Storage.
# Работает в alpine: mongodb-tools и rclone ставятся при старте контейнера
# (~120 МБ вместо образа mongo на ~700 МБ). Ротация: локально и в облаке
# хранится максимум BACKUP_KEEP_DAYS дампов.
set -u

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

  # Ротация локальных дампов
  find "$BACKUP_DIR" -name 'mongo-*.archive.gz' -mtime "+$KEEP_DAYS" -delete

  # Офсайт: rclone sync зеркалит папку (ротация применяется и к облаку)
  if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    echo "[backup] sync → YC:$BACKUP_S3_BUCKET/mongo"
    if rclone sync "$BACKUP_DIR" "YC:$BACKUP_S3_BUCKET/mongo" --transfers 2 --stats-one-line; then
      echo "[backup] sync ok"
    else
      echo "[backup] sync FAILED" >&2
    fi
  fi

  sleep 86400
done
