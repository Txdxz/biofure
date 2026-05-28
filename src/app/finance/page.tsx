"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFinanceRecords, createFinanceRecord, deleteFinanceRecord, updateOrderInvoice, getOrders } from "@/lib/actions";
import Link from "next/link";

const incomeCategories = ["销售收入", "服务费", "其他收入"];
const expenseCategories = ["采购成本", "房租", "工资", "物流", "差旅", "办公用品", "外包服务", "税费", "其他"];
const orderStatusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };

export default function FinancePage() {
  const [tab, setTab] = useState("records");
  const [records, setRecords] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [orders, setOrders] = useState<any[]>([]);
  // 新增账目
  const [showForm, setShowForm] = useState(false);
  const [fType, setFType] = useState("expense");
  const [fCat, setFCat] = useState("采购成本");
  const [fAmt, setFAmt] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
    getOrders().then(os => setOrders(os.filter((o: any) => o.status === "shipped" || o.status === "completed")));
  }, [month, year, tab]);

  async function loadData() {
    const data = await getFinanceRecords(month, year);
    setRecords(data.records);
    setTotalIncome(data.totalIncome);
    setTotalExpense(data.totalExpense);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await createFinanceRecord({ date: fDate, type: fType, category: fCat, amount: Number(fAmt), description: fDesc || undefined });
    setShowForm(false); setFAmt(""); setFDesc("");
    loadData(); setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除？")) return;
    await deleteFinanceRecord(id);
    loadData();
  }

  async function handleInvoice(orderId: string, invoiceNo: string, invoiceDate: string) {
    await updateOrderInvoice(orderId, invoiceNo, invoiceDate);
    getOrders().then(os => setOrders(os.filter((o: any) => o.status === "shipped" || o.status === "completed")));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">财务管理</h2>
        <div className="flex gap-2">
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}年</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({length:12},(_,i)=><SelectItem key={i+1} value={String(i+1)}>{i+1}月</SelectItem>)}
              <SelectItem value="0">全年</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 月度汇总 */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">收入</div><div className="text-2xl font-bold text-green-600">¥{totalIncome.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">支出</div><div className="text-2xl font-bold text-red-600">¥{totalExpense.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">结余</div><div className="text-2xl font-bold" style={{color: totalIncome - totalExpense >= 0 ? "#16a34a" : "#dc2626"}}>¥{(totalIncome - totalExpense).toFixed(2)}</div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="records">账目记录</TabsTrigger>
          <TabsTrigger value="invoice">发票管理</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <div className="mb-4">
            {!showForm ? (
              <button onClick={() => setShowForm(true)} className="inline-flex items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80">+ 新增记录</button>
            ) : (
              <form onSubmit={handleAdd} className="flex gap-2 items-end border rounded-lg p-4 bg-gray-50 flex-wrap">
                <div><Label>日期</Label><Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} required /></div>
                <div>
                  <Label>类型</Label>
                  <Select value={fType} onValueChange={(v: string) => { setFType(v); setFCat(v === "income" ? "销售收入" : "采购成本"); }}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="income">收入</SelectItem><SelectItem value="expense">支出</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>分类</Label>
                  <Select value={fCat} onValueChange={setFCat}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(fType === "income" ? incomeCategories : expenseCategories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>金额</Label><Input type="number" step="0.01" value={fAmt} onChange={e => setFAmt(e.target.value)} className="w-28" required /></div>
                <div><Label>备注</Label><Input value={fDesc} onChange={e => setFDesc(e.target.value)} className="w-40" /></div>
                <button type="submit" disabled={submitting} className="inline-flex items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80 disabled:opacity-50">{submitting ? "保存中" : "保存"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:underline">取消</button>
              </form>
            )}
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>日期</TableHead><TableHead>类型</TableHead><TableHead>分类</TableHead><TableHead className="text-right">金额</TableHead><TableHead>备注</TableHead><TableHead className="w-16">操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.date).toLocaleDateString("zh-CN")}</TableCell>
                  <TableCell><Badge variant="outline">{r.type === "income" ? "收入" : "支出"}</Badge></TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className={`text-right font-medium ${r.type === "income" ? "text-green-600" : "text-red-600"}`}>{r.type === "income" ? "+" : "-"}¥{r.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{r.description || "-"}</TableCell>
                  <TableCell><button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">删除</button></TableCell>
                </TableRow>
              ))}
              {records.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-400">暂无记录</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="invoice">
          <Table>
            <TableHeader><TableRow><TableHead>订单客户</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead><TableHead>发票状态</TableHead><TableHead>发票号</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>{o.customer.fullName}</TableCell>
                  <TableCell>¥{o.totalAmount.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline">{orderStatusMap[o.status] || o.status}</Badge></TableCell>
                  <TableCell>{o.invoiceStatus === "issued" ? "已开票" : "未开票"}</TableCell>
                  <TableCell className="text-sm">{o.invoiceNo || "-"}</TableCell>
                  <TableCell>
                    {o.invoiceStatus !== "issued" ? (
                      <InvoiceButton orderId={o.id} onDone={(no, date) => handleInvoice(o.id, no, date)} />
                    ) : (
                      <span className="text-xs text-gray-400">{o.invoiceDate ? new Date(o.invoiceDate).toLocaleDateString("zh-CN") : ""}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-400">暂无待处理订单</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvoiceButton({ orderId, onDone }: { orderId: string; onDone: (no: string, date: string) => void }) {
  const [show, setShow] = useState(false);
  const [no, setNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  if (!show) return <button onClick={() => setShow(true)} className="text-xs text-blue-600 hover:underline">录发票</button>;

  return (
    <div className="flex gap-1 items-center">
      <input type="text" value={no} onChange={e => setNo(e.target.value)} placeholder="发票号" className="border rounded px-1 py-0.5 text-xs w-24" />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-1 py-0.5 text-xs" />
      <button onClick={() => { onDone(no, date); setShow(false); }} className="text-xs text-green-600 hover:underline">保存</button>
    </div>
  );
}
