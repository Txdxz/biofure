"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { outboundOrder } from "@/lib/actions";

export default function OutboundForm({ order }: { order: any }) {
  const [selections, setSelections] = useState<Record<string, { batchId: string; quantity: number }>>({});
  const [trackingNumber, setTrackingNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [batchesMap, setBatchesMap] = useState<Record<string, any[]>>({});
  const router = useRouter();

  useEffect(() => {
    order.items.forEach(async (item: any) => {
      const resp = await fetch(`/api/batches?productId=${item.productId}`);
      const data = await resp.json();
      setBatchesMap(prev => ({ ...prev, [item.id]: data }));
    });
  }, [order.items]);

  function handleBatchChange(orderItemId: string, batchId: string, maxQty: number) {
    setSelections(prev => ({ ...prev, [orderItemId]: { batchId, quantity: maxQty } }));
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

  return (
    <div>
      <div className="space-y-2 mb-4">
        {order.items.map((item: any) => {
          const batches = batchesMap[item.id] || [];
          return (
            <div key={item.id} className="flex gap-2 items-center text-sm">
              <span className="w-40 truncate">{item.product.name}</span>
              <span className="text-gray-500">x{item.quantity}</span>
              <select className="border rounded px-2 py-1 text-sm" value={selections[item.id]?.batchId || ""} onChange={(e) => handleBatchChange(item.id, e.target.value, item.quantity)}>
                <option value="">选批次</option>
                {batches.map((b: any) => (<option key={b.id} value={b.id}>{b.batchNumber} (库存:{b.quantity})</option>))}
              </select>
            </div>
          );
        })}
      </div>
      <div className="mb-4 max-w-xs">
        <Label>物流单号 *</Label>
        <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="输入快递单号" />
      </div>
      <button onClick={handleOutbound} disabled={submitting || Object.keys(selections).length === 0 || !trackingNumber.trim()}
        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-green-600 text-white text-sm font-medium h-8 px-4 hover:bg-green-700 disabled:opacity-50">
        {submitting ? "出库中..." : "确认出库"}
      </button>
    </div>
  );
}
