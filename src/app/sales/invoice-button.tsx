"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderInvoice } from "@/lib/actions";

export default function InvoiceButton({ orderId }: { orderId: string }) {
  const [show, setShow] = useState(false);
  const [no, setNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!show) return <button onClick={() => setShow(true)} className="text-xs text-blue-600 hover:underline">录发票</button>;

  async function handleSave() {
    if (!no.trim()) return;
    setSaving(true);
    await updateOrderInvoice(orderId, no.trim(), date);
    setShow(false);
    router.refresh();
  }

  return (
    <span className="inline-flex gap-1 items-center">
      <input value={no} onChange={e => setNo(e.target.value)} placeholder="发票号" className="border rounded px-1 py-0.5 text-xs w-24" />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-1 py-0.5 text-xs" />
      <button onClick={handleSave} disabled={saving} className="text-xs text-green-600 hover:underline">{saving ? "..." : "保存"}</button>
      <button onClick={() => setShow(false)} className="text-xs text-gray-400 hover:underline">×</button>
    </span>
  );
}
