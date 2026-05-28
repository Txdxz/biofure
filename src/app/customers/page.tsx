import { getCustomers } from "@/lib/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerForm from "@/components/customer-form";
import Link from "next/link";

const typeMap: Record<string, string> = { client: "客户", supplier: "供应商", both: "两者" };
const statusMap: Record<string, string> = { active: "活跃", dormant: "休眠", potential: "潜在" };
const levelColors: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-gray-100 text-gray-800",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { search?: string; type?: string; level?: string; status?: string };
}) {
  const search = searchParams.search || "";
  const type = searchParams.type || "";
  const level = searchParams.level || "";
  const status = searchParams.status || "";
  const customers = await getCustomers(search, type, level, status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">客户管理</h2>
        <CustomerForm />
      </div>

      <form className="flex gap-4 items-end" method="GET">
        <div>
          <Input name="search" placeholder="搜索公司名称..." defaultValue={search} className="max-w-xs" />
        </div>
        <Select name="type" defaultValue={type}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="client">下游客户</SelectItem>
            <SelectItem value="supplier">供应商</SelectItem>
            <SelectItem value="both">两者都是</SelectItem>
          </SelectContent>
        </Select>
        <Select name="level" defaultValue={level}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="分级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C">C</SelectItem>
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={status}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">活跃</SelectItem>
            <SelectItem value="dormant">休眠</SelectItem>
            <SelectItem value="potential">潜在</SelectItem>
          </SelectContent>
        </Select>
        <button type="submit" className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">
          搜索
        </button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>公司全称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>行业</TableHead>
            <TableHead>分级</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>来源</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline font-medium">
                  {c.fullName}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{typeMap[c.type] || c.type}</Badge>
              </TableCell>
              <TableCell>{c.industry || "-"}</TableCell>
              <TableCell>
                <span className={`px-2 py-0.5 rounded text-xs ${levelColors[c.level] || ""}`}>
                  {c.level}
                </span>
              </TableCell>
              <TableCell>
                {statusMap[c.status] || c.status}
              </TableCell>
              <TableCell>{c.source || "-"}</TableCell>
            </TableRow>
          ))}
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400">
                暂无数据，点击右上角"新增客户"开始
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
