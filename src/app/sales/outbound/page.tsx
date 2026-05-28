import { prisma } from "@/lib/prisma";
import { outboundOrder } from "@/lib/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import OutboundForm from "./outbound-form";

export default async function OutboundPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const confirmedOrders = await prisma.order.findMany({
    where: { status: "confirmed" },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-4">
      <Link href="/sales" className="text-sm text-gray-500 hover:underline">← 返回销售管理</Link>
      <h2 className="text-2xl font-bold">出库管理</h2>
      {confirmedOrders.length === 0 && <p className="text-gray-400">没有待出库的订单</p>}
      {confirmedOrders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link href={`/customers/${order.customer.id}`} className="text-blue-600 hover:underline">{order.customer.fullName}</Link>
              <span className="text-sm text-gray-400">¥{order.totalAmount.toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OutboundForm order={JSON.parse(JSON.stringify(order))} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
