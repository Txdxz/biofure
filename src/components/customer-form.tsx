"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Combobox from "@/components/ui/combobox";
import { createCustomer, updateCustomer, deleteCustomer, getUsedIndustries, getUsedSources } from "@/lib/actions";

interface Props {
  defaultValues?: any;
  onSuccess?: () => void;
}

export default function CustomerForm({ defaultValues, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (open) { getUsedIndustries().then(setIndustries); getUsedSources().then(setSources); }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => { if (value) data[key] = value; });
    try {
      if (defaultValues?.id) {
        await updateCustomer(defaultValues.id, data);
      } else {
        await createCustomer(data as any);
      }
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (error) { console.error(error); }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{defaultValues ? "编辑客户" : "新增客户"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>公司全称 *</Label><Input name="fullName" defaultValue={defaultValues?.fullName} required /></div>
            <div><Label>简称</Label><Input name="shortName" defaultValue={defaultValues?.shortName} /></div>
            <div><Label>统一社会信用代码</Label><Input name="uscc" defaultValue={defaultValues?.uscc} /></div>
            <div>
              <Label>类型 *</Label>
              <Select name="type" defaultValue={defaultValues?.type || "client"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">下游客户</SelectItem>
                  <SelectItem value="supplier">供应商</SelectItem>
                  <SelectItem value="both">两者都是</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>行业</Label>
              <Combobox name="industry" defaultValue={defaultValues?.industry} options={industries} placeholder="输入或选择行业" />
            </div>
            <div>
              <Label>分级</Label>
              <Select name="level" defaultValue={defaultValues?.level || "B"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>来源</Label>
              <Combobox name="source" defaultValue={defaultValues?.source} options={sources} placeholder="输入或选择来源" />
            </div>
            <div>
              <Label>状态</Label>
              <Select name="status" defaultValue={defaultValues?.status || "active"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">活跃</SelectItem><SelectItem value="dormant">休眠</SelectItem><SelectItem value="potential">潜在</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>银行账户</Label><Input name="bankAccount" defaultValue={defaultValues?.bankAccount} /></div>
            <div className="col-span-2"><Label>地址</Label><Input name="address" defaultValue={defaultValues?.address} /></div>
            <div className="col-span-2"><Label>备注</Label><Textarea name="remark" defaultValue={defaultValues?.remark} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80 disabled:opacity-50" disabled={submitting}>
              {submitting ? "保存中..." : "保存"}
            </button>
            {defaultValues?.id && (
              <button type="button" onClick={handleDelete} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-300 text-red-600 text-sm font-medium h-8 px-3 hover:bg-red-50">删除</button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
