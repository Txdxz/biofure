# 部署教训记录

## 致命错误清单

### 1. prisma/schema.prisma 被部署覆盖
错误：本地是 sqlite，部署覆盖了服务器的 postgresql
解决：自此以后本地 schema 也固定为 postgresql，不再切换

### 2. 配置文件的备份不足
错误：只备份了 .env 和 next.config.mjs，漏了 schema.prisma
解决：schema.prisma 必须与 .env 同步保护

### 3. 不要通过 tar 部署
问题：tar 文件易与服务器文件冲突
替代方案：无更好选择时，确保排除清单完整

### 当前防护规则
- schema.prisma 永远用 postgresql
- .env 本地用 postgresql 连接串
- 部署后自动修复 schema 和 .env
