"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Combobox from "@/components/ui/combobox";
import { createProduct, updateProduct, deleteProduct, getUsedCategories } from "@/lib/actions";

export default function ProductForm({ defaultValues, onSuccess }: { defaultValues?: any; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => { if (open) getUsedCategories().then(setCategories); }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    fd.forEach((v, k) => { if (v) data[k] = v; });
    try {
      if (defaultValues?.id) await updateProduct(defaultValues.id, data);
      else await createProduct(data);
      setOpen(false); onSuccess?.(); router.refresh();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!confirm("确定删除该产品吗？")) return;
    try { await deleteProduct(defaultValues.id); setOpen(false); router.push("/products"); router.refresh(); }
    catch (e: any) { alert(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal={true}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80">
        {defaultValues ? "编辑产品" : "新增产品"}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{defaultValues ? "编辑产品" : "新增产品"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>产品名称 *</Label><Input name="name" defaultValue={defaultValues?.name} required /></div>
            <div>
              <Label>分类</Label>
              <Combobox name="category" defaultValue={defaultValues?.category} defaults={["标准品","试剂","色谱柱","耗材","血清"]} options={categories} placeholder="输入或选择分类" />
            </div>
            <div>
              <Label>品牌</Label>
              <Input name="brand" defaultValue={defaultValues?.brand} />
            </div>
            <div>
              <Label>规格/货号</Label>
              <Input name="specification" defaultValue={defaultValues?.specification} />
            </div>
            <div>
              <Label>单位</Label>
              <Combobox name="unit" defaultValue={defaultValues?.unit} defaults={["支","瓶","盒","套","包","箱","件","mg","g"]} options={[]} placeholder="选择或输入单位" />
            </div>
            <div>
              <Label>储存条件</Label>
              <Input name="storageCondition" defaultValue={defaultValues?.storageCondition} placeholder="常温/冷藏/冷冻" />
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
