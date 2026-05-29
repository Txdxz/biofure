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
import InvoiceButton from "@/app/sales/invoice-button";

const incomeCategories = ["销售收入", "服务费", "其他收入"];
const expenseCategories = ["采购成本", "房租", "工资", "物流", "差旅", "办公用品", "外包服务", "税费", "其他"];
const orderStatusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };

export default function FinancePage() {
  const [tab, setTab] = useState("records");
  const [records, setRecords] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [collectedIncome, setCollectedIncome] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [orders, setOrders] = useState<any[]>([]);
  // 筛选
  const [orderFilter, setOrderFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // 发票筛选
  const [invCustomer, setInvCustomer] = useState("");
  const [invStatus, setInvStatus] = useState("all");
  // 新增账目
  const [showForm, setShowForm] = useState(false);
  const [fType, setFType] = useState("expense");
  const [fCat, setFCat] = useState("采购成本");
  const [fAmt, setFAmt] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const selCls = "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm";

  useEffect(() => { loadData(); loadOrders(); }, [month, year, orderFilter, typeFilter, catFilter, dateFrom, dateTo]);

  async function loadData() {
    const data = await getFinanceRecords(month, year, orderFilter === "all" ? undefined : orderFilter, typeFilter === "all" ? undefined : typeFilter, catFilter === "all" ? undefined : catFilter, dateFrom || undefined, dateTo || undefined);
    setRecords(data.records);
    setTotalIncome(data.totalIncome);
    setTotalExpense(data.totalExpense);
    setCollectedIncome(data.collectedIncome);
  }

  async function loadOrders() {
    const os = await getOrders();
    setOrders(os.filter((o: any) => o.status === "shipped" || o.status === "completed" || o.status === "cancelled"));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    await createFinanceRecord({ date: fDate, type: fType, category: fCat, amount: Number(fAmt), description: fDesc || undefined });
    setShowForm(false); setFAmt(""); setFDesc(""); loadData(); setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除？")) return;
    await deleteFinanceRecord(id); loadData();
  }

  // 发票筛选
  let invOrders = orders;
  if (invCustomer) invOrders = invOrders.filter((o: any) => o.customer?.fullName?.includes(invCustomer));
  if (invStatus === "shipped") invOrders = invOrders.filter((o: any) => o.status === "shipped");
  else if (invStatus === "completed") invOrders = invOrders.filter((o: any) => o.status === "completed");
  else if (invStatus === "cancelled") invOrders = invOrders.filter((o: any) => o.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">财务管理</h2>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={selCls}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selCls}>
            {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}月</option>)}
            <option value="0">全年</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">总营收</div><div className="text-2xl font-bold">¥{totalIncome.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">已回款</div><div className="text-2xl font-bold text-green-600">¥{collectedIncome.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">未回款</div><div className="text-2xl font-bold text-amber-600">¥{(totalIncome - collectedIncome).toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">结余</div><div className="text-2xl font-bold" style={{color: totalIncome - totalExpense >= 0 ? "#16a34a" : "#dc2626"}}>¥{(totalIncome - totalExpense).toFixed(2)}</div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <TabsList><TabsTrigger value="records">账目记录</TabsTrigger><TabsTrigger value="invoice">发票管理</TabsTrigger></TabsList>

        <TabsContent value="records">
          {/* 筛选栏 */}
          <div className="flex gap-2 items-end flex-wrap mb-4">
            <div><span className="text-xs text-gray-500">开始</span><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-32" /></div>
            <div><span className="text-xs text-gray-500">结束</span><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-32" /></div>
            <div>
              <span className="text-xs text-gray-500">类型</span>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selCls}>
                <option value="all">全部</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </div>
            <div>
              <span className="text-xs text-gray-500">分类</span>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className={selCls}>
                <option value="all">全部</option>
                {[...incomeCategories, ...expenseCategories].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <span className="text-xs text-gray-500">订单状态</span>
              <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)} className={selCls}>
                <option value="all">全部</option>
                <option value="normal">订单正常</option>
                <option value="cancelled">订单取消</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            {!showForm ? (
              <button onClick={() => setShowForm(true)} className="inline-flex items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80">+ 新增记录</button>
            ) : (
              <form onSubmit={handleAdd} className="flex gap-2 items-end border rounded-lg p-4 bg-gray-50 flex-wrap">
                <div><Label>日期</Label><Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} required /></div>
                <div><Label>类型</Label><select value={fType} onChange={e => { setFType(e.target.value); setFCat(e.target.value === "income" ? "销售收入" : "采购成本"); }} className={selCls}><option value="income">收入</option><option value="expense">支出</option></select></div>
                <div><Label>分类</Label><select value={fCat} onChange={e => setFCat(e.target.value)} className={selCls}>{(fType === "income" ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><Label>金额</Label><Input type="number" step="0.01" value={fAmt} onChange={e => setFAmt(e.target.value)} className="w-28" required /></div>
                <div><Label>备注</Label><Input value={fDesc} onChange={e => setFDesc(e.target.value)} className="w-40" /></div>
                <button type="submit" disabled={submitting} className="inline-flex items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80 disabled:opacity-50">{submitting ? "保存中" : "保存"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:underline">取消</button>
              </form>
            )}
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>日期</TableHead><TableHead>类型</TableHead><TableHead>分类</TableHead><TableHead className="text-right">金额</TableHead><TableHead>备注</TableHead><TableHead>订单状态</TableHead><TableHead>回款状态</TableHead><TableHead className="w-16">操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.date).toLocaleDateString("zh-CN")}</TableCell>
                  <TableCell><Badge variant="outline">{r.type === "income" ? "收入" : "支出"}</Badge></TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className={`text-right font-medium ${r.type === "income" ? "text-green-600" : "text-red-600"}`}>{r.type === "income" ? "+" : "-"}¥{r.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{r.description || "-"}</TableCell>
                  <TableCell>
                    {r.orderStatus === "cancelled" ? <Badge variant="outline" className="text-red-500 border-red-300">订单取消</Badge> : r.orderStatus ? <Badge variant="outline">正常</Badge> : <span className="text-xs text-gray-400">-</span>}
                  </TableCell>
                  <TableCell>{r.paymentStatus || "-"}</TableCell>
                  <TableCell><button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">删除</button></TableCell>
                </TableRow>
              ))}
              {records.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-400">暂无记录</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="invoice">
          {/* 发票筛选 */}
          <div className="flex gap-2 items-end mb-4">
            <div><span className="text-xs text-gray-500">客户</span><Input value={invCustomer} onChange={e => setInvCustomer(e.target.value)} placeholder="输入客户名筛选" className="w-48" /></div>
            <div>
              <span className="text-xs text-gray-500">状态</span>
              <select value={invStatus} onChange={e => setInvStatus(e.target.value)} className={selCls}>
                <option value="all">全部</option>
                <option value="shipped">已发货</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>订单客户</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead><TableHead>发票状态</TableHead><TableHead>发票号</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {invOrders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>{o.customer.fullName}</TableCell>
                  <TableCell>¥{o.totalAmount.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline">{orderStatusMap[o.status] || o.status}</Badge></TableCell>
                  <TableCell>{o.invoiceStatus === "issued" ? "已开票" : "未开票"}</TableCell>
                  <TableCell className="text-sm">{o.invoiceNo || "-"}</TableCell>
                  <TableCell>
                    {o.invoiceStatus !== "issued" && o.status !== "cancelled" ? <InvoiceButton orderId={o.id} /> : o.invoiceDate ? new Date(o.invoiceDate).toLocaleDateString("zh-CN") : o.status === "cancelled" ? <Badge variant="outline" className="text-red-500 text-xs">已取消</Badge> : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {invOrders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-400">暂无</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
