import { getCustomer } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerForm from "@/components/customer-form";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const orderStatusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };
const qStatusMap: Record<string, string> = { draft: "草稿", sent: "已发出", confirmed: "已确认", expired: "已过期", converted: "已转订单" };

export default async function CustomerDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { filter?: string; dateFrom?: string; dateTo?: string } }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  const filter = searchParams.filter || "all";
  const dateFrom = searchParams.dateFrom || "";
  const dateTo = searchParams.dateTo || "";

  // 日期范围条件
  const dateFilter: any = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  // 获取订单（含明细和批次价格）
  let orders = await prisma.order.findMany({
    where: { customerId: params.id, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) },
    include: { items: { include: { product: { include: { purchasePrices: true } }, batch: true } } },
    orderBy: { date: "desc" },
  });

  // 获取报价单
  let quotations = await prisma.quotation.findMany({
    where: { customerId: params.id, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) },
    include: { items: { include: { product: true } } },
    orderBy: { date: "desc" },
  });

  // 计算总销售额和总利润
  let totalSales = 0, totalProfit = 0;
  for (const o of orders) {
    totalSales += o.totalAmount;
    for (const item of o.items) {
      const latestPP = (item.product as any).purchasePrices?.[0];
      const cost = latestPP?.price || 0;
      totalProfit += (item.unitPrice - cost) * item.quantity;
    }
  }
  totalProfit = totalProfit / 1.13; // 税后

  // 合并数据
  const rows: any[] = [];
  for (const o of orders) {
    const orderProfit = o.items.reduce((s, i: any) => {
      const pp = (i.product as any).purchasePrices?.[0];
      return s + (i.unitPrice - (pp?.price || 0)) * i.quantity;
    }, 0) / 1.13;
    rows.push({ id: o.id, date: o.date, type: "订单", status: orderStatusMap[o.status] || o.status, amount: o.totalAmount, products: o.items.map((i: any) => i.product.name + ` x${i.quantity}`).join("、"), link: `/sales/orders/${o.id}`, trackingNumber: o.trackingNumber, invoiceNo: o.invoiceNo, profit: orderProfit });
  }
  for (const q of quotations) {
    rows.push({ id: q.id, date: q.date, type: "报价单", status: qStatusMap[q.status] || q.status, amount: q.totalAmount, products: q.items.map((i: any) => i.product.name).join("、"), link: `/sales/quotations/${q.id}`, profit: null });
  }

  if (filter === "报价单") rows.splice(0, rows.length, ...rows.filter(r => r.type === "报价单"));
  else if (filter === "订单") rows.splice(0, rows.length, ...rows.filter(r => r.type === "订单"));
  else if (filter !== "all") rows.splice(0, rows.length, ...rows.filter(r => r.type === "订单" && orderStatusMap[filter]));
  rows.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
          <div><span className="text-gray-500">来源：</span>{customer.source || "-"}</div>
          <div><span className="text-gray-500">销售额：</span><span className="font-bold text-lg">¥{totalSales.toFixed(2)}</span></div>
          <div><span className="text-gray-500">利润（税后）：</span><span className="font-bold text-lg text-green-600">¥{totalProfit.toFixed(2)}</span></div>
        </CardContent>
      </Card>

      <form className="flex gap-2 items-end flex-wrap" method="GET">
        <div><span className="text-xs text-gray-500 block mb-1">开始日期</span><Input name="dateFrom" type="date" className="w-36" defaultValue={dateFrom} /></div>
        <div><span className="text-xs text-gray-500 block mb-1">结束日期</span><Input name="dateTo" type="date" className="w-36" defaultValue={dateTo} /></div>
        <Select name="filter" defaultValue={filter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="筛选" /></SelectTrigger>
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
        <button type="submit" className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 h-8">筛选</button>
        {(dateFrom || dateTo || filter !== "all") && (
          <a href={`/customers/${params.id}`} className="text-xs text-gray-400 hover:underline">清除筛选</a>
        )}
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
              <TableHead className="text-right">利润（税后）</TableHead>
              <TableHead>物流/发票</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{r.date.toLocaleDateString ? r.date.toLocaleDateString("zh-CN") : new Date(r.date).toLocaleDateString("zh-CN")}</TableCell>
                <TableCell><Badge variant={r.type === "订单" ? "default" : "outline"}>{r.type}</Badge></TableCell>
                <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                <TableCell className="text-sm max-w-48 truncate"><Link href={r.link} className="text-blue-600 hover:underline">{r.products}</Link></TableCell>
                <TableCell className="text-right font-medium">¥{r.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right text-green-600 font-medium">{r.profit !== null ? `¥${r.profit.toFixed(2)}` : "-"}</TableCell>
                <TableCell className="text-xs text-gray-500">
                  {r.trackingNumber && <span>物流: {r.trackingNumber}</span>}
                  {r.invoiceNo && <span> | 发票: {r.invoiceNo}</span>}
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
