import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "bs_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 天

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s === "change-me-in-production") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET 未設定：正式環境必須設定強隨機密鑰");
    }
    return "dev-secret-key";
  }
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function createSession(staffId: string) {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = `${staffId}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [staffId, exp, sig] = parts;
  const expected = Buffer.from(sign(`${staffId}.${exp}`));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  if (Number(exp) < Date.now()) return null;
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { store: true },
  });
  if (!staff || !staff.active) return null;
  return staff;
}

export async function requireSession() {
  const staff = await getSession();
  if (!staff) throw new Error("UNAUTHORIZED");
  return staff;
}

export function isManager(staff: { role: string }) {
  return staff.role === "ADMIN" || staff.role === "MANAGER";
}

export { hashPassword, verifyPassword } from "@/lib/password";
