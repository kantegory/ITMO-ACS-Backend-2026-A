const hdr = () => ({
  "Content-Type": "application/json",
  "x-internal-secret": process.env.INTERNAL_SECRET ?? "",
});

export async function catalogGetIndustry(id: number): Promise<boolean> {
  const base = process.env.CATALOG_SERVICE_URL!;
  const res = await fetch(`${base}/internal/industries/${id}`, { headers: hdr() });
  return res.ok;
}

export async function catalogGetExperienceLevel(id: number): Promise<boolean> {
  const base = process.env.CATALOG_SERVICE_URL!;
  const res = await fetch(`${base}/internal/experience-levels/${id}`, { headers: hdr() });
  return res.ok;
}

export async function catalogValidateSkills(ids: number[]): Promise<{ valid: boolean; missing: number[] }> {
  const base = process.env.CATALOG_SERVICE_URL!;
  const res = await fetch(`${base}/internal/skills/validate`, {
    method: "POST",
    headers: hdr(),
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`catalog skills validate ${res.status}`);
  return (await res.json()) as { valid: boolean; missing: number[] };
}

export async function catalogGetSkillsByIds(ids: number[]): Promise<{ id: number; name: string }[]> {
  if (!ids.length) return [];
  const base = process.env.CATALOG_SERVICE_URL!;
  const res = await fetch(`${base}/internal/skills?ids=${encodeURIComponent(ids.join(","))}`, {
    headers: { "x-internal-secret": process.env.INTERNAL_SECRET ?? "" },
  });
  if (!res.ok) throw new Error(`catalog skills ${res.status}`);
  const data = (await res.json()) as { items: { id: number; name: string }[] };
  return data.items;
}
