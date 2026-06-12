"use client";

import { useState } from "react";
import { exportToExcel, generateOrderImportTemplate } from "@/lib/excel";
import { Input } from "@/components/ui/input";

export default function ExportButton() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      const orders = data.orders || data;
      
      const statusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };
      
      const exportData = orders.map((order: any) => ({
        订单ID: order.id,
        客户名称: order.customer?.fullName || "-",
        订单日期: new Date(order.date).toLocaleDateString("zh-CN"),
        产品: order.items?.map((i: any) => i.product.name).join("、") || "-",
        总金额: `¥${order.totalAmount?.toFixed(2) || "0.00"}`,
        状态: statusMap[order.status as string] || order.status,
        付款方式: order.paymentMethod || "-",
        回款状态: order.paymentStatus || "-",
        物流单号: order.trackingNumber || "-",
        发票状态: order.invoiceStatus === "issued" ? "已开票" : "未开票",
        发票号: order.invoiceNo || "-"
      }));
      
      exportToExcel(exportData, "订单记录", `订单导出_${new Date().toISOString().slice(0, 10)}`);
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请重试");
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2 items-end">
      <div>
        <span className="text-xs text-gray-500">开始日期</span>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-32" />
      </div>
      <div>
        <span className="text-xs text-gray-500">结束日期</span>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-32" />
      </div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted disabled:opacity-50"
      >
        {loading ? "导出中..." : "导出订单"}
      </button>
      <button
        onClick={generateOrderImportTemplate}
        className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted"
      >
        下载导入模板
      </button>
    </div>
  );
}