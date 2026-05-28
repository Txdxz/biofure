# 百诺未来业务管理系统 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Next.js 14 + Prisma + SQLite + shadcn/ui 搭建百诺未来业务管理系统，首批覆盖客户、产品、价格、销售四个模块联动 + 合同轻量版 + 仪表盘。

**Architecture:** Next.js 14 App Router 全栈应用，Server Actions 处理数据变更，Prisma ORM 操作 SQLite 数据库，shadcn/ui 组件渲染界面。左侧固定侧边栏导航 + 右侧主内容区布局。开发期 SQLite 本地文件，上线期切 Supabase PostgreSQL。

**Tech Stack:** Next.js 14, TypeScript, Prisma, SQLite, shadcn/ui, Tailwind CSS, Server Actions

---

## 文件结构总览

```
biofure/
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── components.json                    # shadcn/ui 配置
├── prisma/
│   └── schema.prisma                  # 11 张表定义
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx                 # 根布局（侧边栏 + 主内容区）
│   │   ├── page.tsx                   # 仪表盘首页
│   │   ├── customers/
│   │   │   ├── page.tsx               # 客户列表页
│   │   │   └── [id]/
│   │   │       └── page.tsx           # 客户详情页
│   │   ├── products/
│   │   │   ├── page.tsx               # 产品列表页
│   │   │   └── [id]/
│   │   │       └── page.tsx           # 产品详情页（含批次）
│   │   ├── pricing/
│   │   │   └── page.tsx               # 价格管理页（采购价+出货价）
│   │   ├── sales/
│   │   │   ├── page.tsx               # 销售总览
│   │   │   ├── quotations/
│   │   │   │   ├── page.tsx           # 报价单列表
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # 新建报价单
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # 报价单详情
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx           # 订单列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # 订单详情
│   │   │   └── outbound/
│   │   │       └── page.tsx           # 出库管理
│   │   └── contracts/
│   │       ├── page.tsx               # 合同列表
│   │       └── [id]/
│   │           └── page.tsx           # 合同详情
│   ├── components/
│   │   ├── ui/                        # shadcn/ui 组件（自动生成）
│   │   ├── sidebar.tsx                # 侧边栏导航
│   │   ├── customer-form.tsx          # 客户表单（新增/编辑共用）
│   │   ├── contact-form.tsx           # 联系人表单
│   │   ├── product-form.tsx           # 产品表单
│   │   ├── batch-form.tsx             # 批次表单
│   │   ├── price-form.tsx             # 价格表单
│   │   ├── quotation-form.tsx         # 报价单表单
│   │   ├── order-form.tsx             # 订单表单
│   │   ├── contract-form.tsx          # 合同表单
│   │   └── stats-cards.tsx            # 仪表盘统计卡片
│   └── lib/
│       ├── prisma.ts                  # Prisma 客户端单例
│       └── actions.ts                 # 所有 Server Actions 统一导出
```

---

### Task 0: 项目脚手架

**目标：** 搭建 Next.js 14 项目，配置 Prisma + SQLite + shadcn/ui，确认 `npm run dev` 能看到空白页面。

**创建的文件：** 项目根目录全部脚手架文件

- [ ] **Step 1: 创建 Next.js 项目**

```bash
cd "/Users/guest/工作/claude code/biofure"
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

Expected: 在 biofure 目录下创建 Next.js 14 项目，覆盖已有文件时选择确认。

- [ ] **Step 2: 安装核心依赖**

```bash
npm install prisma @prisma/client
npm install -D ts-node
```

- [ ] **Step 3: 初始化 Prisma（SQLite）**

```bash
npx prisma init --datasource-provider sqlite
```

Expected: 生成 `prisma/schema.prisma` 和 `.env`（含 DATABASE_URL="file:./dev.db"）

- [ ] **Step 4: 初始化 shadcn/ui**

```bash
npx shadcn-ui@latest init
```

交互选项：
- Style: Default
- Base color: Neutral
- CSS variables: Yes
- All other: 默认

- [ ] **Step 5: 安装 shadcn/ui 常用组件**

```bash
npx shadcn-ui@latest add button input table dialog form select card tabs badge label textarea dropdown-menu sheet toast separator
```

- [ ] **Step 6: 清理默认页面，验证空白页面**

```bash
rm -f src/app/page.tsx
echo 'export default function Home() { return <main className="p-8"><h1 className="text-2xl font-bold">百诺未来</h1></main>; }' > src/app/page.tsx
npm run dev
```

Expected: 浏览器打开 `http://localhost:3000` 看到"百诺未来"标题。

---

### Task 1: Prisma 建表（11 张表）

**目标：** 定义完整的数据模型，生成数据库和 Prisma Client。

**修改文件：** `prisma/schema.prisma`

- [ ] **Step 1: 写入完整 schema**

用以下内容替换 `prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ========== 客户模块 ==========

model Customer {
  id                String   @id @default(cuid())
  fullName          String                              // 公司全称
  shortName         String?                             // 简称
  uscc              String?   @unique                   // 统一社会信用代码
  type              String   @default("client")         // supplier | client | both
  industry          String?                             // 制药/检测/CRO/高校/医院
  level             String   @default("B")              // A | B | C
  source            String?                             // 展会/网络/介绍/主动联系
  status            String   @default("active")         // active | dormant | blacklisted
  bankAccount       String?                             // 银行账户信息
  address           String?                             // 地址
  remark            String?                             // 备注
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  contacts          Contact[]
  purchasePrices    PurchasePrice[]
  sellPrices        SellPrice[]
  quotations        Quotation[]
  orders            Order[]
  contracts         Contract[]
  batches           Batch[]
}

model Contact {
  id            String   @id @default(cuid())
  customerId    String
  name          String                                 // 姓名
  phone         String?                                // 电话
  wechat        String?                                // 微信
  email         String?                                // 邮箱
  position      String?                                // 职务
  isPrimary     Boolean  @default(false)               // 主要联系人
  customer      Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
}

// ========== 产品模块 ==========

model Product {
  id              String   @id @default(cuid())
  name            String                               // 产品名称（中文）
  nameEn          String?                              // 产品英文名
  category        String?                              // 分类：标准品/试剂/色谱柱/耗材/血清
  brand           String?                              // 品牌
  specification   String?                              // 规格/货号
  unit            String   @default("支")               // 单位
  storageCondition String?                             // 储存条件
  safetyStock     Int      @default(0)                 // 安全库存阈值
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  batches         Batch[]
  productFiles    ProductFile[]
  purchasePrices  PurchasePrice[]
  sellPrices      SellPrice[]
  quotationItems  QuotationItem[]
  orderItems      OrderItem[]
}

model Batch {
  id            String   @id @default(cuid())
  productId     String
  batchNumber   String                                // 批号（行业刚需）
  productionDate DateTime?                            // 生产日期
  expiryDate    DateTime                              // 有效期
  quantity      Int      @default(0)                  // 当前库存量
  supplierId    String?                               // 供应商
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  supplier      Customer? @relation(fields: [supplierId], references: [id])
  orderItems    OrderItem[]
}

model ProductFile {
  id          String   @id @default(cuid())
  productId   String
  fileType    String                                // COA | MSDS | 说明书
  filePath    String                                // 文件路径
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

// ========== 价格模块 ==========

model PurchasePrice {
  id            String   @id @default(cuid())
  productId     String
  supplierId    String
  price         Float                                 // 单价
  currency      String   @default("CNY")              // 币种
  validFrom     DateTime @default(now())
  validTo       DateTime?                             // 价格有效期
  isDefault     Boolean  @default(false)              // 是否默认供应商
  history       String?                               // 价格变更记录（JSON 字符串）
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  supplier      Customer @relation(fields: [supplierId], references: [id], onDelete: Cascade)
}

model SellPrice {
  id          String   @id @default(cuid())
  productId   String
  customerId  String?                                 // 为空 = 标准价，适用所有未设特殊价的客户
  price       Float
  history     String?                                 // 价格变更记录（JSON 字符串）
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  customer    Customer? @relation(fields: [customerId], references: [id])
}

// ========== 销售模块 ==========

model Quotation {
  id          String   @id @default(cuid())
  customerId  String
  date        DateTime @default(now())
  validTo     DateTime                                // 报价有效期
  status      String   @default("draft")              // draft | sent | confirmed | expired | converted
  totalAmount Float    @default(0)
  remark      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  customer    Customer @relation(fields: [customerId], references: [id])
  items       QuotationItem[]
  orders      Order[]
}

model QuotationItem {
  id          String    @id @default(cuid())
  quotationId String
  productId   String
  quantity    Int                                      // 数量
  unitPrice   Float                                    // 单价
  subtotal    Float                                    // 小计
  quotation   Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id])
}

model Order {
  id              String   @id @default(cuid())
  customerId      String
  quotationId     String?                              // 关联报价单
  contractId      String?                              // 关联合同
  date            DateTime @default(now())
  status          String   @default("pending")         // pending | confirmed | shipped | completed | cancelled
  totalAmount     Float    @default(0)
  receivableAmount Float   @default(0)                 // 应收金额
  receivedAmount  Float    @default(0)                 // 已收金额
  paymentMethod   String?                              // 付款方式
  paymentTerms    String?                              // 付款条件描述
  deliveryTerms   String?                              // 发货条件
  receivedDate    DateTime?                            // 回款日期
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  customer        Customer @relation(fields: [customerId], references: [id])
  quotation       Quotation? @relation(fields: [quotationId], references: [id])
  contract        Contract? @relation(fields: [contractId], references: [id])
  items           OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  batchId   String?                                    // 出库批次
  quantity  Int
  unitPrice Float
  taxRate   Float   @default(13.0)                     // 税率，默认 13%
  subtotal  Float
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
  batch     Batch?  @relation(fields: [batchId], references: [id])
}

// ========== 合同模块 ==========

model Contract {
  id           String   @id @default(cuid())
  contractNo   String                                 // 合同编号
  type         String   @default("sales")             // sales | purchase
  customerId   String
  signDate     DateTime @default(now())
  startDate    DateTime?
  endDate      DateTime?                              // 到期日期
  totalAmount  Float    @default(0)
  status       String   @default("active")            // active | completed | terminated | renewed
  filePath     String?                                // 附件路径
  remark       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  customer     Customer @relation(fields: [customerId], references: [id])
  orders       Order[]
}
```

- [ ] **Step 2: 生成 Prisma Client 并创建数据库**

```bash
npx prisma db push
npx prisma generate
```

Expected: 项目根目录出现 `prisma/dev.db` 文件，`node_modules/.prisma/client` 生成。

- [ ] **Step 3: 创建 Prisma Client 单例**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: 安装 Prisma Studio 辅助验证**

```bash
npx prisma studio
```

Expected: 浏览器打开 `http://localhost:5555` 看到空表列表，确认 11 张表都存在。

- [ ] **Step 5: 关闭 Prisma Studio，验证 `npm run dev` 仍正常**

```bash
npm run dev
```

Expected: `http://localhost:3000` 正常显示。

---

### Task 2: 客户列表 + 新增

**目标：** 客户列表页——表格展示、搜索、筛选、新增客户对话框。

**创建文件：** `src/app/customers/page.tsx`, `src/components/customer-form.tsx`, `src/lib/actions.ts`（初始版）
**修改文件：** `src/app/layout.tsx`, `src/components/sidebar.tsx`

- [ ] **Step 1: 创建侧边栏组件**

```typescript
// src/components/sidebar.tsx
import Link from "next/link";
import { Package, ShoppingCart, Users, FileText, DollarSign, ClipboardList } from "lucide-react";

const navItems = [
  { href: "/", label: "仪表盘", icon: ClipboardList },
  { href: "/customers", label: "客户管理", icon: Users },
  { href: "/products", label: "产品管理", icon: Package },
  { href: "/pricing", label: "价格管理", icon: DollarSign },
  { href: "/sales", label: "销售管理", icon: ShoppingCart },
  { href: "/contracts", label: "合同管理", icon: FileText },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen border-r bg-gray-50 p-4">
      <h1 className="text-lg font-bold mb-6">百诺未来</h1>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: 修改根布局，引入侧边栏**

用以下内容替换 `src/app/layout.tsx`：

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "百诺未来业务管理系统",
  description: "Biofure Business Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 创建初始 Server Actions**

```typescript
// src/lib/actions.ts
"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";

// ---- 客户 ----
export async function getCustomers(search?: string, type?: string, level?: string) {
  const where: any = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { shortName: { contains: search } },
    ];
  }
  if (type) where.type = type;
  if (level) where.level = level;
  return prisma.customer.findMany({
    where,
    include: { contacts: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      contacts: true,
      purchasePrices: { include: { product: true } },
      sellPrices: { include: { product: true } },
      quotations: true,
      orders: true,
      contracts: true,
    },
  });
}

export async function createCustomer(data: {
  fullName: string;
  shortName?: string;
  uscc?: string;
  type: string;
  industry?: string;
  level?: string;
  source?: string;
  status?: string;
  bankAccount?: string;
  address?: string;
  remark?: string;
}) {
  const customer = await prisma.customer.create({ data });
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, data: Record<string, any>) {
  const customer = await prisma.customer.update({ where: { id }, data });
  revalidatePath("/customers");
  return customer;
}

// ---- 联系人 ----
export async function createContact(data: {
  customerId: string;
  name: string;
  phone?: string;
  wechat?: string;
  email?: string;
  position?: string;
  isPrimary?: boolean;
}) {
  const contact = await prisma.contact.create({ data });
  revalidatePath(`/customers/${data.customerId}`);
  return contact;
}

export async function updateContact(id: string, data: Record<string, any>) {
  const contact = await prisma.contact.update({ where: { id }, data });
  revalidatePath(`/customers/${contact.customerId}`);
  return contact;
}
```

- [ ] **Step 4: 创建客户表单组件**

```typescript
// src/components/customer-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createCustomer, updateCustomer } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  defaultValues?: any;
  onSuccess?: () => void;
}

export default function CustomerForm({ defaultValues, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = Object.fromEntries(formData.entries());
    try {
      if (defaultValues?.id) {
        await updateCustomer(defaultValues.id, data);
        toast({ title: "客户已更新" });
      } else {
        await createCustomer(data as any);
        toast({ title: "客户已创建" });
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{defaultValues ? "编辑" : "新增客户"}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "编辑客户" : "新增客户"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>公司全称 *</Label>
              <Input name="fullName" defaultValue={defaultValues?.fullName} required />
            </div>
            <div>
              <Label>简称</Label>
              <Input name="shortName" defaultValue={defaultValues?.shortName} />
            </div>
            <div>
              <Label>统一社会信用代码</Label>
              <Input name="uscc" defaultValue={defaultValues?.uscc} />
            </div>
            <div>
              <Label>类型 *</Label>
              <Select name="type" defaultValue={defaultValues?.type || "client"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">下游客户</SelectItem>
                  <SelectItem value="supplier">供应商</SelectItem>
                  <SelectItem value="both">两者都是</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>行业</Label>
              <Select name="industry" defaultValue={defaultValues?.industry}>
                <SelectTrigger><SelectValue placeholder="选择行业" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="制药">制药</SelectItem>
                  <SelectItem value="检测">检测</SelectItem>
                  <SelectItem value="CRO">CRO</SelectItem>
                  <SelectItem value="高校">高校</SelectItem>
                  <SelectItem value="医院">医院</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>分级</Label>
              <Select name="level" defaultValue={defaultValues?.level || "B"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>来源</Label>
              <Select name="source" defaultValue={defaultValues?.source}>
                <SelectTrigger><SelectValue placeholder="选择来源" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="展会">展会</SelectItem>
                  <SelectItem value="网络">网络</SelectItem>
                  <SelectItem value="介绍">介绍</SelectItem>
                  <SelectItem value="主动联系">主动联系</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>状态</Label>
              <Select name="status" defaultValue={defaultValues?.status || "active"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="dormant">休眠</SelectItem>
                  <SelectItem value="blacklisted">黑名单</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>银行账户</Label>
              <Input name="bankAccount" defaultValue={defaultValues?.bankAccount} />
            </div>
            <div className="col-span-2">
              <Label>地址</Label>
              <Input name="address" defaultValue={defaultValues?.address} />
            </div>
            <div className="col-span-2">
              <Label>备注</Label>
              <Textarea name="remark" defaultValue={defaultValues?.remark} />
            </div>
          </div>
          <Button type="submit" className="w-full">保存</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: 创建客户列表页**

```typescript
// src/app/customers/page.tsx
import { getCustomers } from "@/lib/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerForm from "@/components/customer-form";
import Link from "next/link";

const typeMap: Record<string, string> = { client: "客户", supplier: "供应商", both: "两者" };
const levelColors: Record<string, string> = { A: "bg-green-100", B: "bg-blue-100", C: "bg-gray-100" };

export default async function CustomersPage({ searchParams }: { searchParams: any }) {
  const search = searchParams?.search || "";
  const type = searchParams?.type || "";
  const level = searchParams?.level || "";
  const customers = await getCustomers(search, type, level);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">客户管理</h2>
        <CustomerForm />
      </div>

      <div className="flex gap-4">
        <form className="flex gap-4 flex-1">
          <Input name="search" placeholder="搜索公司名称..." defaultValue={search} className="max-w-xs" />
          <Select name="type" defaultValue={type}>
            <SelectTrigger className="w-32"><SelectValue placeholder="类型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="client">下游客户</SelectItem>
              <SelectItem value="supplier">供应商</SelectItem>
              <SelectItem value="both">两者都是</SelectItem>
            </SelectContent>
          </Select>
          <Select name="level" defaultValue={level}>
            <SelectTrigger className="w-32"><SelectValue placeholder="分级" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
          <button type="submit" className="px-4 py-2 border rounded-md hover:bg-gray-50">搜索</button>
        </form>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>公司全称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>行业</TableHead>
            <TableHead>分级</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>来源</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline font-medium">
                  {c.fullName}
                </Link>
              </TableCell>
              <TableCell><Badge variant="outline">{typeMap[c.type] || c.type}</Badge></TableCell>
              <TableCell>{c.industry || "-"}</TableCell>
              <TableCell><span className={`px-2 py-0.5 rounded text-xs ${levelColors[c.level]}`}>{c.level}</span></TableCell>
              <TableCell>{c.status === "active" ? "活跃" : c.status === "dormant" ? "休眠" : "黑名单"}</TableCell>
              <TableCell>{c.source || "-"}</TableCell>
            </TableRow>
          ))}
          {customers.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-gray-400">暂无数据</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 6: 验证客户列表页**

```bash
npm run dev
```

Expected: 访问 `http://localhost:3000/customers`，看到空表 + "新增客户"按钮。点击新增客户，填写表单，提交成功后在列表中看到新记录。

---

### Task 3: 客户详情 + 联系人管理

**目标：** 点击客户行进入详情页，展示客户信息、联系人列表、关联的报价/订单/合同 Tab。

**创建文件：** `src/app/customers/[id]/page.tsx`, `src/components/contact-form.tsx`

- [ ] **Step 1: 创建联系人表单组件**

```typescript
// src/components/contact-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { createContact, updateContact } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  customerId: string;
  defaultValues?: any;
  onSuccess?: () => void;
}

export default function ContactForm({ customerId, defaultValues, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = { ...Object.fromEntries(formData.entries()), customerId };
    data.isPrimary = formData.get("isPrimary") === "on";
    try {
      if (defaultValues?.id) {
        await updateContact(defaultValues.id, data);
        toast({ title: "联系人已更新" });
      } else {
        await createContact(data as any);
        toast({ title: "联系人已添加" });
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{defaultValues ? "编辑" : "添加联系人"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{defaultValues ? "编辑联系人" : "添加联系人"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>姓名 *</Label>
              <Input name="name" defaultValue={defaultValues?.name} required />
            </div>
            <div>
              <Label>职务</Label>
              <Input name="position" defaultValue={defaultValues?.position} />
            </div>
            <div>
              <Label>电话</Label>
              <Input name="phone" defaultValue={defaultValues?.phone} />
            </div>
            <div>
              <Label>微信</Label>
              <Input name="wechat" defaultValue={defaultValues?.wechat} />
            </div>
            <div className="col-span-2">
              <Label>邮箱</Label>
              <Input name="email" type="email" defaultValue={defaultValues?.email} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox id="isPrimary" name="isPrimary" defaultChecked={defaultValues?.isPrimary} />
              <Label htmlFor="isPrimary">设为主要联系人</Label>
            </div>
          </div>
          <Button type="submit" className="w-full">保存</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 创建客户详情页**

```typescript
// src/app/customers/[id]/page.tsx
import { getCustomer } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ContactForm from "@/components/contact-form";
import CustomerForm from "@/components/customer-form";
import Link from "next/link";

const typeMap: Record<string, string> = { client: "客户", supplier: "供应商", both: "两者" };
const statusMap: Record<string, string> = { active: "活跃", dormant: "休眠", blacklisted: "黑名单" };

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/customers" className="text-sm text-gray-500 hover:underline">← 返回客户列表</Link>
          <h2 className="text-2xl font-bold">{customer.fullName}</h2>
        </div>
        <CustomerForm defaultValues={customer} />
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="contacts">联系人 ({customer.contacts.length})</TabsTrigger>
          <TabsTrigger value="orders">订单 ({customer.orders.length})</TabsTrigger>
          <TabsTrigger value="quotations">报价 ({customer.quotations.length})</TabsTrigger>
          <TabsTrigger value="contracts">合同 ({customer.contracts.length})</TabsTrigger>
          <TabsTrigger value="pricing">价格</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6">
              <div><span className="text-gray-500">简称：</span>{customer.shortName || "-"}</div>
              <div><span className="text-gray-500">统一社会信用代码：</span>{customer.uscc || "-"}</div>
              <div><span className="text-gray-500">类型：</span>{typeMap[customer.type]}</div>
              <div><span className="text-gray-500">行业：</span>{customer.industry || "-"}</div>
              <div><span className="text-gray-500">分级：</span>{customer.level}</div>
              <div><span className="text-gray-500">状态：</span>{statusMap[customer.status]}</div>
              <div><span className="text-gray-500">来源：</span>{customer.source || "-"}</div>
              <div className="col-span-2"><span className="text-gray-500">地址：</span>{customer.address || "-"}</div>
              <div className="col-span-2"><span className="text-gray-500">银行账户：</span>{customer.bankAccount || "-"}</div>
              <div className="col-span-2"><span className="text-gray-500">备注：</span>{customer.remark || "-"}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="mb-4">
            <ContactForm customerId={customer.id} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>职务</TableHead>
                <TableHead>电话</TableHead>
                <TableHead>微信</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>主要联系人</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.position || "-"}</TableCell>
                  <TableCell>{c.phone || "-"}</TableCell>
                  <TableCell>{c.wechat || "-"}</TableCell>
                  <TableCell>{c.email || "-"}</TableCell>
                  <TableCell>{c.isPrimary ? "是" : ""}</TableCell>
                </TableRow>
              ))}
              {customer.contacts.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-400">暂无联系人</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="orders">
          <Table>
            <TableHeader>
              <TableRow><TableHead>日期</TableHead><TableHead>总金额</TableHead><TableHead>状态</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell><Link href={`/sales/orders/${o.id}`} className="text-blue-600 hover:underline">{new Date(o.date).toLocaleDateString("zh-CN")}</Link></TableCell>
                  <TableCell>¥{o.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{o.status}</TableCell>
                </TableRow>
              ))}
              {customer.orders.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-gray-400">暂无订单</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="quotations">
          <Table>
            <TableHeader>
              <TableRow><TableHead>日期</TableHead><TableHead>总金额</TableHead><TableHead>状态</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {customer.quotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell><Link href={`/sales/quotations/${q.id}`} className="text-blue-600 hover:underline">{new Date(q.date).toLocaleDateString("zh-CN")}</Link></TableCell>
                  <TableCell>¥{q.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{q.status}</TableCell>
                </TableRow>
              ))}
              {customer.quotations.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-gray-400">暂无报价</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="contracts">
          <Table>
            <TableHeader>
              <TableRow><TableHead>合同编号</TableHead><TableHead>类型</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {customer.contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Link href={`/contracts/${c.id}`} className="text-blue-600 hover:underline">{c.contractNo}</Link></TableCell>
                  <TableCell>{c.type === "sales" ? "销售合同" : "采购合同"}</TableCell>
                  <TableCell>¥{c.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{c.status}</TableCell>
                </TableRow>
              ))}
              {customer.contracts.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-gray-400">暂无合同</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="pricing">
          <h3 className="font-semibold mb-2">出货价（卖价）</h3>
          <Table>
            <TableHeader><TableRow><TableHead>产品</TableHead><TableHead>单价</TableHead></TableRow></TableHeader>
            <TableBody>
              {customer.sellPrices.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell>{sp.product.name}</TableCell>
                  <TableCell>¥{sp.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {customer.sellPrices.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-gray-400">暂无出货价</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <h3 className="font-semibold mt-6 mb-2">采购价（买价）</h3>
          <Table>
            <TableHeader><TableRow><TableHead>产品</TableHead><TableHead>单价</TableHead></TableRow></TableHeader>
            <TableBody>
              {customer.purchasePrices.map((pp) => (
                <TableRow key={pp.id}>
                  <TableCell>{pp.product.name}</TableCell>
                  <TableCell>¥{pp.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {customer.purchasePrices.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-gray-400">暂无采购价</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: 验证客户详情页**

```bash
npm run dev
```

Expected: 点击客户名进入详情，看到 6 个 Tab（基本信息/联系人/订单/报价/合同/价格）。能添加联系人。

---

### Task 4: 产品列表 + 批次管理

**目标：** 产品列表页（表格+新增+搜索），产品详情页含批次列表和批次新增。

**创建文件：** `src/app/products/page.tsx`, `src/app/products/[id]/page.tsx`, `src/components/product-form.tsx`, `src/components/batch-form.tsx`
**修改文件：** `src/lib/actions.ts`

- [ ] **Step 1: 在 actions.ts 中添加产品相关 Server Actions**

```typescript
// ---- 产品 ----
export async function getProducts(search?: string, category?: string) {
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nameEn: { contains: search } },
      { specification: { contains: search } },
    ];
  }
  if (category) where.category = category;
  return prisma.product.findMany({
    include: { batches: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      batches: { include: { supplier: true } },
      productFiles: true,
      purchasePrices: { include: { supplier: true } },
      sellPrices: { include: { customer: true } },
    },
  });
}

export async function createProduct(data: {
  name: string;
  nameEn?: string;
  category?: string;
  brand?: string;
  specification?: string;
  unit?: string;
  storageCondition?: string;
  safetyStock?: number;
}) {
  const product = await prisma.product.create({ data });
  revalidatePath("/products");
  return product;
}

// ---- 批次 ----
export async function createBatch(data: {
  productId: string;
  batchNumber: string;
  productionDate?: string;
  expiryDate: string;
  quantity?: number;
  supplierId?: string;
}) {
  const batch = await prisma.batch.create({
    data: {
      ...data,
      productionDate: data.productionDate ? new Date(data.productionDate) : undefined,
      expiryDate: new Date(data.expiryDate),
    },
  });
  revalidatePath(`/products/${data.productId}`);
  return batch;
}
```

- [ ] **Step 2: 创建产品表单组件**

`src/components/product-form.tsx` — 对话框表单，包含产品名字段：名称（中英文）、分类、品牌、规格/货号、单位、储存条件、安全库存阈值。结构和 `customer-form.tsx` 类似，用 Dialog + Form。

- [ ] **Step 3: 创建批次表单组件**

`src/components/batch-form.tsx` — 对话框表单，字段：批号（必填）、生产日期、有效期（必填）、数量、供应商。

- [ ] **Step 4: 创建产品列表页**

`src/app/products/page.tsx` — 表格展示产品列表（名称、分类、品牌、规格、单位、当前库存=所有批次量之和），搜索框，分类筛选下拉，新增产品按钮。

- [ ] **Step 5: 创建产品详情页**

`src/app/products/[id]/page.tsx` — 产品基本信息卡片 + 批次列表（表格：批号、生产日期、有效期、库存量、供应商）+ 新增批次按钮。

- [ ] **Step 6: 验证产品管理**

```bash
npm run dev
```

Expected: 访问产品列表，新增产品，进入详情，新增批次。

---

### Task 5: 采购价 + 出货价管理

**目标：** 统一价格管理页面，两个 Tab——采购价列表和出货价列表，支持新增和查看历史。

**创建文件：** `src/app/pricing/page.tsx`, `src/components/price-form.tsx`
**修改文件：** `src/lib/actions.ts`

- [ ] **Step 1: 在 actions.ts 中添加价格相关 Server Actions**

```typescript
// ---- 价格 ----
export async function getPurchasePrices() {
  return prisma.purchasePrice.findMany({
    include: { product: true, supplier: true },
    orderBy: { product: { name: "asc" } },
  });
}

export async function getSellPrices() {
  return prisma.sellPrice.findMany({
    include: { product: true, customer: true },
    orderBy: { product: { name: "asc" } },
  });
}

export async function createPurchasePrice(data: {
  productId: string;
  supplierId: string;
  price: number;
  currency?: string;
  isDefault?: boolean;
}) {
  // 查历史价格
  const existing = await prisma.purchasePrice.findFirst({
    where: { productId: data.productId, supplierId: data.supplierId },
  });
  const history = existing
    ? (existing.history || "") + `\n${new Date().toISOString()}: ${existing.price} -> ${data.price}`
    : "";
  const pp = await prisma.purchasePrice.create({
    data: { ...data, history },
  });
  revalidatePath("/pricing");
  return pp;
}

export async function createSellPrice(data: {
  productId: string;
  customerId?: string;
  price: number;
}) {
  const existing = await prisma.sellPrice.findFirst({
    where: { productId: data.productId, customerId: data.customerId || null },
  });
  const history = existing
    ? (existing.history || "") + `\n${new Date().toISOString()}: ${existing.price} -> ${data.price}`
    : "";
  const sp = await prisma.sellPrice.create({
    data: { ...data, customerId: data.customerId || null, history },
  });
  revalidatePath("/pricing");
  return sp;
}
```

- [ ] **Step 2: 创建价格表单组件**

`src/components/price-form.tsx` — Dialog 表单，根据 `type` prop（purchase/sell）动态切换：选择产品、选择供应商（采购价）/ 选择客户（出货价，留空=标准价）、单价。

- [ ] **Step 3: 创建价格管理页**

`src/app/pricing/page.tsx` — 两个 Tab（采购价 / 出货价），每个 Tab 下是表格（产品名、供应商/客户、单价、币种、是否默认、最近变更时间）+ 新增按钮。

- [ ] **Step 4: 验证价格管理**

```bash
npm run dev
```

Expected: 访问价格管理页，新增采购价和出货价，表格中看到记录。

---

### Task 6: 报价单生成

**目标：** 新建报价单——选客户→选产品→自动带出出货价→填入数量→生成报价。报价单列表页。

**创建文件：** `src/app/sales/quotations/page.tsx`, `src/app/sales/quotations/new/page.tsx`, `src/app/sales/quotations/[id]/page.tsx`, `src/app/sales/page.tsx`
**修改文件：** `src/lib/actions.ts`

- [ ] **Step 1: 在 actions.ts 中添加报价相关 Server Actions**

```typescript
// ---- 报价 ----
export async function getQuotations() {
  return prisma.quotation.findMany({
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuotation(id: string) {
  return prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      orders: true,
    },
  });
}

export async function createQuotation(data: {
  customerId: string;
  validTo: string;
  remark?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}) {
  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const quotation = await prisma.quotation.create({
    data: {
      customerId: data.customerId,
      validTo: new Date(data.validTo),
      remark: data.remark,
      totalAmount,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  });
  revalidatePath("/sales/quotations");
  return quotation;
}

export async function updateQuotationStatus(id: string, status: string) {
  await prisma.quotation.update({ where: { id }, data: { status } });
  revalidatePath(`/sales/quotations/${id}`);
}

export async function getSellPriceForCustomer(productId: string, customerId: string) {
  // 查该客户的特殊价格
  const specialPrice = await prisma.sellPrice.findFirst({
    where: { productId, customerId },
  });
  if (specialPrice) return specialPrice.price;
  // 回退到标准价
  const standardPrice = await prisma.sellPrice.findFirst({
    where: { productId, customerId: null },
  });
  return standardPrice?.price || 0;
}
```

- [ ] **Step 2: 创建销售模块入口页**

`src/app/sales/page.tsx` — 三个统计卡片（本月报价数、本月订单数、待回款金额）+ 快捷入口按钮（新建报价、查看订单、出库管理）。

- [ ] **Step 3: 创建报价单列表页**

`src/app/sales/quotations/page.tsx` — 表格：客户名、日期、总金额、状态（Badge 颜色区分）、操作（查看详情、转为订单按钮）。

- [ ] **Step 4: 创建新建报价单页**

`src/app/sales/quotations/new/page.tsx` — 表单流程：
1. 选择客户（下拉搜索）
2. 添加产品行（每行：选择产品、自动填入出货价、填入数量、自动计算小计）
3. 设置报价有效期
4. 总金额自动累加
5. 提交按钮

- [ ] **Step 5: 创建报价单详情页**

`src/app/sales/quotations/[id]/page.tsx` — 客户信息卡片 + 产品明细表格 + 总金额 + 状态操作按钮（发出、确认、过期、转为订单）。

- [ ] **Step 6: 验证报价流程**

```bash
npm run dev
```

Expected: 新建报价单，选客户→选产品（自动带价）→填数量→提交→在列表看到报价单。

---

### Task 7: 报价转订单

**目标：** 从报价单一键创建订单，订单列表和详情页。

**创建文件：** `src/app/sales/orders/page.tsx`, `src/app/sales/orders/[id]/page.tsx`
**修改文件：** `src/lib/actions.ts`

- [ ] **Step 1: 在 actions.ts 中添加订单相关 Server Actions**

```typescript
// ---- 订单 ----
export async function getOrders() {
  return prisma.order.findMany({
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      quotation: { include: { items: { include: { product: true } } } },
      contract: true,
      items: { include: { product: true, batch: true } },
    },
  });
}

export async function createOrderFromQuotation(quotationId: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });
  if (!quotation) throw new Error("报价单不存在");

  const order = await prisma.order.create({
    data: {
      customerId: quotation.customerId,
      quotationId: quotation.id,
      totalAmount: quotation.totalAmount,
      receivableAmount: quotation.totalAmount,
      items: {
        create: quotation.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          taxRate: 13.0,
        })),
      },
    },
  });

  // 更新报价单状态为"已转订单"
  await prisma.quotation.update({ where: { id: quotationId }, data: { status: "converted" } });

  revalidatePath("/sales/orders");
  return order;
}

export async function updateOrderStatus(id: string, status: string) {
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath(`/sales/orders/${id}`);
}

export async function updateOrder(data: {
  id: string;
  paymentMethod?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  receivedAmount?: number;
  receivedDate?: string;
}) {
  const { id, ...rest } = data;
  const order = await prisma.order.update({
    where: { id },
    data: {
      ...rest,
      receivedDate: rest.receivedDate ? new Date(rest.receivedDate) : undefined,
    },
  });
  revalidatePath(`/sales/orders/${id}`);
  return order;
}
```

- [ ] **Step 2: 创建订单列表页**

`src/app/sales/orders/page.tsx` — 表格：客户名、日期、总金额、应收/已收金额、状态、操作。

- [ ] **Step 3: 创建订单详情页**

`src/app/sales/orders/[id]/page.tsx` — 订单信息 + 来源报价单链接 + 产品明细表格 + 付款信息（付款方式/条件/发货条件/已收金额）+ 状态操作（确认→发货→完成→取消）。

- [ ] **Step 4: 验证报价转订单流程**

```bash
npm run dev
```

Expected: 在报价单详情页点击"转为订单"→跳转到订单详情页→订单列表页看到新订单。

---

### Task 8: 出库 + 库存扣减

**目标：** 订单确认后可以出库，选择批次扣减库存，批次库存量同步更新。

**创建文件：** `src/app/sales/outbound/page.tsx`
**修改文件：** `src/lib/actions.ts`

- [ ] **Step 1: 在 actions.ts 中添加出库 Action**

```typescript
// ---- 出库 ----
export async function outboundOrder(orderId: string, batchAssignments: { orderItemId: string; batchId: string; quantity: number }[]) {
  for (const assignment of batchAssignments) {
    // 更新订单明细的批次
    await prisma.orderItem.update({
      where: { id: assignment.orderItemId },
      data: { batchId: assignment.batchId },
    });
    // 扣减批次库存
    await prisma.batch.update({
      where: { id: assignment.batchId },
      data: { quantity: { decrement: assignment.quantity } },
    });
  }
  // 更新订单状态
  await prisma.order.update({ where: { id: orderId }, data: { status: "shipped" } });
  revalidatePath("/sales/outbound");
  revalidatePath(`/sales/orders/${orderId}`);
}
```

- [ ] **Step 2: 创建出库管理页**

`src/app/sales/outbound/page.tsx` — 列出所有"已确认"状态待出库的订单，每行可展开查看订单明细。每行明细选批次（列出该产品的库存>0的批次）、填数量、点击"确认出库"按钮。出库后订单状态变为"已发货"，批次库存扣减。

- [ ] **Step 3: 验证出库流程**

```bash
npm run dev
```

Expected: 确认一个订单→进入出库页面→为每项产品选择批次→确认出库→订单状态变为"已发货"→产品详情页库存量减少。

---

### Task 9: 合同管理（轻量版）

**目标：** 合同列表、新增合同（基本信息+文件上传）、合同详情、关联订单。

**创建文件：** `src/app/contracts/page.tsx`, `src/app/contracts/[id]/page.tsx`, `src/components/contract-form.tsx`
**修改文件：** `src/lib/actions.ts`

- [ ] **Step 1: 在 actions.ts 中添加合同相关 Server Actions**

```typescript
// ---- 合同 ----
export async function getContracts() {
  return prisma.contract.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContract(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: { customer: true, orders: true },
  });
}

export async function createContract(data: {
  contractNo: string;
  type: string;
  customerId: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  filePath?: string;
  remark?: string;
}) {
  const contract = await prisma.contract.create({
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
  revalidatePath("/contracts");
  return contract;
}

export async function updateContractStatus(id: string, status: string) {
  await prisma.contract.update({ where: { id }, data: { status } });
  revalidatePath(`/contracts/${id}`);
}
```

- [ ] **Step 2: 创建合同表单组件**

`src/components/contract-form.tsx` — Dialog 表单：合同编号（必填）、类型（采购/销售）、客户选择、签订日期、起止日期、总金额、备注。

- [ ] **Step 3: 创建合同列表页**

`src/app/contracts/page.tsx` — 表格：合同编号、类型、客户、日期、金额、状态（Badge：执行中/已完成/已终止/已续签）、操作。

- [ ] **Step 4: 创建合同详情页**

`src/app/contracts/[id]/page.tsx` — 合同基本信息卡片 + 关联订单表格。

- [ ] **Step 5: 验证合同管理**

```bash
npm run dev
```

Expected: 新增合同→列表展示→详情页看到合同信息和关联订单。

---

### Task 10: 首页仪表盘

**目标：** 首页显示 4 个统计卡片 + 最近活动列表。

**修改文件：** `src/app/page.tsx`, `src/lib/actions.ts`

- [ ] **Step 1: 在 actions.ts 中添加统计 Action**

```typescript
// ---- 统计 ----
export async function getDashboardStats() {
  const [customerCount, productCount, pendingOrderCount, pendingReceivable] = await Promise.all([
    prisma.customer.count({ where: { status: "active" } }),
    prisma.product.count(),
    prisma.order.count({ where: { status: { in: ["pending", "confirmed"] } } }),
    prisma.order.aggregate({
      _sum: { receivableAmount: true },
      where: { status: { not: "completed" } },
    }),
  ]);

  const recentOrders = await prisma.order.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const expiringBatches = await prisma.batch.findMany({
    include: { product: true },
    where: {
      expiryDate: {
        lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天内过期
      },
      quantity: { gt: 0 },
    },
    orderBy: { expiryDate: "asc" },
    take: 5,
  });

  return {
    customerCount,
    productCount,
    pendingOrderCount,
    pendingReceivable: pendingReceivable._sum.receivableAmount || 0,
    recentOrders,
    expiringBatches,
  };
}
```

- [ ] **Step 2: 创建仪表盘首页**

替换 `src/app/page.tsx`：

```typescript
import { getDashboardStats } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Package, ClipboardList, DollarSign, AlertTriangle } from "lucide-react";
import Link from "next/link";

const statusMap: Record<string, string> = {
  pending: "待确认", confirmed: "已确认", shipped: "已发货",
  completed: "已完成", cancelled: "已取消",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">仪表盘</h2>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">活跃客户</CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.customerCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">产品总数</CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.productCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">待处理订单</CardTitle>
            <ClipboardList className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.pendingOrderCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">待回款金额</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">¥{stats.pendingReceivable.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>最近订单</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>客户</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell><Link href={`/sales/orders/${o.id}`} className="text-blue-600 hover:underline">{o.customer.fullName}</Link></TableCell>
                    <TableCell>¥{o.totalAmount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{statusMap[o.status] || o.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              效期预警（90天内过期）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>产品</TableHead><TableHead>批号</TableHead><TableHead>有效期</TableHead><TableHead>库存</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {stats.expiringBatches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.product.name}</TableCell>
                    <TableCell>{b.batchNumber}</TableCell>
                    <TableCell className="text-amber-600">{new Date(b.expiryDate).toLocaleDateString("zh-CN")}</TableCell>
                    <TableCell>{b.quantity}</TableCell>
                  </TableRow>
                ))}
                {stats.expiringBatches.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-gray-400">暂无临期产品</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 验证仪表盘**

```bash
npm run dev
```

Expected: 首页显示 4 个统计卡片 + 最近订单表格 + 效期预警表格（可能为空）。

---

## 附录：后续待补清单

Demo 阶段省略、上线前需补的项目：

| 项目 | 说明 |
|------|------|
| 用户登录/权限 | Supabase Auth 接入，角色区分（老板/销售/内勤） |
| 文件上传 | 合同附件、产品 COA/MSDS/说明书 上传 |
| 报表/图表 | 销售趋势图、利润分析、按客户/产品/时间维度汇总 |
| 提醒通知 | 合同到期/效期/应收逾期/安全库存 的系统内提醒 |
| 报价单 PDF 导出 | 生成 PDF 可下载/微信分享 |
| 数据迁移 | SQLite → Supabase PostgreSQL |
| 部署上线 | Vercel 部署 + 域名绑定 |
| 中国访问加速 | 阿里云服务器反向代理（如需） |
