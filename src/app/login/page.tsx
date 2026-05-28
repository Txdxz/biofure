"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push("/"); router.refresh();
    } catch { setError("登录失败"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-xl font-bold text-center mb-6">百诺未来</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>用户名</Label><Input value={username} onChange={e => setUsername(e.target.value)} required autoFocus /></div>
          <div><Label>密码</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 hover:bg-primary/80 disabled:opacity-50">
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
