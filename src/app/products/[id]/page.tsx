import { getProduct } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BatchForm from "@/components/batch-form";
import ProductForm from "@/components/product-form";
import Link from "next/link";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const stMap: Record<string, string> = { ordered: "已下单", arrived: "已到货", depleted: "已耗尽" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/products" className="text-sm text-gray-500 hover:underline">← 返回产品列表</Link>
          <h2 className="text-2xl font-bold">{product.name}</h2>
        </div>
        <div className="flex gap-2">
          <ProductForm defaultValues={product} />
          <BatchForm productId={product.id} />
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div><span className="text-gray-500">英文名：</span>{product.nameEn || "-"}</div>
          <div><span className="text-gray-500">分类：</span>{product.category || "-"}</div>
          <div><span className="text-gray-500">品牌：</span>{product.brand || "-"}</div>
          <div><span className="text-gray-500">规格/货号：</span>{product.specification || "-"}</div>
          <div><span className="text-gray-500">单位：</span>{product.unit}</div>
          <div><span className="text-gray-500">储存条件：</span>{product.storageCondition || "-"}</div>
        </CardContent>
      </Card>

      <h3 className="text-lg font-semibold mt-6">批次管理</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>批号</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>供应商</TableHead>
            <TableHead>有效期</TableHead>
            <TableHead>下单日期</TableHead>
            <TableHead>采购价</TableHead>
            <TableHead>库存量</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {product.batches.map((b: any) => {
            const pp = b.price ? { price: b.price } : null;
            return (
            <TableRow key={b.id}>
              <TableCell className="font-mono">{b.batchNumber}</TableCell>
              <TableCell><span className={`px-2 py-0.5 rounded text-xs ${b.status === "ordered" ? "bg-yellow-100 text-yellow-800" : b.status === "depleted" ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-800"}`}>{stMap[b.status] || b.status}</span></TableCell>
              <TableCell>{b.supplier?.shortName || b.supplier?.fullName || "-"}</TableCell>
              <TableCell>{new Date(b.expiryDate).toLocaleDateString("zh-CN")}</TableCell>
              <TableCell>{b.orderDate ? new Date(b.orderDate).toLocaleDateString("zh-CN") : "-"}</TableCell>
              <TableCell>{pp ? `¥${pp.price.toFixed(2)}` : "-"}</TableCell>
              <TableCell>{b.quantity}</TableCell>
              <TableCell><BatchForm productId={product.id} defaultValues={b} /></TableCell>
            </TableRow>
            );})}
          {product.batches.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-gray-400">暂无批次</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">采购价记录</h3>
            <Table>
              <TableHeader><TableRow><TableHead>供应商</TableHead><TableHead>单价</TableHead><TableHead>日期</TableHead></TableRow></TableHeader>
              <TableBody>
                {product.purchasePrices.map((pp: any) => (
                  <TableRow key={pp.id}>
                    <TableCell>{pp.supplier.shortName || pp.supplier.fullName}</TableCell>
                    <TableCell>¥{pp.price.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{new Date(pp.validFrom).toLocaleDateString("zh-CN")}</TableCell>
                  </TableRow>
                ))}
                {product.purchasePrices.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-400">暂无</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">出货价记录</h3>
            <Table>
              <TableHeader><TableRow><TableHead>客户</TableHead><TableHead>单价</TableHead><TableHead>日期</TableHead></TableRow></TableHeader>
              <TableBody>
                {product.sellPrices.map((sp: any) => (
                  <TableRow key={sp.id}>
                    <TableCell>{sp.customer?.fullName || "标准价"}</TableCell>
                    <TableCell>¥{sp.price.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{new Date(sp.validFrom).toLocaleDateString("zh-CN")}</TableCell>
                  </TableRow>
                ))}
                {product.sellPrices.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-400">暂无</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
