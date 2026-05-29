# 百诺未来业务管理系统 (Biofure ERP)

中小型生物试剂分销企业的业务管理平台，覆盖客户管理、产品管理、销售管理、财务管理等核心业务模块。

> 本系统使用 AI 辅助开发（Vibecoding），技术栈 Next.js + PostgreSQL。

---

## 功能概览

| 模块 | 功能 |
|------|------|
| **仪表盘** | 月度营收/利润柱状图、产品分类饼图、客户销售额排名、效期预警、可按年月筛选 |
| **客户管理** | 上下游客户管理、自定义分类、联系人、订单/报价单统一视图、日期筛选 |
| **产品管理** | 产品分类、批次追踪（批号+效期+采购价）、供应商关联、批次到货自动记支出 |
| **销售管理** | 报价单生成及打印导出、订单流转（确认→出库→完成）、分批出库、物流追踪、发票管理 |
| **财务管理** | 收支记录自动关联、发票管理、订单账期/回款状态、逾期变红标记 |
| **用户管理** | 超管/管理员两级权限、超管可创建管理员 |

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 数据库 | PostgreSQL（Prisma ORM） |
| UI | Tailwind CSS + shadcn/ui |
| 部署 | 阿里云 ECS + Nginx + PM2 |

## 本地开发

```bash
git clone https://github.com/Txdxz/biofure.git
cd biofure
npm install

# 配置数据库连接（.env）
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/biofure"' > .env
npx prisma db push

npm run dev
```

## 部署

服务器需要 Node.js 20+、PostgreSQL、Nginx。

```bash
# 安装依赖并构建
npm install && npx prisma generate && npm run build

# PM2 启动
pm2 start npm --name "biofure" -- start
```

## 系统架构

```
用户 → Nginx(80端口) → Next.js(3000端口) → PostgreSQL
```

## 许可证

私有项目 — 百诺未来（北京）生物技术有限公司
