/**
 * Browser-side access to the panel's own API routes. One typed fetch that turns
 * every failure into an `ApiRequestError` carrying the route's `error` message.
 */

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    ...(body !== undefined && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // not JSON: fall through to the status handling
  }
  if (!res.ok) {
    const message = (json as { error?: unknown } | undefined)?.error;
    throw new ApiRequestError(typeof message === "string" && message ? message : `Request failed (${res.status})`, res.status);
  }
  return json as T;
}

/** GET; resolves with the parsed JSON body. */
export const apiFetch = <T>(url: string) => request<T>("GET", url);

/** POST / PUT / PATCH / DELETE with an optional JSON body. */
export const apiSend = <T = { ok: true }>(method: "POST" | "PUT" | "PATCH" | "DELETE", url: string, body?: unknown) =>
  request<T>(method, url, body);

/** Panel routes wrap lists and rows as `{ data }`; a few return the value bare (api-keys). */
export const unwrap = <T>(json: unknown): T =>
  (json && typeof json === "object" && "data" in json ? (json as { data: T }).data : json) as T;

/** Shared SWR fetcher: GET and unwrap. */
export const fetchData = async <T>(url: string): Promise<T> => unwrap<T>(await apiFetch(url));
