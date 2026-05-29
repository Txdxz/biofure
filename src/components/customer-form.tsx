"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Combobox from "@/components/ui/combobox";
import { createCustomer, updateCustomer, deleteCustomer, getUsedIndustries, getUsedSources } from "@/lib/actions";

export default function CustomerForm({ defaultValues, onSuccess }: { defaultValues?: any; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => { if (open) { getUsedIndustries().then(setIndustries); getUsedSources().then(setSources); } }, [open]);

  const sel = "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm w-full";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    fd.forEach((v, k) => { if (v) data[k] = v; });
    try {
      if (defaultValues?.id) await updateCustomer(defaultValues.id, data);
      else await createCustomer(data);
      setOpen(false); onSuccess?.(); router.refresh();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!confirm("确定删除该客户吗？")) return;
    try { await deleteCustomer(defaultValues.id); setOpen(false); router.push("/customers"); router.refresh(); }
    catch (e: any) { alert(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal={true}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80">
        {defaultValues ? "编辑" : "新增客户"}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{defaultValues ? "编辑客户" : "新增客户"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>公司全称 *</Label><Input name="fullName" defaultValue={defaultValues?.fullName} required /></div>
            <div>
              <Label>类型 *</Label>
              <select name="type" className={sel} defaultValue={defaultValues?.type || "客户"}>
                <option value="客户">下游客户</option>
                <option value="供应商">供应商</option>
                <option value="两者都是">两者都是</option>
              </select>
            </div>
            <div>
              <Label>行业</Label>
              <Combobox name="industry" defaultValue={defaultValues?.industry} defaults={["制药","检测","CRO","高校","医院"]} options={industries} placeholder="输入或选择行业" />
            </div>
            <div>
              <Label>分级</Label>
              <select name="level" className={sel} defaultValue={defaultValues?.level || "B"}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <Label>状态</Label>
              <select name="status" className={sel} defaultValue={defaultValues?.status || "活跃"}>
                <option value="活跃">活跃</option>
                <option value="休眠">休眠</option>
                <option value="潜在">潜在</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>来源</Label>
              <Combobox name="source" defaultValue={defaultValues?.source} defaults={["展会","网络","介绍","主动联系"]} options={sources} placeholder="输入或选择来源" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 hover:bg-primary/80" disabled={submitting}>{submitting ? "保存中..." : "保存"}</button>
            {defaultValues?.id && <button type="button" onClick={handleDelete} className="inline-flex items-center justify-center rounded-lg border border-red-300 text-red-600 text-sm font-medium h-8 px-3 hover:bg-red-50">删除</button>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
