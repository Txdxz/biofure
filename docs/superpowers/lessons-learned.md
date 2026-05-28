# Biofure 部署教训

## 致命错误

### 1. Mac 到服务器的文件传输不可靠
- `tar + scp` 覆盖整个目录 → 每次覆盖服务器配置（`.env`, `next.config.mjs`）
- `rsync` 路径错误 → 文件散落到项目根目录，tsconfig 的 `**/*.tsx` 编译这些幽灵文件
- `scp` 单个文件 → 括号路径 `[id]` 被 shell 转义，静默失败

**正确做法**：只通过 GitHub 传输代码。Mac 上 `git push`，服务器上 `git pull`。

### 2. 服务器热修 + 本地修改不同步
- 服务器上 sed 修了文件，本地没有
- 本地改了很多文件，服务器只收到一部分
- 两边的文件状态完全不同，谁也说不清哪个是对的

**正确做法**：所有修改只在本地做 → git commit → git push → 服务器 git pull。

### 3. 配置文件不该放在传输包里
- `next.config.mjs` 的 `eslint: { ignoreDuringBuilds: true }` 每次被覆盖
- `.env` 里的数据库连接串被覆盖
- `tailwind.config.ts` 被误删

**正确做法**：配置文件加入 `.gitignore`/rsync exclude，不随源码传输。

### 4. 服务器文件幽灵
- tar/rsync 路径错误导致 `[id]/page.tsx` 直接出现在 `/root/biofure/` 根目录
- tsconfig 的 `**/*.tsx` 会编译根目录和 `src/` 两份文件
- TypeScript 报错的目标是谁，根本搞不清楚

**正确做法**：部署后检查 `find /root/biofure -maxdepth 1 -name "*.tsx"`，清掉散落文件。

### 5. 构建缓存不清干净
- `rm -rf .next` 不够，还有 `node_modules/.cache` 和 TypeScript 的 `*.tsbuildinfo`
- Prisma client 缓存也需要 `npx prisma generate` 刷新

**正确做法**：`rm -rf .next && npx prisma generate && npm run build`

## 部署硬规则

1. **永远不改服务器文件**。所有修改本地完成，git push，服务器 git pull。
2. **git pull 失败 = 停手**。不能 git pull 时不要用 scp/rsync 代替，先把 GitHub 连通。
3. **构建前清缓存**：`rm -rf .next && npm run build`
4. **构建后完整验证**：`curl http://127.0.0.1:3000` 确认返回 200
5. **一个终端，一个目录**：服务器上项目只有一个 `/root/biofure`，不能有嵌套
