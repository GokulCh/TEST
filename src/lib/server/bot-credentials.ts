/**
 * Bot account passwords are stored encrypted in the game config's `bots`. The
 * bot host decrypts them; the panel only ever writes them and never reads one
 * back. Format: `botcred:gcm:v2:` + base64(salt[16] + iv[12] + AES-GCM ciphertext),
 * key = PBKDF2-SHA256(BOT_CREDENTIAL_ENCRYPTION_KEY, salt, 100k rounds).
 */

export const CIPHER_PREFIX = "botcred:gcm:v2:";

function encryptionKey(): string {
  const key = process.env.BOT_CREDENTIAL_ENCRYPTION_KEY;
  if (!key) throw new Error("BOT_CREDENTIAL_ENCRYPTION_KEY must be set for bot password encryption");
  if (key.length < 32) throw new Error("BOT_CREDENTIAL_ENCRYPTION_KEY must be at least 32 characters");
  return key;
}

export async function encryptPassword(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(encryptionKey()), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext)));
  const out = new Uint8Array(salt.length + iv.length + sealed.length);
  out.set(salt);
  out.set(iv, salt.length);
  out.set(sealed, salt.length + iv.length);
  return CIPHER_PREFIX + btoa(String.fromCharCode(...out));
}
