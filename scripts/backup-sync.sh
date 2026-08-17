#!/bin/sh
# Офсайт-копия бэкапов Mongo в Яндекс Object Storage (S3) через rclone.
# Конфиг rclone целиком из env (RCLONE_CONFIG_YC_* в docker-compose).
# sync зеркалит локальную папку: ротация 14 дней применяется и к облаку.
set -u

if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
  echo "[backup-sync] BACKUP_S3_BUCKET не задан — офсайт-копирование отключено"
  # Не выходим: restart-политика иначе перезапускала бы контейнер в цикле
  while true; do sleep 3600; done
fi

# Первый прогон — через 10 минут после старта, чтобы дождаться первого дампа
sleep 600

while true; do
  echo "[backup-sync] sync → YC:$BACKUP_S3_BUCKET/mongo"
  if rclone sync /backups "YC:$BACKUP_S3_BUCKET/mongo" --transfers 2 --stats-one-line; then
    echo "[backup-sync] ok: $(rclone size "YC:$BACKUP_S3_BUCKET/mongo" 2>/dev/null | tr '\n' ' ')"
  else
    echo "[backup-sync] FAILED" >&2
  fi
  sleep 86400
done
