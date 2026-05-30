"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCustomersSimple, getProductsSimple, getSellPriceForCustomer, createQuotation } from "@/lib/actions";

export default function NewQuotationPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [validTo, setValidTo] = useState("");
  const [remark, setRemark] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [rows, setRows] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getCustomersSimple().then(setCustomers);
    getProductsSimple().then(setProducts);
  }, []);

  async function handlePriceLookup(productId: string, idx: number) {
    if (!customerId) return;
    const price = await getSellPriceForCustomer(productId, customerId);
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, productId, unitPrice: price } : r)));
  }

  function addRow() {
    setRows([...rows, { productId: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeRow(idx: number) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: string, value: any) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  const total = rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !validTo || rows.length === 0) return;
    setSubmitting(true);
    try {
      await createQuotation({ customerId, validTo, remark: remark || undefined, paymentMethod: paymentMethod || undefined, items: rows });
      router.push("/sales");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  const clientCustomers = customers.filter((c) => c.type !== "supplier");

  return (
    <div className="space-y-6">
      <Link href="/sales" className="text-sm text-gray-500 hover:underline">← 返回销售管理</Link>
      <h2 className="text-2xl font-bold">新建报价单</h2>

      <div className="space-y-4 max-w-3xl">
        <div className="w-64">
          <Label>客户 *</Label>
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm w-full" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">选择客户</option>
            {clientCustomers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <Label>报价有效期 *</Label>
          <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} required />
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
          <button type="button" onClick={addRow} className="text-sm px-3 py-1 border rounded-md hover:bg-gray-50">
            + 添加产品
          </button>
        </div>

        {rows.length === 0 && (
          <p className="text-gray-400 text-sm py-4">点击"添加产品"开始添加行</p>
        )}

        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-end border rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <Label className="text-xs">产品</Label>
              <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm w-full" value={row.productId} onChange={(e) => { const v = e.target.value; updateRow(idx, "productId", v); handlePriceLookup(v, idx); }}>
                <option value="">选择</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <Label className="text-xs">单价</Label>
              <Input type="number" step="0.01" value={row.unitPrice || ""} onChange={(e) => updateRow(idx, "unitPrice", Number(e.target.value))} />
            </div>
            <div className="w-20">
              <Label className="text-xs">数量</Label>
              <Input type="number" value={row.quantity || ""} onChange={(e) => updateRow(idx, "quantity", Number(e.target.value))} min={1} />
            </div>
            <div className="w-24 text-right">
              <Label className="text-xs">小计</Label>
              <div className="text-sm font-medium h-8 flex items-center justify-end">¥{(row.quantity * row.unitPrice).toFixed(2)}</div>
            </div>
            <button type="button" onClick={() => removeRow(idx)} className="text-red-500 text-xs hover:underline shrink-0 self-center">
              删除
            </button>
          </div>
        ))}

        {rows.length > 0 && (
          <div className="text-right text-lg font-bold">
            总计：¥{total.toFixed(2)}
          </div>
        )}
      </div>

      <div className="max-w-xs">
        <Label>备注</Label>
        <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="报价备注" />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !customerId || rows.length === 0}
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-9 px-6 hover:bg-primary/80 disabled:opacity-50"
      >
        {submitting ? "提交中..." : "提交报价单"}
      </button>
    </div>
  );
}
