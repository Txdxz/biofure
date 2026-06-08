import { getOrder } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import OrderStatusButton from "./status-button";
import DeleteButton from "./delete-button";
import OrderEditForm from "./edit-form";
import AfterSaleSection from "./aftersale";

const statusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  if (!order) notFound();

  return (
    <div className="space-y-4">
      <Link href="/sales" className="text-sm text-gray-500 hover:underline">← 返回销售管理</Link>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">订单详情 {order.contractNo ? `- ${order.contractNo}` : ""}</h2>
        <div className="flex gap-2">
          {order.status === "pending" && <OrderStatusButton id={order.id} status="confirmed" label="确认订单" variant="default" />}
          {order.status === "confirmed" && (
            <Link href={`/sales/outbound?orderId=${order.id}`} className="inline-flex items-center rounded-lg bg-green-600 text-white text-sm font-medium h-8 px-3 hover:bg-green-700">去出库</Link>
          )}
          {order.status === "shipped" && <OrderStatusButton id={order.id} status="completed" label="标记完成" variant="default" />}
          {order.status !== "completed" && order.status !== "cancelled" && <OrderStatusButton id={order.id} status="cancelled" label="取消" variant="outline" />}
          {order.status === "cancelled" && <DeleteButton id={order.id} />}
        </div>
      </div>

      <div className="flex gap-4"><OrderEditForm order={JSON.parse(JSON.stringify(order))} /></div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div><span className="text-gray-500">客户：</span><Link href={`/customers/${order.customer.id}`} className="text-blue-600 hover:underline">{order.customer.fullName}</Link></div>
          <div><span className="text-gray-500">状态：</span><Badge variant="outline">{statusMap[order.status]}</Badge></div>
          <div><span className="text-gray-500">日期：</span>{new Date(order.date).toLocaleDateString("zh-CN")}</div>
          <div><span className="text-gray-500">合同编号：</span>{order.contractNo || "-"}</div>
          <div><span className="text-gray-500">合同期限：</span>{order.contractStartDate ? new Date(order.contractStartDate).toLocaleDateString("zh-CN") : "-"} ~ {order.contractEndDate ? new Date(order.contractEndDate).toLocaleDateString("zh-CN") : "-"}</div>
          <div><span className="text-gray-500">总金额：</span>¥{order.totalAmount.toFixed(2)}</div>
          <div><span className="text-gray-500">应收：</span>¥{order.receivableAmount.toFixed(2)}</div>
          <div><span className="text-gray-500">已收：</span>¥{order.receivedAmount.toFixed(2)}</div>
          {order.paymentMethod && <div><span className="text-gray-500">付款方式：</span>{order.paymentMethod}</div>}
          {order.paymentTerms && <div><span className="text-gray-500">付款条件：</span>{order.paymentTerms}</div>}
          {order.deliveryTerms && <div><span className="text-gray-500">发货条件：</span>{order.deliveryTerms}</div>}
          {order.trackingNumber && <div className="col-span-2"><span className="text-gray-500">物流单号：</span>{order.trackingNumber}</div>}
          <div><span className="text-gray-500">付款方式：</span>{order.paymentMethod || "-"}</div>
          <div><span className="text-gray-500">回款状态：</span>{order.paymentStatus || "未回款"}</div>
          {order.paymentDateStart && order.paymentDateEnd && (
            <div className="col-span-2"><span className="text-gray-500">账期：</span>{new Date(order.paymentDateStart).toLocaleDateString("zh-CN")} ~ {new Date(order.paymentDateEnd).toLocaleDateString("zh-CN")}</div>
          )}
          <div className="col-span-2"><span className="text-gray-500">发票：</span>{order.invoiceStatus === "issued" ? `${order.invoiceNo} (${order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString("zh-CN") : ""})` : "未开票"}</div>
        </CardContent>
      </Card>

      <h3 className="font-semibold">产品明细</h3>
      <Table>
        <TableHeader><TableRow><TableHead>产品</TableHead><TableHead>数量</TableHead><TableHead>单价</TableHead><TableHead>税率</TableHead><TableHead>小计</TableHead><TableHead>出库批次</TableHead><TableHead>采购成本</TableHead><TableHead>利润(税后)</TableHead></TableRow></TableHeader>
        <TableBody>
          {order.items.map((item: any) => {
            const batchCost = item.batch?.price;
            const pps = (item.product as any).purchasePrices || [];
            const pp = pps[0];
            const cost = batchCost ?? pp?.price ?? 0;
            const profit = (item.unitPrice - cost) * item.quantity;
            const afterTaxProfit = profit / 1.13;
            return (
            <TableRow key={item.id}>
              <TableCell>{item.product.name}</TableCell><TableCell>{item.quantity}{item.product.unit}</TableCell><TableCell>¥{item.unitPrice.toFixed(2)}</TableCell><TableCell>{item.taxRate}%</TableCell><TableCell>¥{item.subtotal.toFixed(2)}</TableCell><TableCell>{item.batch?.batchNumber || "-"}</TableCell><TableCell className="text-gray-500">¥{cost.toFixed(2)}</TableCell><TableCell className="font-medium text-green-600">¥{afterTaxProfit.toFixed(2)}</TableCell>
            </TableRow>
          );})}
        </TableBody>
      </Table>

      <AfterSaleSection orderId={order.id} afterSales={order.afterSales} />
    </div>
  );
}
