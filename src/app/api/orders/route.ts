import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { customerId, paymentMethod, items } = await request.json();
  if (!customerId || !items?.length) return NextResponse.json({ error: "参数不完整" }, { status: 400 });

  const totalAmount = items.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0);

  const order = await prisma.order.create({
    data: {
      customerId,
      paymentMethod: paymentMethod || null,
      paymentStatus: "未回款",
      totalAmount,
      receivableAmount: totalAmount,
      items: {
        create: items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.quantity * i.unitPrice,
          taxRate: 13.0,
        })),
      },
    },
  });

  // 自动生成财务收入记录
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { fullName: true } });
  await prisma.financeRecord.create({
    data: { type: "income", category: "销售收入", amount: totalAmount, description: `${customer?.fullName || ""} 创建订单`, date: new Date(), orderId: order.id },
  });

  return NextResponse.json(order);
}
