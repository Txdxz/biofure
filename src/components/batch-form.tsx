"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SearchSelect } from "@/components/ui/search-select";
import { createBatch, updateBatch, deleteBatch, getCustomersSimple } from "@/lib/actions";

interface Props {
  productId: string;
  defaultValues?: any;
  onSuccess?: () => void;
}

export default function BatchForm({ productId, defaultValues, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState(defaultValues?.supplierId || "");
  const router = useRouter();

  const isReadonly = defaultValues && defaultValues.status === "depleted";
  const triggerLabel = defaultValues ? (isReadonly ? "查看" : "编辑") : "新增批次";

  useEffect(() => {
    if (open) getCustomersSimple().then((cs) => setCustomers(cs.filter((c) => c.type !== "client")));
  }, [open]);

  async function doSave(e: React.MouseEvent) {
    e.preventDefault();
    setSubmitting(true);
    const form = (e.currentTarget as HTMLElement).closest("form")!;
    const fd = new FormData(form);
    if (isReadonly) {
      alert("已到货或已耗尽的批次不支持修改");
      setSubmitting(false);
      return;
    }
    const data: Record<string, any> = { productId, supplierId: supplierId || undefined };
    const entries = Array.from(fd.entries());
    for (let i = 0; i < entries.length; i++) {
      const k = entries[i][0];
      const v = entries[i][1];
      if (v && String(v).trim()) data[k] = v;
    }
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);
    if (data.purchasePrice) data.purchasePrice = Number(data.purchasePrice);
    if (data.purchaseQuantity) data.purchaseQuantity = Number(data.purchaseQuantity);
    // 简化逻辑：采购数量直接作为库存量
    if (data.status === "depleted") data.quantity = 0;
    else if (data.purchaseQuantity && !data.quantity) data.quantity = data.purchaseQuantity;
    try {
      if (defaultValues?.id) {
        await updateBatch(defaultValues.id, data);
      } else {
        await createBatch(data);
      }
      setOpen(false); onSuccess?.();
      window.location.reload();
    } catch (e) { console.error(e); alert("保存失败: " + (e instanceof Error ? e.message : String(e))); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!confirm("确定删除？")) return;
    // 检查是否已出库
    const orderItem = await import("@/lib/actions").then(m => m.checkBatchOutbound(defaultValues.id));
    if (orderItem) {
      if (!confirm("此批次已出库，删除后订单中的批次关联将丢失，是否继续？")) return;
    }
    await deleteBatch(defaultValues.id); setOpen(false); router.refresh();
  }

  const fmtDate = (d: any) => d ? new Date(d).toISOString().slice(0, 10) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal={true}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted">
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{triggerLabel}</DialogTitle></DialogHeader>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>批号 *</Label><Input name="batchNumber" defaultValue={defaultValues?.batchNumber} required readOnly={isReadonly} /></div>
            <div>
              <Label>供应商</Label>
              <SearchSelect options={customers} value={supplierId} onChange={setSupplierId} placeholder="搜索或选择供应商..." displayKey="fullName" disabled={isReadonly} />
            </div>
            <div>
              <Label>状态</Label>
              <select name="status" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm w-full" defaultValue={defaultValues?.status || "arrived"} disabled={isReadonly}>
                <option value="ordered">已下单（待到货）</option>
                <option value="arrived">已到货（入库）</option>
                <option value="depleted">已耗尽</option>
              </select>
            </div>
            <div><Label>有效期</Label><Input name="expiryDate" type="date" defaultValue={fmtDate(defaultValues?.expiryDate)} readOnly={isReadonly} /></div>
            <div><Label>下单日期</Label><Input name="orderDate" type="date" defaultValue={fmtDate(defaultValues?.orderDate)} readOnly={isReadonly} /></div>
            <div><Label>采购数量</Label><Input name="purchaseQuantity" type="number" defaultValue={defaultValues?.purchaseQuantity || ""} readOnly={isReadonly} /></div>
            <div><Label>采购单价 ¥</Label><Input name="purchasePrice" type="number" step="0.01" defaultValue={defaultValues?.purchasePrice ? String(defaultValues.purchasePrice) : ""} readOnly={isReadonly} /></div>
          </div>
          <div className="flex gap-2">
            {!isReadonly && (
              <button type="button" onClick={doSave} className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 hover:bg-primary/80 disabled:opacity-50" disabled={submitting}>{submitting ? "保存中..." : "保存"}</button>
            )}
            {defaultValues?.id && (
              <button type="button" onClick={handleDelete} className="inline-flex items-center justify-center rounded-lg border border-red-300 text-red-600 text-sm font-medium h-8 px-3 hover:bg-red-50">删除</button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
