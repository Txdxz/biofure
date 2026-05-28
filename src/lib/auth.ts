import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";

const SESSION_COOKIE = "biofure_session";

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return compare(password, hash);
}

export function createSession(userId: string) {
  const token = crypto.randomUUID();
  const sessionData = JSON.stringify({ userId, token, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(sessionData).toString("base64");
  cookies().set(SESSION_COOKIE, encoded, { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
}

export async function getSession() {
  const { prisma } = await import("./prisma");
  const cookie = cookies().get(SESSION_COOKIE);
  if (!cookie) return null;
  try {
    const data = JSON.parse(Buffer.from(cookie.value, "base64").toString());
    if (data.expires < Date.now()) return null;
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    return user;
  } catch { return null; }
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}
