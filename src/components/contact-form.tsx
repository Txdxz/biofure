"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createContact, updateContact, deleteContact } from "@/lib/actions";

interface Props {
  customerId: string;
  defaultValues?: any;
  onSuccess?: () => void;
}

export default function ContactForm({ customerId, defaultValues, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = { customerId };
    formData.forEach((value, key) => {
      if (key === "isPrimary") data[key] = value === "on";
      else if (value) data[key] = value;
    });
    try {
      if (defaultValues?.id) await updateContact(defaultValues.id, data);
      else await createContact(data as any);
      setOpen(false); onSuccess?.(); router.refresh();
    } catch (error) { console.error(error); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!confirm("确定删除该联系人吗？")) return;
    try { await deleteContact(defaultValues.id); setOpen(false); router.refresh(); }
    catch (e: any) { alert(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal={true}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted">
        {defaultValues ? "编辑" : "添加联系人"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{defaultValues ? "编辑联系人" : "添加联系人"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>姓名 *</Label><Input name="name" defaultValue={defaultValues?.name} required /></div>
            <div><Label>职务</Label><Input name="position" defaultValue={defaultValues?.position} /></div>
            <div><Label>电话</Label><Input name="phone" defaultValue={defaultValues?.phone} /></div>
            <div><Label>微信</Label><Input name="wechat" defaultValue={defaultValues?.wechat} /></div>
            <div className="col-span-2"><Label>邮箱</Label><Input name="email" type="email" defaultValue={defaultValues?.email} /></div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox id="isPrimary" name="isPrimary" defaultChecked={defaultValues?.isPrimary} />
              <Label htmlFor="isPrimary">设为主要联系人</Label>
            </div>
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
