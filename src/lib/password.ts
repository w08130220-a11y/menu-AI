import { scryptSync, randomBytes, timingSafeEqual, createHash } from "crypto";

// scrypt + 每帳號隨機鹽值。格式：s2:<salt hex>:<hash hex>
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s2:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  try {
    if (stored.startsWith("s2:")) {
      const [, salt, hash] = stored.split(":");
      const computed = scryptSync(password, salt, 64);
      const expected = Buffer.from(hash, "hex");
      return computed.length === expected.length && timingSafeEqual(computed, expected);
    }
    // 相容舊版（無鹽 sha256），登入成功後會自動升級
    const legacy = createHash("sha256").update(`bs:${password}`).digest();
    const expected = Buffer.from(stored, "hex");
    return legacy.length === expected.length && timingSafeEqual(legacy, expected);
  } catch {
    return false;
  }
}

export function isLegacyHash(stored: string) {
  return !stored.startsWith("s2:");
}
