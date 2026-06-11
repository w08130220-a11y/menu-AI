import { cookies } from "next/headers";
import { createHmac, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret-key";
const COOKIE_NAME = "bs_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export function hashPassword(password: string) {
  return createHash("sha256").update(`bs:${password}`).digest("hex");
}

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export async function createSession(staffId: string) {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = `${staffId}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
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
  if (sign(`${staffId}.${exp}`) !== sig) return null;
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
