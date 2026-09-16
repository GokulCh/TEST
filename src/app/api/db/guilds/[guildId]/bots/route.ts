/**
 * /api/db/guilds/[guildId]/bots
 *
 * GET  → returns bots for the guild (without passwords)
 * PUT  → saves bots for the guild (encrypts passwords before saving)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";
import type { BotStoredConfig, BotConfigInput } from "@/lib/db-types";
import type { BotStatus } from "@/lib/db-types";

type Params = { params: Promise<{ guildId: string }> };

// Encryption key from environment variable
const ENCRYPTION_KEY = process.env.BOT_CREDENTIAL_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn("BOT_CREDENTIAL_ENCRYPTION_KEY not set - bot passwords will not be encrypted");
}

/**
 * Simple AES-GCM encryption for bot passwords
 * In production, this should use a proper crypto library
 */
async function encryptPassword(plaintext: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    // Fallback: store as-is if no encryption key (not recommended for production)
    return plaintext;
  }

  try {
    // Convert key and plaintext to buffers
    const keyBuffer = new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const plaintextBuffer = new TextEncoder().encode(plaintext);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      plaintextBuffer
    );
    
    // Combine IV and ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Convert to base64 with prefix
    const base64 = btoa(String.fromCharCode(...combined));
    return `botcred:gcm:${base64}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypt bot password (only used internally, never exposed to client)
 */
async function decryptPassword(ciphertext: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    return ciphertext;
  }

  if (!ciphertext.startsWith('botcred:gcm:')) {
    // Legacy format or unencrypted
    return ciphertext;
  }

  try {
    const base64 = ciphertext.replace('botcred:gcm:', '');
    const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const keyBuffer = new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt password');
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId } = await params;

  try {
    const meta = await dbApi.gameMeta.get(guildId);
    const bots = meta.bots || [];
    
    // Return bots without password ciphertexts (security)
    const safeBots = bots.map((bot: BotStoredConfig) => ({
      username: bot.username,
      stable_id: bot.stable_id,
      status: bot.status,
      is_enabled: bot.is_enabled,
      tier: bot.tier,
      has_password: !!bot.password_ciphertext,
    }));
    
    return NextResponse.json({ data: safeBots });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Failed to fetch bots" },
      { status },
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId } = await params;

  let body: { bots: BotConfigInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bots } = body;

  try {
    // Get existing bots to preserve unchanged passwords
    const meta = await dbApi.gameMeta.get(guildId);
    const existingBots: BotStoredConfig[] = meta.bots || [];
    
    // Process bots: encrypt new passwords, preserve existing ones
    const processedBots: BotStoredConfig[] = await Promise.all(
      bots.map(async (botInput: BotConfigInput, index: number) => {
        const existingBot = existingBots[index];
        
        let passwordCiphertext: string | undefined;
        let passwordSetAt: string | undefined;
        
        if (botInput.password && botInput.password.trim() !== '') {
          // New password provided - encrypt it
          passwordCiphertext = await encryptPassword(botInput.password);
          passwordSetAt = new Date().toISOString();
        } else if (existingBot?.password_ciphertext) {
          // No new password - preserve existing
          passwordCiphertext = existingBot.password_ciphertext;
          passwordSetAt = existingBot.password_set_at;
        }
        
        return {
          username: botInput.username,
          stable_id: botInput.stable_id,
          status: botInput.status,
          is_enabled: botInput.is_enabled,
          tier: botInput.tier,
          password_ciphertext: passwordCiphertext || null,
          password_set_at: passwordSetAt || null,
        };
      })
    );
    
    await dbApi.gameMeta.saveBots(guildId, processedBots);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[bots PUT]', err);
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Failed to save bots" },
      { status },
    );
  }
}