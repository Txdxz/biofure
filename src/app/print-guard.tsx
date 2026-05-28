"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";

export function PrintGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPrint = pathname.includes("/print");
  const isLogin = pathname === "/login";
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    if (!isLogin && !isPrint) {
      fetch("/api/login").then(r => r.json()).then(d => {
        if (!d.error && d.username) setUser(d);
      }).catch(() => {});
    }
  }, [pathname, isLogin, isPrint]);

  if (isPrint || isLogin) {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col w-56 border-r bg-gray-50 shrink-0">
        <Sidebar />
        <div className="mt-auto p-4 border-t text-sm">
          {user && (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{user.username}</div>
                <div className="text-xs text-gray-400">{user.role === "super_admin" ? "超管" : "管理员"}</div>
              </div>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500">退出</button>
            </div>
          )}
        </div>
      </div>
      <main className="flex-1 p-6 min-w-0">{children}</main>
    </div>
  );
}
