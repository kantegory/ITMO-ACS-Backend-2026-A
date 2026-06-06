const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "lab2_service_secret";

export async function serviceGet<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  try {
    const res = await fetch(url, {
      headers: { "X-Service-Token": SERVICE_TOKEN },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: 502 };
  }
}

export async function servicePost<T>(url: string, body: unknown): Promise<{ ok: true; data: T; status: number } | { ok: false; status: number }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": SERVICE_TOKEN,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = res.status === 204 ? ({} as T) : ((await res.json()) as T);
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, status: 502 };
  }
}
