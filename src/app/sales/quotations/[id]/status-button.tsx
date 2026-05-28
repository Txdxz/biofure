"use client";

import { updateQuotationStatus } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  const router = useRouter();
  async function handleClick() {
    await updateQuotationStatus(id, status);
    router.refresh();
  }
  return (
    <button onClick={handleClick} className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted">
      {label}
    </button>
  );
}
