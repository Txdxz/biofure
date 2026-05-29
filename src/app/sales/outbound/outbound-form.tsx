"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { outboundOrder } from "@/lib/actions";

export default function OutboundForm({ order }: { order: any }) {
  const [selections, setSelections] = useState<Record<string, { batchId: string; quantity: number }>>({});
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [submitting, setSubmitting] = useState(false);
  const [batchesMap, setBatchesMap] = useState<Record<string, any[]>>({});
  const router = useRouter();

  useEffect(() => {
    order.items.forEach(async (item: any) => {
      const alreadyShipped = item.shippedQuantity || 0;
      if (alreadyShipped >= item.quantity) return; // 已出完的不加载
      const resp = await fetch(`/api/batches?productId=${item.productId}`);
      const data = await resp.json();
      setBatchesMap(prev => ({ ...prev, [item.id]: data }));
      // 默认选中全出
      const remain = item.quantity - alreadyShipped;
      if (data.length > 0) {
        setSelections(prev => ({ ...prev, [item.id]: { batchId: data[0].id, quantity: remain } }));
      }
    });
  }, [order.items]);

  function handleBatchChange(orderItemId: string, batchId: string) {
    setSelections(prev => ({ ...prev, [orderItemId]: { ...(prev[orderItemId] || { quantity: 0 }), batchId } }));
  }

  function handleQtyChange(orderItemId: string, quantity: number) {
    setSelections(prev => ({ ...prev, [orderItemId]: { ...(prev[orderItemId] || { batchId: "" }), quantity } }));
  }

  async function handleOutbound() {
    const assignments = Object.entries(selections).map(([orderItemId, sel]) => ({
      orderItemId, batchId: sel.batchId, quantity: sel.quantity,
    }));
    if (assignments.length === 0 || !trackingNumber.trim()) return;
    setSubmitting(true);
    try { await outboundOrder(order.id, trackingNumber, assignments); router.refresh(); }
    catch (error) { console.error(error); }
    finally { setSubmitting(false); }
  }

  const hasSelection = Object.keys(selections).length > 0;

  return (
    <div>
      <div className="space-y-3 mb-4">
        {order.items.map((item: any) => {
          const alreadyShipped = item.shippedQuantity || 0;
          const remain = item.quantity - alreadyShipped;
          const batches = batchesMap[item.id] || [];
          const sel = selections[item.id];

          if (alreadyShipped >= item.quantity) {
            return (
              <div key={item.id} className="flex gap-2 items-center text-sm text-gray-400">
                <span className="w-40 truncate">{item.product.name}</span>
                <span>✓ 已出 {alreadyShipped}/{item.quantity}</span>
              </div>
            );
          }

          return (
            <div key={item.id} className="flex gap-2 items-center text-sm border rounded p-2">
              <span className="w-40 truncate">{item.product.name}</span>
              <span className="text-gray-500">待出 {remain} 件</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={sel?.batchId || ""}
                onChange={(e) => handleBatchChange(item.id, e.target.value)}
              >
                <option value="">选批次</option>
                {batches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.batchNumber} (库存:{b.quantity})</option>
                ))}
              </select>
              <input
                type="number"
                className="border rounded px-2 py-1 text-sm w-16"
                value={sel?.quantity || remain}
                min={1}
                max={remain}
                onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
              />
              <span className="text-xs text-gray-400">已出 {alreadyShipped}/{item.quantity}</span>
            </div>
          );
        })}
      </div>
      <div className="mb-4 max-w-xs">
        <Label>物流单号 *</Label>
        <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="输入快递单号" />
      </div>
      <button onClick={handleOutbound} disabled={submitting || !hasSelection || !trackingNumber.trim()}
        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-green-600 text-white text-sm font-medium h-8 px-4 hover:bg-green-700 disabled:opacity-50">
        {submitting ? "出库中..." : "确认出库"}
      </button>
    </div>
  );
}
