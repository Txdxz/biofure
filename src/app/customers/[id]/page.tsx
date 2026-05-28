import { getCustomer } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContactForm from "@/components/contact-form";
import CustomerForm from "@/components/customer-form";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const typeMap: Record<string, string> = { client: "客户", supplier: "供应商", both: "两者" };
const statusMap: Record<string, string> = { active: "活跃", dormant: "休眠", potential: "潜在" };
const orderStatusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };
const qStatusMap: Record<string, string> = { draft: "草稿", sent: "已发出", confirmed: "已确认", expired: "已过期", converted: "已转订单" };

export default async function CustomerDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { orderStatus?: string } }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  const orderFilter = searchParams.orderStatus || "";

  // 获取该客户的订单（含明细、批次、采购价）
  const orders = await prisma.order.findMany({
    where: {
      customerId: params.id,
      ...(orderFilter && orderFilter !== "all" ? { status: orderFilter } : {}),
    },
    include: {
      items: {
        include: {
          product: { include: { purchasePrices: true } },
          batch: { include: { product: { include: { purchasePrices: true } } } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

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
          <TabsTrigger value="orders">订单 ({orders.length})</TabsTrigger>
          <TabsTrigger value="quotations">报价 ({customer.quotations.length})</TabsTrigger>
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
          <div className="mb-4"><ContactForm customerId={customer.id} /></div>
          <Table>
            <TableHeader><TableRow><TableHead>姓名</TableHead><TableHead>职务</TableHead><TableHead>电话</TableHead><TableHead>微信</TableHead><TableHead>邮箱</TableHead><TableHead>主要联系人</TableHead><TableHead className="w-24">操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {customer.contacts.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell><TableCell>{c.position || "-"}</TableCell><TableCell>{c.phone || "-"}</TableCell><TableCell>{c.wechat || "-"}</TableCell><TableCell>{c.email || "-"}</TableCell><TableCell>{c.isPrimary ? "是" : ""}</TableCell>
                  <TableCell><ContactForm customerId={customer.id} defaultValues={c} /></TableCell>
                </TableRow>
              ))}
              {customer.contacts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-400">暂无联系人</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="orders">
          <form className="mb-4 flex gap-2 items-center" method="GET">
            <Select name="orderStatus" defaultValue={orderFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="状态筛选" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待确认</SelectItem>
                <SelectItem value="confirmed">已确认</SelectItem>
                <SelectItem value="shipped">已发货</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <button type="submit" className="px-3 py-1 border rounded-md text-sm hover:bg-gray-50">筛选</button>
          </form>

          {orders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无订单</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                // 计算每个订单项的利润
                const rows = order.items.map((item: any) => {
                  const pps = (item.product as any).purchasePrices || [];
                  const pp = pps.sort((a: any, b: any) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime())[0];
                  const cost = pp?.price || 0;
                  const profit = (item.unitPrice - cost) * item.quantity;
                  const afterTaxProfit = profit / 1.13; // 13% VAT
                  return { item, cost, profit, afterTaxProfit };
                });

                return (
                  <Card key={order.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4 mb-3 text-sm">
                        <span className="text-gray-500">{new Date(order.date).toLocaleDateString("zh-CN")}</span>
                        {order.contractNo && <span className="font-mono text-gray-500">合同: {order.contractNo}</span>}
                        <Badge variant="outline">{orderStatusMap[order.status] || order.status}</Badge>
                        <span className="font-bold">¥{order.totalAmount.toFixed(2)}</span>
                        {order.trackingNumber && <span className="text-gray-500">物流: {order.trackingNumber}</span>}
                        {order.invoiceStatus === "issued" && <Badge variant="outline" className="text-xs">已开票 {order.invoiceNo}</Badge>}
                        <Link href={`/sales/orders/${order.id}`} className="text-blue-600 hover:underline ml-auto text-xs">详情</Link>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>产品</TableHead>
                            <TableHead>数量</TableHead>
                            <TableHead>单价</TableHead>
                            <TableHead>税率</TableHead>
                            <TableHead>小计</TableHead>
                            <TableHead>出库批次</TableHead>
                            <TableHead>采购成本</TableHead>
                            <TableHead>利润(税前)</TableHead>
                            <TableHead>利润(税后)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((r, i) => (
                            <TableRow key={r.item.id}>
                              <TableCell>{r.item.product.name}</TableCell>
                              <TableCell>{r.item.quantity}{r.item.product.unit}</TableCell>
                              <TableCell>¥{r.item.unitPrice.toFixed(2)}</TableCell>
                              <TableCell>{r.item.taxRate}%</TableCell>
                              <TableCell>¥{r.item.subtotal.toFixed(2)}</TableCell>
                              <TableCell>{r.item.batch?.batchNumber || "-"}</TableCell>
                              <TableCell className="text-gray-500">¥{r.cost.toFixed(2)}</TableCell>
                              <TableCell className="font-medium text-green-600">¥{r.profit.toFixed(2)}</TableCell>
                              <TableCell className="text-sm text-green-600">¥{r.afterTaxProfit.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotations">
          <Table>
            <TableHeader><TableRow><TableHead>日期</TableHead><TableHead>总金额</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
            <TableBody>
              {customer.quotations.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell><Link href={`/sales/quotations/${q.id}`} className="text-blue-600 hover:underline">{new Date(q.date).toLocaleDateString("zh-CN")}</Link></TableCell>
                  <TableCell>¥{q.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{qStatusMap[q.status] || q.status}</TableCell>
                </TableRow>
              ))}
              {customer.quotations.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-400">暂无报价</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
