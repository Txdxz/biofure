"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";

// ============ 客户 ============
export async function getCustomers(search?: string, type?: string, level?: string, status?: string, page: number = 1, pageSize: number = 20) {
  const where: any = {};
  if (search) { where.OR = [{ fullName: { contains: search } }, { shortName: { contains: search } }]; }
  if (type && type !== "all") where.type = type;
  if (level && level !== "all") where.level = level;
  if (status && status !== "all") where.status = status;
  const total = await prisma.customer.count({ where });
  const items = await prisma.customer.findMany({ where, include: { contacts: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
  return { items, total, page, pageSize };
}
export async function getCustomer(id: string) {
  return prisma.customer.findUnique({ where: { id }, include: { contacts: true, orders: true } });
}
export async function createCustomer(data: any) { await prisma.customer.create({ data }); revalidatePath("/customers"); }
export async function updateCustomer(id: string, data: any) { await prisma.customer.update({ where: { id }, data }); revalidatePath(`/customers/${id}`); }
export async function deleteCustomer(id: string) {
  const refs = await prisma.customer.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
  if (refs && refs._count.orders > 0) throw new Error("有关联数据，无法删除");
  await prisma.customer.delete({ where: { id } }); revalidatePath("/customers");
}
export async function getUsedIndustries() {
  const cs = await prisma.customer.findMany({ select: { industry: true }, distinct: ["industry"] });
  return cs.map(c => c.industry).filter(Boolean) as string[];
}
export async function getUsedCategories() {
  const ps = await prisma.product.findMany({ select: { category: true }, distinct: ["category"] });
  return ps.map(p => p.category).filter(Boolean) as string[];
}
export async function getUsedSources() {
  const cs = await prisma.customer.findMany({ select: { source: true }, distinct: ["source"] });
  return cs.map(c => c.source).filter(Boolean) as string[];
}
export async function getCustomersSimple() {
  return prisma.customer.findMany({ select: { id: true, fullName: true, type: true }, orderBy: { fullName: "asc" } });
}
export async function getProductsSimple() {
  return prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

// ============ 联系人 ============
export async function createContact(data: any) { await prisma.contact.create({ data }); revalidatePath(`/customers/${data.customerId}`); }
export async function updateContact(id: string, data: any) {
  const c = await prisma.contact.update({ where: { id }, data }); revalidatePath(`/customers/${c.customerId}`);
}
export async function deleteContact(id: string) {
  const c = await prisma.contact.delete({ where: { id } }); revalidatePath(`/customers/${c.customerId}`);
}

// ============ 产品 ============
export async function getProducts(search?: string, category?: string, page: number = 1, pageSize: number = 20) {
  const where: any = {};
  if (search) { where.OR = [{ name: { contains: search } }, { nameEn: { contains: search } }, { specification: { contains: search } }]; }
  if (category && category !== "all") where.category = category;
  const total = await prisma.product.count({ where });
  const items = await prisma.product.findMany({ include: { batches: true }, orderBy: { createdAt: "desc" }, where, skip: (page - 1) * pageSize, take: pageSize });
  return { items, total, page, pageSize };
}
export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id }, include: { batches: { include: { supplier: true }, orderBy: { expiryDate: "asc" } }, productFiles: true, purchasePrices: { include: { supplier: true } }, sellPrices: { include: { customer: true } } } });
}
export async function createProduct(data: any) { await prisma.product.create({ data }); revalidatePath("/products"); }
export async function updateProduct(id: string, data: any) { await prisma.product.update({ where: { id }, data }); revalidatePath(`/products/${id}`); }
export async function deleteProduct(id: string) {
  const refs = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (refs && refs._count.orderItems > 0) throw new Error("有关联数据，无法删除");
  await prisma.product.delete({ where: { id } }); revalidatePath("/products");
}

// ============ 批次 ============
export async function createBatch(data: any) {
  const batch = await prisma.batch.create({
    data: {
      productId: data.productId, batchNumber: data.batchNumber,
      productionDate: data.productionDate ? new Date(data.productionDate) : null,
      expiryDate: new Date(data.expiryDate), quantity: Number(data.quantity) || 0,
      supplierId: data.supplierId || null, status: data.status || "arrived",
      orderDate: data.orderDate ? new Date(data.orderDate) : null,
      estimatedArrivalDate: data.estimatedArrivalDate ? new Date(data.estimatedArrivalDate) : null,
      purchaseQuantity: data.purchaseQuantity ? Number(data.purchaseQuantity) : null,
      price: data.purchasePrice ? Number(data.purchasePrice) : null,
    },
  });
  if (data.purchasePrice && data.supplierId) {
    await prisma.purchasePrice.create({ data: { productId: data.productId, supplierId: data.supplierId, price: Number(data.purchasePrice) } });
  }
  // 到货自动记录财务支出
  if (data.status !== "ordered" && data.purchasePrice && data.purchaseQuantity) {
    await prisma.financeRecord.create({
      data: { type: "expense", category: "采购成本", amount: Number(data.purchasePrice) * Number(data.purchaseQuantity), description: `批次${data.batchNumber}入库`, date: new Date() },
    });
  }
  revalidatePath(`/products/${data.productId}`);
  return batch;
}
export async function updateBatch(id: string, data: any) {
  const { productId, purchasePrice, ...cleanData } = data;
  if (cleanData.productionDate) cleanData.productionDate = new Date(cleanData.productionDate);
  if (cleanData.expiryDate) cleanData.expiryDate = new Date(cleanData.expiryDate);
  if (cleanData.orderDate) cleanData.orderDate = new Date(cleanData.orderDate);
  if (cleanData.estimatedArrivalDate) cleanData.estimatedArrivalDate = new Date(cleanData.estimatedArrivalDate);
  if (cleanData.quantity !== undefined && cleanData.quantity !== "") cleanData.quantity = Number(cleanData.quantity);
  if (cleanData.purchaseQuantity !== undefined && cleanData.purchaseQuantity !== "") cleanData.purchaseQuantity = Number(cleanData.purchaseQuantity);
  if (cleanData.supplierId === undefined) delete cleanData.supplierId;
  const b = await prisma.batch.update({ where: { id }, data: cleanData });
  // 如果更新了价格，同步更新或创建采购价记录
  if (purchasePrice && cleanData.supplierId) {
    const existingPrice = await prisma.purchasePrice.findFirst({ where: { productId: b.productId, supplierId: cleanData.supplierId } });
    if (existingPrice) {
      await prisma.purchasePrice.update({ where: { id: existingPrice.id }, data: { price: Number(purchasePrice) } });
    } else {
      await prisma.purchasePrice.create({ data: { productId: b.productId, supplierId: cleanData.supplierId, price: Number(purchasePrice) } });
    }
  }
  revalidatePath(`/products/${b.productId}`);
}
export async function deleteBatch(id: string) {
  // 清除订单引用
  await prisma.orderItem.updateMany({ where: { batchId: id }, data: { batchId: null, shippedQuantity: 0 } });
  const b = await prisma.batch.delete({ where: { id } }); revalidatePath(`/products/${b.productId}`);
}
export async function checkBatchOutbound(id: string) {
  return prisma.orderItem.findFirst({ where: { batchId: id }, select: { id: true } });
}

// ============ 价格 ============
export async function getSellPriceForCustomer(productId: string, customerId: string) {
  const sp = await prisma.sellPrice.findFirst({ where: { productId, customerId } });
  if (sp) return sp.price;
  const std = await prisma.sellPrice.findFirst({ where: { productId, customerId: null } });
  return std?.price || 0;
}

// ============ 订单 ============
export async function getOrders(search?: string, productSearch?: string, page: number = 1, pageSize: number = 20) {
  const where: any = {};
  if (search) where.customer = { fullName: { contains: search } };
  if (productSearch) where.items = { some: { product: { name: { contains: productSearch } } } };
  const total = await prisma.order.count({ where });
  const items = await prisma.order.findMany({ where, include: { customer: true, items: { include: { product: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
  return { items, total, page, pageSize };
}
export async function getOrder(id: string) {
  return prisma.order.findUnique({ where: { id }, include: { customer: true, items: { include: { product: { include: { purchasePrices: true } }, batch: true } }, afterSales: { orderBy: { createdAt: "desc" } } } });
}
export async function updateOrderStatus(id: string, status: string) {
  await prisma.order.update({ where: { id }, data: { status } });
  // 取消订单 → 退回库存
  if (status === "cancelled") {
    const items = await prisma.orderItem.findMany({ where: { orderId: id } });
    for (const item of items) {
      if (item.shippedQuantity > 0 && item.batchId) {
        await prisma.batch.update({ where: { id: item.batchId! }, data: { quantity: { increment: item.shippedQuantity } } });
      }
      await prisma.orderItem.update({ where: { id: item.id }, data: { shippedQuantity: 0, batchId: null } });
    }
  }
  // 发货或完成时自动记录财务收入
  if (status === "shipped" || status === "completed") {
    const order = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
    if (order) {
      // 避免重复记录
      const existing = await prisma.financeRecord.findFirst({ where: { orderId: id, type: "income" } });
      if (!existing) {
        await prisma.financeRecord.create({
          data: { type: "income", category: "销售收入", amount: order.totalAmount, description: `${order.customer.fullName} 订单发货`, date: new Date(), orderId: id },
        });
      }
    }
  }
  revalidatePath("/sales");
}
export async function updateOrder(id: string, data: any) {
  const { receivedDate, contractStartDate, contractEndDate, paymentDateStart, paymentDateEnd, receivedAmount, totalAmount, receivableAmount, ...rest } = data;
  await prisma.order.update({
    where: { id },
    data: {
      ...rest,
      receivedDate: receivedDate ? new Date(receivedDate) : undefined,
      contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined,
      contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined,
      paymentDateStart: paymentDateStart ? new Date(paymentDateStart) : undefined,
      paymentDateEnd: paymentDateEnd ? new Date(paymentDateEnd) : undefined,
      receivedAmount: receivedAmount ? Number(receivedAmount) : undefined,
      totalAmount: totalAmount ? Number(totalAmount) : undefined,
      receivableAmount: receivableAmount ? Number(receivableAmount) : undefined,
    },
  });
  revalidatePath(`/sales`);
}
export async function deleteOrder(id: string) { await prisma.order.delete({ where: { id } }); revalidatePath("/sales"); }

// ============ 出库 ============
export async function outboundOrder(orderId: string, trackingNumber: string, batchAssignments: { orderItemId: string; batchId: string; quantity: number }[]) {
  for (const a of batchAssignments) {
    const orderItem = await prisma.orderItem.findUnique({ where: { id: a.orderItemId } });
    if (!orderItem) throw new Error("订单明细不存在");
    
    const remaining = orderItem.quantity - orderItem.shippedQuantity;
    if (a.quantity > remaining) throw new Error(`出库数量超过订单剩余数量，剩余: ${remaining}`);
    
    const batch = await prisma.batch.findUnique({ where: { id: a.batchId } });
    if (!batch || batch.quantity < a.quantity) throw new Error(`批次库存不足，当前库存: ${batch?.quantity || 0}`);
    
    await prisma.orderItem.update({ where: { id: a.orderItemId }, data: { batchId: a.batchId, shippedQuantity: { increment: a.quantity } } });
    await prisma.batch.update({ where: { id: a.batchId }, data: { quantity: { decrement: a.quantity } } });
  }
  // 检查是否所有项都已出完
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const allShipped = items.every(i => i.shippedQuantity >= i.quantity);
  // 追加物流单号
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true } });
  const newTracking = existingOrder?.trackingNumber ? existingOrder.trackingNumber + "、" + trackingNumber : trackingNumber;
  await prisma.order.update({ where: { id: orderId }, data: { status: allShipped ? "shipped" : "confirmed", trackingNumber: newTracking } });
  revalidatePath("/sales");
}

// ============ 售后 ============
export async function createAfterSale(data: { orderId: string; description: string; status?: string; solution?: string }) {
  await prisma.afterSale.create({ data });
  revalidatePath(`/sales`);
}
export async function updateAfterSale(id: string, data: any) {
  await prisma.afterSale.update({ where: { id }, data }); revalidatePath("/sales");
}
export async function deleteAfterSale(id: string) { await prisma.afterSale.delete({ where: { id } }); revalidatePath("/sales"); }

// ============ 财务 ============
export async function getFinanceRecords(month?: number, year?: number, orderFilter?: string, typeFilter?: string, categoryFilter?: string, startDate?: string, endDate?: string, page: number = 1, pageSize: number = 20) {
  const now = new Date();
  const m = month !== undefined ? month : now.getMonth() + 1;
  const y = year || now.getFullYear();
  let sDate: Date | undefined, eDate: Date | undefined;
  if (startDate) sDate = new Date(startDate);
  if (endDate) { eDate = new Date(endDate); eDate.setHours(23, 59, 59, 999); }
  const startDateFinal = sDate || (m === 0 ? new Date(y, 0, 1) : new Date(y, m - 1, 1));
  const endDateFinal = eDate || (m === 0 ? new Date(y, 11, 31, 23, 59, 59) : new Date(y, m, 0, 23, 59, 59));

  const where: any = { date: { gte: startDateFinal, lte: endDateFinal } };
  if (typeFilter && typeFilter !== "all") where.type = typeFilter;
  if (categoryFilter && categoryFilter !== "all") where.category = categoryFilter;

  const total = await prisma.financeRecord.count({ where });
  let records = await prisma.financeRecord.findMany({ where, orderBy: { date: "desc" }, skip: (page - 1) * pageSize, take: pageSize });

  const orderIdsArr = records.filter(r => r.orderId).map(r => r.orderId!);
  const orderIds: string[] = [];
  for (let i = 0; i < orderIdsArr.length; i++) { if (!orderIds.includes(orderIdsArr[i])) orderIds.push(orderIdsArr[i]); }
  let orderStatuses: Record<string, string> = {};
  let paymentStatuses: Record<string, string> = {};
  if (orderIds.length > 0) {
    const orders = await prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, status: true, paymentStatus: true } });
    orders.forEach(o => { orderStatuses[o.id] = o.status; paymentStatuses[o.id] = o.paymentStatus || "未回款"; });
  }

  if (orderFilter === "cancelled") records = records.filter(r => r.orderId && orderStatuses[r.orderId] === "cancelled");
  else if (orderFilter === "normal") records = records.filter(r => !r.orderId || orderStatuses[r.orderId] !== "cancelled");

  const recordsWithOrderStatus = records.map(r => ({ ...r, orderStatus: r.orderId ? orderStatuses[r.orderId] || null : null, paymentStatus: r.orderId ? paymentStatuses[r.orderId] || null : null }));

  let totalIncome = 0, totalExpense = 0, collectedIncome = 0;
  const allRecords = await prisma.financeRecord.findMany({ where });
  for (const r of allRecords) {
    if (r.type === "income") {
      totalIncome += r.amount;
    } else totalExpense += r.amount;
  }
  const allOrderIds: string[] = [];
  for (const r of allRecords) {
    if (r.orderId && !allOrderIds.includes(r.orderId)) {
      allOrderIds.push(r.orderId);
    }
  }
  if (allOrderIds.length > 0) {
    const allOrders = await prisma.order.findMany({ where: { id: { in: allOrderIds } }, select: { id: true, paymentStatus: true } });
    const allPaymentStatuses: Record<string, string> = {};
    allOrders.forEach(o => { allPaymentStatuses[o.id] = o.paymentStatus || "未回款"; });
    for (const r of allRecords) {
      if (r.type === "income") {
        const ps = allPaymentStatuses[r.orderId || ""];
        if (!r.orderId || ps === "已回款" || ps === "已付首款") collectedIncome += r.amount;
      }
    }
  }
  return { records: recordsWithOrderStatus, total, totalIncome, totalExpense, collectedIncome, month: m, year: y };
}

export async function createFinanceRecord(data: any) {
  await prisma.financeRecord.create({ data: { ...data, date: new Date(data.date), amount: Number(data.amount) } });
  revalidatePath("/finance");
}
export async function updateFinanceRecord(id: string, data: any) {
  if (data.amount) data.amount = Number(data.amount);
  if (data.date) data.date = new Date(data.date);
  await prisma.financeRecord.update({ where: { id }, data });
  revalidatePath("/finance");
}
export async function deleteFinanceRecord(id: string) { await prisma.financeRecord.delete({ where: { id } }); revalidatePath("/finance"); }

// ============ 订单发票 ============
export async function updateOrderInvoice(id: string, invoiceNo: string, invoiceDate: string) {
  await prisma.order.update({ where: { id }, data: { invoiceNo, invoiceDate: new Date(invoiceDate), invoiceStatus: "issued" } });
  revalidatePath("/finance");
}

// ============ 统计 ============
export async function getDashboardStats(month?: number, year?: number) {
  const now = new Date();
  const m = month !== undefined ? month : now.getMonth() + 1;
  const y = year || now.getFullYear();
  // m=0 表示全年
  const startDate = m === 0 ? new Date(y, 0, 1) : new Date(y, m - 1, 1);
  const endDate = m === 0 ? new Date(y, 11, 31, 23, 59, 59) : new Date(y, m, 0, 23, 59, 59);

  const [customerCount, productCount, pendingOrderCount] = await Promise.all([
    prisma.customer.count({ where: { status: "active" } }),
    prisma.product.count(),
    prisma.order.count({ where: { status: { in: ["pending", "confirmed"] } } }),
  ]);

  // 期间营收
  const periodOrders = await prisma.order.findMany({
    where: { date: { gte: startDate, lte: endDate }, status: { not: "cancelled" } },
    include: { customer: true, items: { include: { product: { include: { purchasePrices: true } } } } },
  });
  const monthRevenue = periodOrders.reduce((s, o) => s + o.totalAmount, 0);
  let monthProfit = 0;
  for (const order of periodOrders) {
    for (const item of order.items) {
      const latestPurchase = item.product.purchasePrices.sort((a: any, b: any) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime())[0];
      const cost = latestPurchase ? latestPurchase.price : 0;
      monthProfit += (item.unitPrice - cost) * item.quantity;
    }
  }

  // 产品分类统计
  const categorySales: Record<string, number> = {};
  for (const order of periodOrders) {
    for (const item of order.items) {
      const cat = item.product.category || "未分类";
      categorySales[cat] = (categorySales[cat] || 0) + item.subtotal;
    }
  }

  // 客户销售额统计
  const customerSales: Record<string, { name: string; amount: number }> = {};
  for (const order of periodOrders) {
    const cid = order.customerId;
    if (!customerSales[cid]) customerSales[cid] = { name: order.customer.fullName || order.customer.shortName || cid, amount: 0 };
    customerSales[cid].amount += order.totalAmount;
  }

  const recentOrders = await prisma.order.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 5 });
  const expiringBatches = await prisma.batch.findMany({ include: { product: true }, where: { expiryDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }, quantity: { gt: 0 } }, orderBy: { expiryDate: "asc" }, take: 5 });

  // 按年统计（用于图表）
  const yearStart = new Date(y, 0, 1);
  const yearEnd = new Date(y, 11, 31, 23, 59, 59);
  const yearOrders = await prisma.order.findMany({
    where: { date: { gte: yearStart, lte: yearEnd }, status: { not: "cancelled" } },
    include: { items: { include: { product: { include: { purchasePrices: true } } } } },
  });
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthOrders = yearOrders.filter(o => new Date(o.date).getMonth() === i);
    const revenue = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
    let profit = 0;
    for (const order of monthOrders) {
      for (const item of order.items) {
        const latestPurchase = item.product.purchasePrices.sort((a: any, b: any) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime())[0];
        profit += (item.unitPrice - (latestPurchase?.price || 0)) * item.quantity;
      }
    }
    return { month: i + 1, revenue, profit };
  });

  return { customerCount, productCount, pendingOrderCount, monthRevenue, monthProfit, categorySales, customerSales, recentOrders, expiringBatches, monthlyData, month: m, year: y };
}
