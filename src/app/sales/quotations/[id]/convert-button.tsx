"use client";

import { useRouter } from "next/navigation";
import { createOrderFromQuotation } from "@/lib/actions";

export default function ConvertToOrderButton({ quotationId }: { quotationId: string }) {
  const router = useRouter();

  async function handleConvert() {
    const order = await createOrderFromQuotation(quotationId);
    router.push(`/sales/orders/${order.id}`);
    router.refresh();
  }

  return (
    <button onClick={handleConvert} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-green-600 text-white text-sm font-medium h-8 px-3 hover:bg-green-700">
      转为订单
    </button>
  );
}
