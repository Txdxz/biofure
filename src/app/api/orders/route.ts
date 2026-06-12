import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const status = searchParams.get("status");
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 100;

  const where: any = {};
  if (dateFrom) where.date = { gte: new Date(dateFrom) };
  if (dateTo) {
    const dt = new Date(dateTo);
    dt.setHours(23, 59, 59, 999);
    if (where.date) {
      where.date.lte = dt;
    } else {
      where.date = { lte: dt };
    }
  }
  if (status) {
    // 支持多状态查询，例如 status=shipped,completed
    if (status.includes(",")) {
      where.status = { in: status.split(",").map(s => s.trim()) };
    } else {
      where.status = status;
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total });
}

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
