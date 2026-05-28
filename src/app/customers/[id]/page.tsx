import { getCustomer } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ContactForm from "@/components/contact-form";
import CustomerForm from "@/components/customer-form";
import Link from "next/link";

const typeMap: Record<string, string> = { client: "客户", supplier: "供应商", both: "两者" };
const statusMap: Record<string, string> = { active: "活跃", dormant: "休眠", potential: "潜在" };
const orderStatusMap: Record<string, string> = { pending: "待确认", confirmed: "已确认", shipped: "已发货", completed: "已完成", cancelled: "已取消" };
const qStatusMap: Record<string, string> = { draft: "草稿", sent: "已发出", confirmed: "已确认", expired: "已过期", converted: "已转订单" };

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/customers" className="text-sm text-gray-500 hover:underline">← 返回客户列表</Link>
          <h2 className="text-2xl font-bold">{customer.fullName}</h2>
        </div>
        <CustomerForm defaultValues={customer} />
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="contacts">联系人 ({customer.contacts.length})</TabsTrigger>
          <TabsTrigger value="orders">订单 ({customer.orders.length})</TabsTrigger>
          <TabsTrigger value="quotations">报价 ({customer.quotations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6">
              <div><span className="text-gray-500">简称：</span>{customer.shortName || "-"}</div>
              <div><span className="text-gray-500">统一社会信用代码：</span>{customer.uscc || "-"}</div>
              <div><span className="text-gray-500">类型：</span>{typeMap[customer.type]}</div>
              <div><span className="text-gray-500">行业：</span>{customer.industry || "-"}</div>
              <div><span className="text-gray-500">分级：</span>{customer.level}</div>
              <div><span className="text-gray-500">状态：</span>{statusMap[customer.status]}</div>
              <div><span className="text-gray-500">来源：</span>{customer.source || "-"}</div>
              <div className="col-span-2"><span className="text-gray-500">地址：</span>{customer.address || "-"}</div>
              <div className="col-span-2"><span className="text-gray-500">银行账户：</span>{customer.bankAccount || "-"}</div>
              <div className="col-span-2"><span className="text-gray-500">备注：</span>{customer.remark || "-"}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="mb-4"><ContactForm customerId={customer.id} /></div>
          <Table>
            <TableHeader><TableRow><TableHead>姓名</TableHead><TableHead>职务</TableHead><TableHead>电话</TableHead><TableHead>微信</TableHead><TableHead>邮箱</TableHead><TableHead>主要联系人</TableHead><TableHead className="w-24">操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {customer.contacts.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell><TableCell>{c.position || "-"}</TableCell><TableCell>{c.phone || "-"}</TableCell><TableCell>{c.wechat || "-"}</TableCell><TableCell>{c.email || "-"}</TableCell><TableCell>{c.isPrimary ? "是" : ""}</TableCell>
                  <TableCell><ContactForm customerId={customer.id} defaultValues={c} /></TableCell>
                </TableRow>
              ))}
              {customer.contacts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-400">暂无联系人</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="orders">
          <Table>
            <TableHeader><TableRow><TableHead>日期</TableHead><TableHead>合同编号</TableHead><TableHead>总金额</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
            <TableBody>
              {customer.orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell><Link href={`/sales/orders/${o.id}`} className="text-blue-600 hover:underline">{new Date(o.date).toLocaleDateString("zh-CN")}</Link></TableCell>
                  <TableCell className="font-mono text-sm">{o.contractNo || "-"}</TableCell>
                  <TableCell>¥{o.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{orderStatusMap[o.status] || o.status}</TableCell>
                </TableRow>
              ))}
              {customer.orders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-gray-400">暂无订单</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="quotations">
          <Table>
            <TableHeader><TableRow><TableHead>日期</TableHead><TableHead>总金额</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
            <TableBody>
              {customer.quotations.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell><Link href={`/sales/quotations/${q.id}`} className="text-blue-600 hover:underline">{new Date(q.date).toLocaleDateString("zh-CN")}</Link></TableCell>
                  <TableCell>¥{q.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{qStatusMap[q.status] || q.status}</TableCell>
                </TableRow>
              ))}
              {customer.quotations.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-400">暂无报价</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
