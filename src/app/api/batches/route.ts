import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json([]);
  const batches = await prisma.batch.findMany({
    where: { productId, status: "arrived", quantity: { gt: 0 } },
    orderBy: { expiryDate: "asc" },
  });
  return NextResponse.json(batches);
}
