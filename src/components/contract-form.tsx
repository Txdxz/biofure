"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createContract, getCustomersSimple } from "@/lib/actions";

export default function ContractForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const router = useRouter();

  useEffect(() => { if (open) getCustomersSimple().then(setCustomers); }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = { customerId };
    formData.forEach((v, k) => { if (v) data[k] = v; });
    try {
      await createContract(data as any);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal={true}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80">
        新增合同
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>新增合同</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>合同编号 *</Label>
            <Input name="contractNo" required />
          </div>
          <div>
            <Label>客户 *</Label>
            <Select value={customerId} onValueChange={(v) => v && setCustomerId(v)}>
              <SelectTrigger><SelectValue placeholder="选择客户" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>类型</Label>
            <Select name="type" defaultValue="sales">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">销售合同</SelectItem>
                <SelectItem value="purchase">采购合同</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>开始日期</Label><Input name="startDate" type="date" /></div>
            <div><Label>到期日期</Label><Input name="endDate" type="date" /></div>
          </div>
          <div><Label>合同金额</Label><Input name="totalAmount" type="number" step="0.01" /></div>
          <div><Label>备注</Label><Input name="remark" /></div>
          <button type="submit" className="w-full inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80 disabled:opacity-50" disabled={submitting}>
            {submitting ? "保存中..." : "保存"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
