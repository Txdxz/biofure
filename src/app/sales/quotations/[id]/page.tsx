import { getQuotation } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import ConvertToOrderButton from "./convert-button";
import StatusButton from "./status-button";
import DeleteButton from "./delete-button";

const qStatusMap: Record<string, string> = { draft: "草稿", sent: "已发出", confirmed: "已确认", expired: "已过期", converted: "已转订单" };
const orderStatusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };

export default async function QuotationDetailPage({ params }: { params: { id: string } }) {
  const q = await getQuotation(params.id);
  if (!q) notFound();

  const canConvert = q.status === "draft" || q.status === "sent" || q.status === "confirmed";
  const canSend = q.status === "draft";
  const canConfirm = q.status === "sent";

  return (
    <div className="space-y-4">
      <Link href="/sales" className="text-sm text-gray-500 hover:underline">← 返回销售管理</Link>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">报价单详情</h2>
        <div className="flex gap-2">
          {canSend && <StatusButton id={q.id} status="sent" label="发出" />}
          {canConfirm && <StatusButton id={q.id} status="confirmed" label="确认" />}
          {canConvert && <ConvertToOrderButton quotationId={q.id} />}
          <a href={`/sales/quotations/${q.id}/print`} target="_blank" className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted">导出打印</a>
          {q.status !== "converted" && <DeleteButton id={q.id} type="quotation" />}
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div><span className="text-gray-500">客户：</span><Link href={`/customers/${q.customer.id}`} className="text-blue-600 hover:underline">{q.customer.fullName}</Link></div>
          <div><span className="text-gray-500">状态：</span>{qStatusMap[q.status]}</div>
          <div><span className="text-gray-500">日期：</span>{new Date(q.date).toLocaleDateString("zh-CN")}</div>
          <div><span className="text-gray-500">有效期：</span>{new Date(q.validTo).toLocaleDateString("zh-CN")}</div>
          {q.remark && <div className="col-span-2"><span className="text-gray-500">备注：</span>{q.remark}</div>}
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow><TableHead>产品</TableHead><TableHead>数量</TableHead><TableHead>单价</TableHead><TableHead>小计</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {q.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.product.name}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>¥{item.unitPrice.toFixed(2)}</TableCell>
              <TableCell>¥{item.subtotal.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="text-right text-lg font-bold">总计：¥{q.totalAmount.toFixed(2)}</div>

      {q.orders.length > 0 && (
        <div>
          <h3 className="font-semibold mt-4 mb-2">关联订单</h3>
          {q.orders.map((o) => (
            <Link key={o.id} href={`/sales/orders/${o.id}`} className="text-blue-600 hover:underline block">订单 {o.id} - {orderStatusMap[o.status] || o.status}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
