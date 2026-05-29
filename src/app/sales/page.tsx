import { getQuotations, getOrders } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import InvoiceButton from "./invoice-button";

const statusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };
const qStatusMap: Record<string, string> = { draft: "草稿", sent: "已发出", confirmed: "已确认", expired: "已过期", converted: "已转订单" };

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const quotations = await getQuotations();
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">销售管理</h2>

      <div className="flex gap-4">
        <Link href="/sales/quotations/new" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80">新建报价单</Link>
        <Link href="/sales/outbound" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted">出库管理</Link>
      </div>

      <Card>
        <CardHeader><CardTitle>报价单</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>客户</TableHead><TableHead>日期</TableHead><TableHead>产品</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {quotations.slice(0, 10).map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.customer.fullName}</TableCell>
                  <TableCell>{new Date(q.date).toLocaleDateString("zh-CN")}</TableCell>
                  <TableCell className="text-sm">{q.items.map((i: any) => i.product.name).join("、")}</TableCell>
                  <TableCell>¥{q.totalAmount.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline">{qStatusMap[q.status] || q.status}</Badge></TableCell>
                  <TableCell><Link href={`/sales/quotations/${q.id}`} className="text-blue-600 hover:underline text-sm">查看</Link></TableCell>
                </TableRow>
              ))}
              {quotations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-400">暂无报价</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>订单</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>客户</TableHead><TableHead>日期</TableHead><TableHead>产品</TableHead><TableHead>金额</TableHead><TableHead>应收/已收</TableHead><TableHead>状态</TableHead><TableHead>付款方式</TableHead><TableHead>回款状态</TableHead><TableHead>账期</TableHead><TableHead>出库/物流</TableHead><TableHead>发票</TableHead><TableHead>操作</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 20).map((o) => {
                const today = new Date();
                const endDate = o.paymentDateEnd ? new Date(o.paymentDateEnd) : null;
                const overdue = endDate && today > endDate && o.paymentStatus !== "已回款";
                return (
                <TableRow key={o.id} className={overdue ? "bg-red-50" : ""}>
                  <TableCell className={overdue ? "text-red-700" : ""}>{o.customer.fullName}</TableCell>
                  <TableCell className={overdue ? "text-red-700" : ""}>{new Date(o.date).toLocaleDateString("zh-CN")}</TableCell>
                  <TableCell className={`text-sm max-w-40 truncate ${overdue ? "text-red-700" : ""}`}>{o.items.map((i: any) => i.product.name).join("、")}</TableCell>
                  <TableCell className={overdue ? "text-red-700 font-medium" : ""}>¥{o.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">¥{o.receivedAmount.toFixed(0)} / ¥{o.receivableAmount.toFixed(0)}</TableCell>
                  <TableCell><Badge variant="outline">{statusMap[o.status] || o.status}</Badge></TableCell>
                  <TableCell className="text-sm">{o.paymentMethod || "-"}</TableCell>
                  <TableCell>
                    {o.paymentStatus === "未回款" ? <span className={`${overdue ? "text-red-600 font-medium" : "text-amber-600"}`}>{o.paymentStatus}</span> : <Badge variant="outline">{o.paymentStatus}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {o.paymentDateStart && o.paymentDateEnd ? (
                      <span className={overdue ? "text-red-600" : ""}>{new Date(o.paymentDateStart).toLocaleDateString("zh-CN")}~{new Date(o.paymentDateEnd).toLocaleDateString("zh-CN")}</span>
                    ) : <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {o.status === "shipped" || o.status === "completed" ? (
                      <span>{statusMap[o.status]} {o.trackingNumber ? `| ${o.trackingNumber}` : ""}</span>
                    ) : o.status === "cancelled" ? (
                      <span className="text-gray-400">已取消</span>
                    ) : (
                      <span className="text-gray-400">待出库</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {o.invoiceStatus === "issued" ? (
                      <Badge variant="outline" className="text-xs">{o.invoiceNo}</Badge>
                    ) : (o.status === "shipped" || o.status === "completed") ? (
                      <InvoiceButton orderId={o.id} />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell><Link href={`/sales/orders/${o.id}`} className="text-blue-600 hover:underline text-sm">详情</Link></TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-gray-400">暂无订单</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
