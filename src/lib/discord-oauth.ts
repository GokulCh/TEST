/**
 * Discord OAuth2 helpers for the configuration panel.
 * Handles the authorization URL, token exchange, user info fetch,
 * and guild list fetch — all server-side (no secrets in the browser).
 */

const DISCORD_API = "https://discord.com/api/v10";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
}

/** Partial guild object returned by GET /users/@me/guilds */
export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  /** Bitfield of permissions the user has in this guild */
  permissions: string;
  features: string[];
}

// ── Config helpers ─────────────────────────────────────────────────────────────

function clientId(): string {
  const v = process.env.DISCORD_CLIENT_ID;
  if (!v) throw new Error("DISCORD_CLIENT_ID is not set");
  return v;
}

function clientSecret(): string {
  const v = process.env.DISCORD_CLIENT_SECRET;
  if (!v) throw new Error("DISCORD_CLIENT_SECRET is not set");
  return v;
}

function redirectUri(): string {
  const v = process.env.DISCORD_REDIRECT_URI;
  if (!v) throw new Error("DISCORD_REDIRECT_URI is not set");
  return v;
}

// ── OAuth2 flow ────────────────────────────────────────────────────────────────

/**
 * Builds the Discord authorization URL.
 * The `state` parameter is a random CSRF token the caller should store in a
 * short-lived cookie and verify when the callback fires.
 */
export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "identify guilds email",
    state,
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchanges an authorization code for an access + refresh token pair.
 * Call this from the /api/auth/callback route only (server-side).
 */
export async function exchangeCode(code: string): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
  });

  const res = await fetchWithRetry(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  return res.json() as Promise<DiscordTokenResponse>;
}

/**
 * Refreshes an expired access token using the stored refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetchWithRetry(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  return res.json() as Promise<DiscordTokenResponse>;
}

/**
 * Revokes a token (call on logout).
 */
export async function revokeToken(token: string): Promise<void> {
  const body = new URLSearchParams({
    client_id: clientId(),
    client_secret: clientSecret(),
    token,
  });

  await fetch(`${DISCORD_API}/oauth2/token/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  // Best-effort — ignore errors (token may already be expired)
}

// ── Discord API fetchers ───────────────────────────────────────────────────────

/**
 * Sleep for a specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper function to handle Discord API rate limits with exponential backoff.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 5,
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    
    if (res.ok) {
      return res;
    }
    
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const delayMs = retryAfter 
        ? parseInt(retryAfter, 10) * 1000 
        : Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
      
      console.warn(`[Discord API] Rate limited (429). Retrying after ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await sleep(delayMs);
      continue;
    }
    
    if (res.status >= 500 && attempt < maxRetries) {
      const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.warn(`[Discord API] Server error (${res.status}). Retrying after ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await sleep(delayMs);
      continue;
    }
    
    lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    break;
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Fetches the authenticated Discord user from GET /users/@me.
 */
export async function fetchDiscordUser(
  accessToken: string,
): Promise<DiscordUser> {
  const res = await fetchWithRetry(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return res.json() as Promise<DiscordUser>;
}

/**
 * Fetches the list of guilds the authenticated user is a member of.
 * Requires the `guilds` scope.
 */
export async function fetchUserGuilds(
  accessToken: string,
): Promise<DiscordGuild[]> {
  const res = await fetchWithRetry(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return res.json() as Promise<DiscordGuild[]>;
}

/**
 * Returns only guilds where the user is the owner OR has Manage Guild permission.
 * Discord permission bit 0x20 = MANAGE_GUILD
 */
export function filterManageableGuilds(guilds: DiscordGuild[]): DiscordGuild[] {
  const MANAGE_GUILD = BigInt(0x20);
  return guilds.filter((g) => {
    if (g.owner) return true;
    try {
      const perms = BigInt(g.permissions);
      return (perms & MANAGE_GUILD) === MANAGE_GUILD;
    } catch {
      return false;
    }
  });
}

/**
 * Builds the CDN URL for a guild icon.
 * Returns null if the guild has no icon.
 */
export function guildIconUrl(
  guildId: string,
  icon: string | null,
  size = 64,
): string | null {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "webp";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=${size}`;
}

/**
 * Builds the CDN URL for a user's avatar.
 * Falls back to the default avatar if the user has none.
 */
export function userAvatarUrl(
  userId: string,
  avatar: string | null,
  discriminator = "0",
  size = 64,
): string {
  if (!avatar) {
    const index =
      discriminator === "0"
        ? Number(BigInt(userId) >> BigInt(22)) % 6
        : parseInt(discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  const ext = avatar.startsWith("a_") ? "gif" : "webp";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${ext}?size=${size}`;
}
