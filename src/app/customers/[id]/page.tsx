import { getCustomer } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerForm from "@/components/customer-form";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const orderStatusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };
const qStatusMap: Record<string, string> = { draft: "草稿", sent: "已发出", confirmed: "已确认", expired: "已过期", converted: "已转订单" };

export default async function CustomerDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { filter?: string } }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  const filter = searchParams.filter || "all";

  // 获取订单
  let orders = await prisma.order.findMany({
    where: { customerId: params.id },
    include: { items: { include: { product: true, batch: true } } },
    orderBy: { date: "desc" },
  });

  // 获取报价单
  let quotations = await prisma.quotation.findMany({
    where: { customerId: params.id },
    include: { items: { include: { product: true } } },
    orderBy: { date: "desc" },
  });

  // 合并处理
  type MixedRow = { id: string; date: string; type: "订单" | "报价单"; status: string; amount: number; products: string; link: string; trackingNumber?: string; invoiceStatus?: string; invoiceNo?: string; };
  let rows: MixedRow[] = [];

  rows = rows.concat(orders.map(o => ({
    id: o.id, date: o.date.toISOString(), type: "订单" as const,
    status: orderStatusMap[o.status] || o.status, amount: o.totalAmount,
    products: o.items.map(i => i.product.name + ` x${i.quantity}${i.product.unit}`).join("、"),
    link: `/sales/orders/${o.id}`, trackingNumber: o.trackingNumber || undefined,
    invoiceStatus: o.invoiceStatus || undefined, invoiceNo: o.invoiceNo || undefined,
  })));

  rows = rows.concat(quotations.map(q => ({
    id: q.id, date: q.date.toISOString(), type: "报价单" as const,
    status: qStatusMap[q.status] || q.status, amount: q.totalAmount,
    products: q.items.map(i => i.product.name).join("、"), link: `/sales/quotations/${q.id}`,
  })));

  // 筛选
  if (filter === "报价单") rows = rows.filter(r => r.type === "报价单");
  else if (filter === "订单") rows = rows.filter(r => r.type === "订单");
  else if (filter !== "all") rows = rows.filter(r => r.type === "订单" && r.status === filter);

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/customers" className="text-sm text-gray-500 hover:underline">← 返回客户列表</Link>
          <h2 className="text-2xl font-bold">{customer.fullName}</h2>
        </div>
        <CustomerForm defaultValues={customer} />
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div><span className="text-gray-500">类型：</span>{customer.type === "client" ? "下游客户" : customer.type === "supplier" ? "供应商" : "两者都是"}</div>
          <div><span className="text-gray-500">状态：</span>{customer.status === "active" ? "活跃" : customer.status === "dormant" ? "休眠" : "潜在"}</div>
          <div><span className="text-gray-500">行业：</span>{customer.industry || "-"}</div>
          <div><span className="text-gray-500">分级：</span>{customer.level}</div>
          <div className="col-span-2"><span className="text-gray-500">来源：</span>{customer.source || "-"}</div>
        </CardContent>
      </Card>

      <form className="flex gap-2 items-center" method="GET">
        <Select name="filter" defaultValue={filter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="报价单">报价单</SelectItem>
            <SelectItem value="订单">订单</SelectItem>
            <SelectItem value="待确认">待确认</SelectItem>
            <SelectItem value="已确认">已确认</SelectItem>
            <SelectItem value="已发货">已发货</SelectItem>
            <SelectItem value="已完成">已完成</SelectItem>
            <SelectItem value="已取消">已取消</SelectItem>
          </SelectContent>
        </Select>
        <button type="submit" className="px-3 py-1 border rounded-md text-sm hover:bg-gray-50">筛选</button>
      </form>

      {rows.length === 0 ? (
        <p className="text-gray-400 text-center py-8">暂无订单或报价</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>产品</TableHead>
              <TableHead className="text-right">金额</TableHead>
              <TableHead>物流/发票</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{new Date(r.date).toLocaleDateString("zh-CN")}</TableCell>
                <TableCell><Badge variant={r.type === "订单" ? "default" : "outline"}>{r.type}</Badge></TableCell>
                <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                <TableCell className="text-sm max-w-48 truncate"><Link href={r.link} className="text-blue-600 hover:underline">{r.products}</Link></TableCell>
                <TableCell className="text-right font-medium">¥{r.amount.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-gray-500">
                  {r.trackingNumber && <span>物流: {r.trackingNumber}</span>}
                  {r.invoiceStatus === "issued" && <span> | 发票: {r.invoiceNo}</span>}
                  {!r.trackingNumber && r.type === "订单" && <span>-</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
