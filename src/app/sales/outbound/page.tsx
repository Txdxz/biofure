"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import OutboundForm from "./outbound-form";
import EditTrackingButton from "./edit-tracking";
import Pagination from "@/components/ui/pagination";
import { exportToExcel } from "@/lib/excel";
import { Input } from "@/components/ui/input";

export default function OutboundPage() {
  const [confirmedOrders, setConfirmedOrders] = useState<any[]>([]);
  const [shippedOrders, setShippedOrders] = useState<any[]>([]);
  const [shippedTotal, setShippedTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadConfirmedOrders();
    loadShippedOrders();
  }, [page, dateFrom, dateTo]);

  async function loadConfirmedOrders() {
    try {
      const res = await fetch("/api/orders?status=confirmed");
      const data = await res.json();
      
      if (data && Array.isArray(data.orders)) {
        setConfirmedOrders(data.orders);
      } else if (Array.isArray(data)) {
        setConfirmedOrders(data);
      } else {
        console.error("API 返回格式错误:", data);
        setConfirmedOrders([]);
      }
    } catch (error) {
      console.error("加载待出库订单失败:", error);
      setConfirmedOrders([]);
    }
  }

  async function loadShippedOrders() {
    try {
      const params = new URLSearchParams();
      params.set("status", "shipped,completed");
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      
      if (data && Array.isArray(data.orders)) {
        setShippedOrders(data.orders);
        setShippedTotal(data.total || 0);
      } else {
        console.error("API 返回格式错误:", data);
        setShippedOrders([]);
        setShippedTotal(0);
      }
    } catch (error) {
      console.error("加载已出库订单失败:", error);
      setShippedOrders([]);
      setShippedTotal(0);
    }
  }

  async function handleExport() {
    const params = new URLSearchParams();
    params.set("status", "shipped,completed");
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    const orders = data.orders || data;
    
    const exportData = orders.map((order: any) => ({
      订单ID: order.id,
      客户名称: order.customer?.fullName || "-",
      订单日期: new Date(order.date).toLocaleDateString("zh-CN"),
      产品: order.items?.map((i: any) => i.product.name).join("、") || "-",
      总金额: `¥${order.totalAmount?.toFixed(2) || "0.00"}`,
      物流单号: order.trackingNumber || "-",
    }));
    
    exportToExcel(exportData, "已出库订单", `已出库订单_${new Date().toISOString().slice(0, 10)}`);
  }

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
              <OutboundForm order={order} />
            </CardContent>
          </Card>
        ))
      )}

      {/* 已出库订单（支持修改物流） */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">已出库订单</h3>
          <div className="flex gap-2 items-end">
            <div>
              <span className="text-xs text-gray-500">开始日期</span>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-32" />
            </div>
            <div>
              <span className="text-xs text-gray-500">结束日期</span>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-32" />
            </div>
            <button onClick={handleExport} className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted">
              导出
            </button>
          </div>
        </div>
        
        {shippedOrders.length === 0 ? (
          <p className="text-gray-400 text-center py-4">暂无已出库订单</p>
        ) : (
          <>
            <div className="space-y-2">
              {shippedOrders.map((o) => (
                <div key={o.id} className="border rounded-lg p-4 text-sm flex items-center gap-4">
                  <Link href={`/customers/${o.customer.id}`} className="text-blue-600 hover:underline min-w-24">{o.customer.fullName}</Link>
                  <span className="text-gray-500">{new Date(o.date).toLocaleDateString("zh-CN")}</span>
                  <span className="font-medium">¥{o.totalAmount.toFixed(2)}</span>
                  <span className="text-gray-500">物流: {o.trackingNumber || "-"}</span>
                  <span className="text-gray-500 text-xs">{o.items.map((i: any) => i.product.name + " x" + i.quantity).join(", ")}</span>
                  <EditTrackingButton order={o} />
                </div>
              ))}
            </div>
            <Pagination total={shippedTotal} page={page} pageSize={20} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
