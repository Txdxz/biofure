import { getProducts } from "@/lib/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductForm from "@/components/product-form";
import Pagination from "@/components/ui/pagination";
import Link from "next/link";

export default async function ProductsPage({ searchParams }: { searchParams: { search?: string; category?: string; page?: string } }) {
  const search = searchParams.search || "";
  const category = searchParams.category || "";
  const page = Number(searchParams.page) || 1;
  const { items: products, total } = await getProducts(search, category, page, 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">产品管理</h2>
        <ProductForm />
      </div>

      <form className="flex gap-4 items-end" method="GET">
        <div><Input name="search" placeholder="搜索产品名称/货号..." defaultValue={search} className="max-w-xs" /></div>
        <Select name="category" defaultValue={category}>
          <SelectTrigger className="w-32"><SelectValue placeholder="分类" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="标准品">标准品</SelectItem>
            <SelectItem value="试剂">试剂</SelectItem>
            <SelectItem value="色谱柱">色谱柱</SelectItem>
            <SelectItem value="耗材">耗材</SelectItem>
            <SelectItem value="血清">血清</SelectItem>
          </SelectContent>
        </Select>
        <button type="submit" className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">搜索</button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>产品名称</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>品牌</TableHead>
            <TableHead>规格</TableHead>
            <TableHead>单位</TableHead>
            <TableHead>库存总量</TableHead>
            <TableHead className="w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const totalStock = p.batches.reduce((sum, b) => sum + b.quantity, 0);
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/products/${p.id}`} className="text-blue-600 hover:underline font-medium">{p.name}</Link>
                </TableCell>
                <TableCell>{p.category || "-"}</TableCell>
                <TableCell>{p.brand || "-"}</TableCell>
                <TableCell>{p.specification || "-"}</TableCell>
                <TableCell>{p.unit}</TableCell>
                <TableCell>{totalStock}</TableCell>
                <TableCell><ProductForm defaultValues={p} /></TableCell>
              </TableRow>
            );
          })}
          {products.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-gray-400">暂无数据</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination total={total} page={page} basePath="/products" />
    </div>
  );
}
