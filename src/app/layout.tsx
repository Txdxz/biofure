import type { Metadata } from "next";
import "./globals.css";
import { PrintGuard } from "./print-guard";
import { seedDefaultAdmin } from "@/lib/seed";

export const metadata: Metadata = {
  title: "百诺未来业务管理系统",
  description: "Biofure Business Management System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Seed default admin on first load
  seedDefaultAdmin().catch(() => {});

  return (
    <html lang="zh-CN">
      <body className="antialiased font-sans">
        <PrintGuard>{children}</PrintGuard>
      </body>
    </html>
  );
}
