"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createAfterSale, updateAfterSale, deleteAfterSale } from "@/lib/actions";

const stMap: Record<string, string> = { pending: "待处理", processing: "处理中", resolved: "已解决" };

export default function AfterSaleSection({ orderId, afterSales }: { orderId: string; afterSales: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    if (!desc.trim()) return;
    setSubmitting(true);
    try { await createAfterSale({ orderId, description: desc }); setDesc(""); setShowForm(false); router.refresh(); }
    catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  }

  async function handleStatus(id: string, status: string) { await updateAfterSale(id, { status }); router.refresh(); }
  async function handleDelete(id: string) { if (!confirm("确定删除？")) return; await deleteAfterSale(id); router.refresh(); }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">售后记录</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-sm px-3 py-1 border rounded-md hover:bg-gray-50">
          + 新增
        </button>
      </div>

      {showForm && (
        <div className="flex gap-2 items-end border rounded-lg p-3">
          <div className="flex-1"><Label>问题描述</Label><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述售后问题" /></div>
          <button onClick={handleAdd} disabled={submitting} className="inline-flex items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80 disabled:opacity-50">添加</button>
        </div>
      )}

      {afterSales.length > 0 ? (
        <Table>
          <TableHeader><TableRow><TableHead>日期</TableHead><TableHead>描述</TableHead><TableHead>状态</TableHead><TableHead>方案</TableHead><TableHead className="w-32">操作</TableHead></TableRow></TableHeader>
          <TableBody>
            {afterSales.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="text-sm">{new Date(a.date).toLocaleDateString("zh-CN")}</TableCell>
                <TableCell>{a.description}</TableCell>
                <TableCell><Badge variant="outline">{stMap[a.status]}</Badge></TableCell>
                <TableCell className="text-sm">{a.solution || "-"}</TableCell>
                <TableCell className="flex gap-1">
                  {a.status !== "resolved" && <button onClick={() => handleStatus(a.id, "resolved")} className="text-xs text-green-600 hover:underline">解决</button>}
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-red-500 hover:underline">删除</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : <p className="text-sm text-gray-400">暂无售后记录</p>}
    </div>
  );
}
