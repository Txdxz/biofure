#!/bin/bash
# Biofure 一键部署脚本
# 只同步变化的源码，不覆盖服务器配置

SERVER="root@123.57.86.20"
REMOTE_DIR="/root/biofure"

echo "🚀 同步源码到服务器..."

# rsync 同步：排除 node_modules/.next，不覆盖服务器独有配置
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='next.config.mjs' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='prisma/dev.db' \
  --exclude='prisma/dev.db-journal' \
  --exclude='prisma/migrations' \
  --exclude='.DS_Store' \
  --exclude='.obsidian' \
  --exclude='.superpowers' \
  --exclude='*.md' \
  --exclude='*.docx' \
  --exclude='*.xlsx' \
  --exclude='*.base' \
  --exclude='开发英语/' \
  ./ "$SERVER:$REMOTE_DIR/"

if [ $? -ne 0 ]; then
  echo "❌ 同步失败"
  exit 1
fi

echo "✅ 同步完成"
echo "🔨 构建并重启..."
ssh "$SERVER" "cd $REMOTE_DIR && rm -rf .next && npm run build && pm2 restart biofure"

if [ $? -eq 0 ]; then
  echo "✅ 部署成功！访问 http://erp.biofure.com"
else
  echo "❌ 构建或重启失败"
  exit 1
fi
