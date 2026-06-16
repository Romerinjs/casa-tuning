import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key

// Normalize document number by removing non-alphanumeric characters and lowercasing
export function normalizeDocument(docNumber: string): string {
  if (!docNumber) return "";
  return docNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

// Generate an irreversible SHA-256 hash (Blind Index) for search/unicity
export function hashDocument(docNumber: string): string {
  if (!docNumber) return "";
  const normalized = normalizeDocument(docNumber);
  return createHash("sha256").update(normalized).digest("hex");
}

// Check if a value matches SHA-256 hash format
export function isHashed(value: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(value || "");
}

// Encrypt a string using AES-256-CBC
export function encryptDocument(docNumber: string): string {
  if (!docNumber) return "";
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be defined and be exactly 32 characters long.");
  }
  
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(docNumber, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Return IV concatenated with ciphertext
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// Decrypt a string using AES-256-CBC
export function decryptDocument(encryptedData: string): string {
  if (!encryptedData) return "";
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be defined and be exactly 32 characters long.");
  }
  
  try {
    const parts = encryptedData.split(":");
    if (parts.length < 2) {
      // Fallback if data is not in encrypted format (e.g. legacy plain text)
      return encryptedData;
    }
    
    const iv = Buffer.from(parts.shift()!, "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const decipher = createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Failed to decrypt document number:", err);
    return "[Error Cifrado]";
  }
}
