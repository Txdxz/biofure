import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import OutboundForm from "./outbound-form";
import EditTrackingButton from "./edit-tracking";

export const dynamic = 'force-dynamic';

export default async function OutboundPage() {
  // 只显示已确认待出库的
  const confirmedOrders = await prisma.order.findMany({
    where: { status: "confirmed" },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-4">
      <Link href="/sales" className="text-sm text-gray-500 hover:underline">← 返回销售管理</Link>
      <h2 className="text-2xl font-bold">出库管理</h2>
      {confirmedOrders.length === 0 ? (
        <p className="text-gray-400 py-8 text-center">没有待出库的订单</p>
      ) : (
        confirmedOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link href={`/customers/${order.customer.id}`} className="text-blue-600 hover:underline">{order.customer.fullName}</Link>
                <span className="text-sm text-gray-400">¥{order.totalAmount.toFixed(2)} | {new Date(order.date).toLocaleDateString("zh-CN")}</span>
                {order.contractNo && <span className="text-sm text-gray-400">合同: {order.contractNo}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutboundForm order={JSON.parse(JSON.stringify(order))} />
            </CardContent>
          </Card>
        ))
      )}

      {/* 已出库订单（支持修改物流） */}
      <h3 className="text-lg font-semibold mt-8">已出库订单</h3>
      <ShippedOrders />
    </div>
  );
}

async function ShippedOrders() {
  const shippedOrders = await prisma.order.findMany({
    where: { status: "shipped" },
    include: { customer: true, items: { include: { product: true, batch: true } } },
    orderBy: { date: "desc" },
    take: 20,
  });

  if (shippedOrders.length === 0) return <p className="text-gray-400 text-center py-4">暂无已出库订单</p>;

  return (
    <div className="space-y-2">
      {shippedOrders.map((o) => (
        <div key={o.id} className="border rounded-lg p-4 text-sm flex items-center gap-4">
          <Link href={`/customers/${o.customer.id}`} className="text-blue-600 hover:underline min-w-24">{o.customer.fullName}</Link>
          <span className="text-gray-500">{new Date(o.date).toLocaleDateString("zh-CN")}</span>
          <span className="font-medium">¥{o.totalAmount.toFixed(2)}</span>
          <span className="text-gray-500">物流: {o.trackingNumber || "-"}</span>
          <span className="text-gray-500 text-xs">{o.items.map((i: any) => i.product.name + " x" + i.quantity).join(", ")}</span>
          <EditTrackingButton order={JSON.parse(JSON.stringify(o))} />
        </div>
      ))}
    </div>
  );
}
