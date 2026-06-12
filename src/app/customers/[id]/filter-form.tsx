"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchSelect } from "@/components/ui/search-select";

interface FilterFormProps {
  products: { id: string; name: string }[];
}

export function FilterForm({ products }: FilterFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const productId = searchParams.get("productId") || "";
  const filter = searchParams.get("filter") || "all";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    formData.forEach((value, key) => {
      if (value) params.set(key, String(value));
    });
    router.push(`?${params.toString()}`);
  }

  return (
    <form className="flex gap-2 items-end flex-wrap" onSubmit={handleSubmit}>
      <div><span className="text-xs text-gray-500 block mb-1">开始日期</span><Input name="dateFrom" type="date" className="w-36" defaultValue={dateFrom} /></div>
      <div><span className="text-xs text-gray-500 block mb-1">结束日期</span><Input name="dateTo" type="date" className="w-36" defaultValue={dateTo} /></div>
      <div className="w-48">
        <span className="text-xs text-gray-500 block mb-1">产品</span>
        <SearchSelect options={products} value={productId} onChange={(v) => {
          const params = new URLSearchParams(searchParams);
          if (v) params.set("productId", v);
          else params.delete("productId");
          router.push(`?${params.toString()}`);
        }} placeholder="搜索或选择产品..." disabled={false} />
      </div>
      <Select name="filter" defaultValue={filter} onValueChange={(v) => {
        const params = new URLSearchParams(searchParams);
        if (v && v !== "all") params.set("filter", v);
        else params.delete("filter");
        router.push(`?${params.toString()}`);
      }}>
        <SelectTrigger className="w-36"><SelectValue placeholder="筛选" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          <SelectItem value="订单">订单</SelectItem>
          <SelectItem value="待确认">待确认</SelectItem>
          <SelectItem value="已确认">已确认</SelectItem>
          <SelectItem value="已发货">已发货</SelectItem>
          <SelectItem value="已完成">已完成</SelectItem>
          <SelectItem value="已取消">已取消</SelectItem>
        </SelectContent>
      </Select>
      <button type="submit" className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 h-8">筛选</button>
      {(dateFrom || dateTo || filter !== "all" || productId) && <a href={`/customers/${searchParams.get("id") || ""}`} className="text-xs text-gray-400 hover:underline">清除筛选</a>}
    </form>
  );
}