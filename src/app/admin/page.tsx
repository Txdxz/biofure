"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  // 修改密码
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setMsg("");
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, role }) });
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setUsername(""); setPassword(""); setRole("admin"); setMsg("用户已创建");
    loadUsers(); setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该用户？")) return;
    setError("");
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    loadUsers();
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(""); setPwdMsg("");
    if (!oldPwd || !newPwd) { setPwdError("请填写旧密码和新密码"); return; }
    const res = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }) });
    const data = await res.json();
    if (data.error) { setPwdError(data.error); return; }
    setOldPwd(""); setNewPwd(""); setPwdMsg("密码已修改");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">用户管理</h2>

      {/* 修改密码 */}
      <form onSubmit={handleChangePwd} className="flex gap-2 items-end border rounded-lg p-4 bg-gray-50 max-w-xl">
        <div><Label>旧密码</Label><Input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} /></div>
        <div><Label>新密码</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} /></div>
        <button type="submit" className="inline-flex items-center rounded-lg border border-border bg-background text-sm font-medium h-8 px-4 hover:bg-muted">修改密码</button>
        {pwdError && <span className="text-sm text-red-500">{pwdError}</span>}
        {pwdMsg && <span className="text-sm text-green-600">{pwdMsg}</span>}
      </form>

      {/* 新增用户 */}
      <form onSubmit={handleAdd} className="flex gap-2 items-end border rounded-lg p-4 bg-gray-50 max-w-2xl">
        <div><Label>用户名</Label><Input value={username} onChange={e => setUsername(e.target.value)} required /></div>
        <div><Label>密码</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
        <div>
          <Label>角色</Label>
          <select value={role} onChange={e => setRole(e.target.value)} className="border rounded-lg h-8 px-2 text-sm">
            <option value="admin">管理员</option>
            <option value="super_admin">超管</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="inline-flex items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-4 hover:bg-primary/80 disabled:opacity-50">
          {loading ? "创建中..." : "创建用户"}
        </button>
        {error && <span className="text-sm text-red-500">{error}</span>}
        {msg && <span className="text-sm text-green-600">{msg}</span>}
      </form>

      <Table>
        <TableHeader>
          <TableRow><TableHead>用户名</TableHead><TableHead>角色</TableHead><TableHead>创建时间</TableHead><TableHead className="w-20">操作</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u: any) => (
            <TableRow key={u.id}>
              <TableCell>{u.username}</TableCell>
              <TableCell><Badge variant="outline">{u.role === "super_admin" ? "超管" : "管理员"}</Badge></TableCell>
              <TableCell className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</TableCell>
              <TableCell><button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:underline">删除</button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
