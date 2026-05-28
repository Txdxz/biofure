"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Package, ClipboardList, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getDashboardStats } from "@/lib/actions";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const statusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    getDashboardStats(month, year).then(setStats);
  }, [month, year]);

  if (!stats) return <div className="p-8 text-gray-400">加载中...</div>;

  const catData = Object.entries(stats.categorySales).map(([name, value]) => ({ name, value }));
  const customerData = Object.entries(stats.customerSales as Record<string, { name: string; amount: number }>)
    .map(([, v]) => ({ name: v.name, value: v.amount }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const totalSales = customerData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">仪表盘</h2>
        <div className="flex gap-2 items-center">
          <Select value={String(year)} onValueChange={(v) => v && setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}年</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({length:12}, (_,i) => <SelectItem key={i+1} value={String(i+1)}>{i+1}月</SelectItem>)}
              <SelectItem value="0">全年</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Link href="/customers"><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-gray-500">活跃客户</CardTitle><Users className="w-4 h-4 text-gray-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.customerCount}</div></CardContent></Card></Link>
        <Link href="/products"><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-gray-500">产品总数</CardTitle><Package className="w-4 h-4 text-gray-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.productCount}</div></CardContent></Card></Link>
        <Link href="/sales"><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-gray-500">待处理订单</CardTitle><ClipboardList className="w-4 h-4 text-gray-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingOrderCount}</div></CardContent></Card></Link>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-gray-500">{month === 0 ? `${year}年` : `${month}月`}营收 / 利润</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">¥{(stats.monthRevenue||0).toFixed(0)} <span className="text-sm font-normal text-green-600">/ ¥{(stats.monthProfit||0).toFixed(0)}</span></div></CardContent></Card>
      </div>

      {/* 月度营收利润柱状图 */}
      <Card>
        <CardHeader><CardTitle>{year}年月度营收与利润</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={m => m+"月"} />
              <YAxis />
              <Tooltip formatter={(v) => `¥${Number(v).toFixed(0)}`} />
              <Bar dataKey="revenue" name="营收" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="profit" name="利润" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* 产品分类饼图 */}
        <Card>
          <CardHeader><CardTitle>{month === 0 ? `${year}年` : `${month}月`}产品销售分类占比</CardTitle></CardHeader>
          <CardContent>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${((percent||0)*100).toFixed(0)}%`}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `¥${Number(v).toFixed(0)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-center py-12">暂无数据</p>}
          </CardContent>
        </Card>

        {/* 客户销售额占比 */}
        <Card>
          <CardHeader><CardTitle>{month === 0 ? `${year}年` : `${month}月`}客户销售额占比</CardTitle></CardHeader>
          <CardContent>
            {customerData.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>客户</TableHead><TableHead className="text-right">金额</TableHead><TableHead className="text-right">占比</TableHead></TableRow></TableHeader>
                <TableBody>
                  {customerData.map((c: any) => (
                    <TableRow key={c.name}>
                      <TableCell className="text-sm">{c.name}</TableCell>
                      <TableCell className="text-right">¥{c.value.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{(c.value / totalSales * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-gray-400 text-center py-12">暂无数据</p>}
          </CardContent>
        </Card>
      </div>

      {/* 最近订单 & 效期预警 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>最近订单</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>客户</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
              <TableBody>
                {stats.recentOrders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell><Link href={`/sales/orders/${o.id}`} className="text-blue-600 hover:underline">{o.customer.fullName}</Link></TableCell>
                    <TableCell>¥{o.totalAmount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{statusMap[o.status] || o.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {stats.recentOrders.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-400">暂无订单</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />效期预警（90天内过期）</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>产品</TableHead><TableHead>批号</TableHead><TableHead>有效期</TableHead><TableHead>库存</TableHead></TableRow></TableHeader>
              <TableBody>
                {stats.expiringBatches.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.product.name}</TableCell>
                    <TableCell>{b.batchNumber}</TableCell>
                    <TableCell className="text-amber-600">{new Date(b.expiryDate).toLocaleDateString("zh-CN")}</TableCell>
                    <TableCell>{b.quantity}</TableCell>
                  </TableRow>
                ))}
                {stats.expiringBatches.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-gray-400">暂无临期产品</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
