"use server";

import { prisma } from "./prisma";
import { hashPassword } from "./auth";

export async function seedDefaultAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: "super_admin" } });
  if (!existing) {
    const passwordHash = await hashPassword("admin123");
    await prisma.user.create({ data: { username: "admin", passwordHash, role: "super_admin" } });
    return { created: true, message: "默认超管已创建: admin / admin123" };
  }
  return { created: false, message: "超管已存在" };
}
