"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCustomersSimple, getProductsSimple, getSellPriceForCustomer } from "@/lib/actions";

function SearchSelect({ options, value, onChange, placeholder, displayKey = "name" }: { options: { id: string; name?: string; fullName?: string }[]; value: string; onChange: (id: string) => void; placeholder: string; displayKey?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  const filtered = options.filter(o => (o.name || o.fullName || "").includes(query));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        value={open ? query : (selected?.name || selected?.fullName || "")}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        placeholder={placeholder}
        className="w-full"
      />
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">无匹配</div>}
          {filtered.map((o) => (
            <div
              key={o.id}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${o.id === value ? "bg-gray-50 font-medium" : ""}`}
              onMouseDown={() => { onChange(o.id); setOpen(false); setQuery(""); }}
            >
              {o.name || o.fullName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [rows, setRows] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getCustomersSimple().then(cs => setCustomers(cs.filter((c: any) => c.type !== "supplier")));
    getProductsSimple().then(setProducts);
  }, []);

  async function handlePriceLookup(productId: string, idx: number) {
    if (!customerId) return;
    const price = await getSellPriceForCustomer(productId, customerId);
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, productId, unitPrice: price } : r)));
  }

  function addRow() { setRows([...rows, { productId: "", quantity: 1, unitPrice: 0 }]); }
  function removeRow(idx: number) { setRows(rows.filter((_, i) => i !== idx)); }
  function updateRow(idx: number, field: string, value: any) { setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r))); }
  const total = rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || rows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, paymentMethod: paymentMethod || undefined, items: rows.filter(r => r.productId) }),
      });
      const order = await res.json();
      router.push(`/sales/orders/${order.id}`);
      router.refresh();
    } catch (error) { console.error(error); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <Link href="/sales" className="text-sm text-gray-500 hover:underline">← 返回销售管理</Link>
      <h2 className="text-2xl font-bold">新建订单</h2>

      <div className="space-y-4 max-w-3xl">
        <div className="w-72">
          <Label>客户 *</Label>
          <SearchSelect options={customers} value={customerId} onChange={setCustomerId} placeholder="搜索或选择客户..." />
        </div>
        <div className="w-48">
          <Label>付款方式</Label>
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm w-full" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">不指定</option>
            <option value="银行转账">银行转账</option>
            <option value="承兑汇票">承兑汇票</option>
            <option value="现金">现金</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">产品明细</h3>
          <button type="button" onClick={addRow} className="text-sm px-3 py-1 border rounded-md hover:bg-gray-50">+ 添加产品</button>
        </div>
        {rows.length === 0 && <p className="text-gray-400 text-sm py-4">点击"添加产品"开始添加行</p>}
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-end border rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <Label className="text-xs">产品</Label>
              <SearchSelect options={products} value={row.productId} onChange={(v) => { updateRow(idx, "productId", v); handlePriceLookup(v, idx); }} placeholder="搜索或选择产品..." />
            </div>
            <div className="w-24"><Label className="text-xs">单价</Label><Input type="number" step="0.01" value={row.unitPrice || ""} onChange={(e) => updateRow(idx, "unitPrice", Number(e.target.value))} /></div>
            <div className="w-20"><Label className="text-xs">数量</Label><Input type="number" value={row.quantity || ""} onChange={(e) => updateRow(idx, "quantity", Number(e.target.value))} min={1} /></div>
            <div className="w-24 text-right"><Label className="text-xs">小计</Label><div className="text-sm font-medium h-8 flex items-center justify-end">¥{(row.quantity * row.unitPrice).toFixed(2)}</div></div>
            <button type="button" onClick={() => removeRow(idx)} className="text-red-500 text-xs hover:underline shrink-0 self-center">删除</button>
          </div>
        ))}
        {rows.length > 0 && <div className="text-right text-lg font-bold">总计：¥{total.toFixed(2)}</div>}
      </div>

      <button onClick={handleSubmit} disabled={submitting || !customerId || rows.filter(r => r.productId).length === 0}
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-9 px-6 hover:bg-primary/80 disabled:opacity-50">
        {submitting ? "提交中..." : "创建订单"}
      </button>
    </div>
  );
}
