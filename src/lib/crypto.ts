import crypto from "crypto";

// Kunci enkripsi AES-256 untuk penyimpanan PII (users_mahasiswa) dan cerita klien (intake_assessments)
const SECRET_PASSPHRASE =
  process.env.KONSELIN_AES_SECRET ||
  "konselin-cc-chatbox-aes256-campus-counseling-secret-key-2026";

function getKey(): Buffer {
  return crypto.createHash("sha256").update(SECRET_PASSPHRASE).digest();
}

/**
 * Mengenkripsi teks sensitif (NIM, Nama Asli, No WA, Cerita Klien) menggunakan AES-256-GCM
 */
export function encryptAES256(plainText: string): string {
  if (!plainText) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `AES256:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Mendekripsi teks terenkripsi AES-256-GCM (Hanya dipanggil untuk Konselor berwenang sesuai RBAC)
 */
export function decryptAES256(cipherPayload: string): string {
  if (!cipherPayload) return "";
  if (!cipherPayload.startsWith("AES256:")) {
    return cipherPayload;
  }
  try {
    const parts = cipherPayload.split(":");
    if (parts.length !== 4) return "[Terproteksi Enkripsi]";
    const iv = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const encryptedText = Buffer.from(parts[3], "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return "[Gagal Dekripsi - Kunci Tidak Valid]";
  }
}

