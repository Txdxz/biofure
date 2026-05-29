"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateOrder } from "@/lib/actions";

export default function OrderEditForm({ order }: { order: any }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data: any = {};
    fd.forEach((v, k) => { if (v) data[k] = v; });
    try { await updateOrder(order.id, data); setOpen(false); router.refresh(); }
    catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal={true}>
      <DialogTrigger className="text-sm px-3 py-1 border rounded-md hover:bg-gray-50">编辑合同信息</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>编辑订单/合同信息</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>合同编号</Label><Input name="contractNo" defaultValue={order.contractNo} /></div>
            <div>
              <Label>付款方式</Label>
              <select name="paymentMethod" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm w-full" defaultValue={order.paymentMethod || ""}>
                <option value="">不指定</option>
                <option value="银行转账">银行转账</option>
                <option value="承兑汇票">承兑汇票</option>
                <option value="现金">现金</option>
              </select>
            </div>
            <div>
              <Label>回款状态</Label>
              <select name="paymentStatus" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm w-full" defaultValue={order.paymentStatus || "未回款"}>
                <option value="未回款">未回款</option>
                <option value="已回款">已回款</option>
                <option value="已付首款">已付首款</option>
              </select>
            </div>
            <div><Label>付款条件</Label><Input name="paymentTerms" defaultValue={order.paymentTerms} /></div>
            <div><Label>已收金额</Label><Input name="receivedAmount" type="number" step="0.01" defaultValue={order.receivedAmount} /></div>
            <div><Label>回款日期</Label><Input name="receivedDate" type="date" defaultValue={order.receivedDate ? new Date(order.receivedDate).toISOString().slice(0,10) : ""} /></div>
            <div><Label>物流单号</Label><Input name="trackingNumber" defaultValue={order.trackingNumber} /></div>
            <div><Label>账期开始</Label><Input name="paymentDateStart" type="date" defaultValue={order.paymentDateStart ? new Date(order.paymentDateStart).toISOString().slice(0,10) : ""} /></div>
            <div><Label>账期结束</Label><Input name="paymentDateEnd" type="date" defaultValue={order.paymentDateEnd ? new Date(order.paymentDateEnd).toISOString().slice(0,10) : ""} /></div>
          </div>
          <button type="submit" className="w-full inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80 disabled:opacity-50" disabled={submitting}>
            {submitting ? "保存中..." : "保存"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
