import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "super_admin") return NextResponse.json({ error: "无权访问" }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, username: true, role: true, createdAt: true } });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "super_admin") return NextResponse.json({ error: "无权访问" }, { status: 403 });
  const { username, password, role } = await request.json();
  if (!username || !password) return NextResponse.json({ error: "用户名和密码必填" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { username, passwordHash, role: role || "admin" } });
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { oldPassword, newPassword } = await request.json();
  if (!oldPassword || !newPassword) return NextResponse.json({ error: "请填写新旧密码" }, { status: 400 });
  const valid = await verifyPassword(oldPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "旧密码错误" }, { status: 400 });
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const currentUser = await getSession();
  if (!currentUser || currentUser.role !== "super_admin") return NextResponse.json({ error: "无权访问" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 400 });
  // 不能删除自己
  if (target.id === currentUser.id) return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
  // 检查是否是最后一个超管
  if (target.role === "super_admin") {
    const superAdminCount = await prisma.user.count({ where: { role: "super_admin" } });
    if (superAdminCount <= 1) return NextResponse.json({ error: "不能删除最后一个超管" }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
