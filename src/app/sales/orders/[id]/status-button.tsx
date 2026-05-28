"use client";

import { updateOrderStatus } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function OrderStatusButton({ id, status, label, variant }: { id: string; status: string; label: string; variant: "default" | "outline" }) {
  const router = useRouter();
  async function handleClick() {
    await updateOrderStatus(id, status);
    router.refresh();
  }
  const cls = variant === "default"
    ? "inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80"
    : "inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-3 hover:bg-muted";
  return <button onClick={handleClick} className={cls}>{label}</button>;
}
