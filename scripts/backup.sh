#!/bin/bash
# Biofure 数据库自动备份脚本
# 每天凌晨 3 点执行，保留 30 天
# 恢复命令：psql -U biofure -h localhost biofure < backup_20250101.sql

BACKUP_DIR="/root/backups"
DB_NAME="biofure"
DB_USER="biofure"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份文件名
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/biofure_$DATE.sql"

# 执行备份
PGPASSWORD=biofure2026 pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$FILE"

# 检查是否成功
if [ $? -eq 0 ]; then
  gzip "$FILE"
  echo "[$(date)] 备份成功: ${FILE}.gz ($(du -h ${FILE}.gz | cut -f1))"
else
  echo "[$(date)] 备份失败"
  rm -f "$FILE"
  exit 1
fi

# 删除超过 30 天的备份
find "$BACKUP_DIR" -name "biofure_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] 已清理 $RETENTION_DAYS 天前的备份"

# 列出当前备份
echo "[$(date)] 当前备份列表:"
ls -lh "$BACKUP_DIR"
