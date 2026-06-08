"use client";

import { useRouter } from "next/navigation";
import { deleteOrder } from "@/lib/actions";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("确定删除吗？")) return;
    await deleteOrder(id);
    router.push("/sales");
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="inline-flex items-center justify-center rounded-lg border border-red-300 text-red-600 text-sm font-medium h-8 px-3 hover:bg-red-50">
      删除
    </button>
  );
}
