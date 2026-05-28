"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShoppingCart, Users, ClipboardList, Shield, DollarSign } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/login").then(r => r.json()).then(d => {
      setIsSuperAdmin(d.role === "super_admin");
    }).catch(() => {});
  }, []);

  const navItems = [
    { href: "/", label: "仪表盘", icon: ClipboardList },
    { href: "/customers", label: "客户管理", icon: Users },
    { href: "/products", label: "产品管理", icon: Package },
    { href: "/sales", label: "销售管理", icon: ShoppingCart },
    { href: "/finance", label: "财务管理", icon: DollarSign },
  ];

  return (
    <nav className="flex flex-col gap-1 p-4 pt-6">
      <h1 className="text-lg font-bold mb-4">百诺未来</h1>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${pathname === item.href ? "bg-gray-200 font-medium" : "hover:bg-gray-200"}`}>
          <item.icon className="w-4 h-4" />{item.label}
        </Link>
      ))}
      {isSuperAdmin && (
        <Link href="/admin"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${pathname === "/admin" ? "bg-gray-200 font-medium" : "hover:bg-gray-200"}`}>
          <Shield className="w-4 h-4" />用户管理
        </Link>
      )}
    </nav>
  );
}
