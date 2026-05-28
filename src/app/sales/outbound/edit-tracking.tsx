"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrder } from "@/lib/actions";

export default function EditTrackingButton({ order }: { order: any }) {
  const [show, setShow] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!show) return <button onClick={() => setShow(true)} className="text-xs text-blue-600 hover:underline shrink-0">修改物流</button>;

  async function handleSave() {
    setSaving(true);
    await updateOrder(order.id, { trackingNumber });
    setShow(false);
    router.refresh();
  }

  return (
    <span className="inline-flex gap-1 items-center shrink-0">
      <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="border rounded px-1 py-0.5 text-xs w-28" />
      <button onClick={handleSave} disabled={saving} className="text-xs text-green-600 hover:underline">{saving ? "..." : "保存"}</button>
      <button onClick={() => setShow(false)} className="text-xs text-gray-400 hover:underline">×</button>
    </span>
  );
}
