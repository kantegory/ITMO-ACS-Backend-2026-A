const internalToken = () => process.env.INTERNAL_SERVICE_TOKEN || "";

export async function fetchUserInternal(userId: string): Promise<{
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}> {
  const base = process.env.USER_SERVICE_URL || "http://127.0.0.1:4001";
  const res = await fetch(`${base}/internal/users/${userId}`, {
    headers: { "X-Internal-Token": internalToken() },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body };
}

export async function fetchTableInternal(
  tableId: string,
  restaurantId: string
): Promise<{
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}> {
  const base = process.env.RESTAURANT_SERVICE_URL || "http://127.0.0.1:4002";
  const url = new URL(`${base}/internal/tables/${tableId}`);
  url.searchParams.set("restaurant_id", restaurantId);
  const res = await fetch(url, {
    headers: { "X-Internal-Token": internalToken() },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body };
}
