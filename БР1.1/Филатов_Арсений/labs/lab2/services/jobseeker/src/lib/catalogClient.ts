type ValidateResult = { valid: boolean; missing: number[] };
type SkillRow = { id: number; name: string };

const hdr = () => ({
  "Content-Type": "application/json",
  "x-internal-secret": process.env.INTERNAL_SECRET ?? "",
});

export async function catalogValidateSkills(ids: number[]): Promise<ValidateResult> {
  const base = process.env.CATALOG_SERVICE_URL!;
  const res = await fetch(`${base}/internal/skills/validate`, {
    method: "POST",
    headers: hdr(),
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    throw new Error(`catalog skills/validate failed: ${res.status}`);
  }
  return (await res.json()) as ValidateResult;
}

export async function catalogGetSkillsByIds(ids: number[]): Promise<SkillRow[]> {
  if (!ids.length) return [];
  const base = process.env.CATALOG_SERVICE_URL!;
  const res = await fetch(`${base}/internal/skills?ids=${encodeURIComponent(ids.join(","))}`, {
    headers: { "x-internal-secret": process.env.INTERNAL_SECRET ?? "" },
  });
  if (!res.ok) {
    throw new Error(`catalog skills failed: ${res.status}`);
  }
  const data = (await res.json()) as { items: SkillRow[] };
  return data.items;
}
