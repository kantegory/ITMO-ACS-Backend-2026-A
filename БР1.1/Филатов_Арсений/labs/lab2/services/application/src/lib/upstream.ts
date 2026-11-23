const internalHeaders = (): HeadersInit => ({
  "x-internal-secret": process.env.INTERNAL_SECRET ?? "",
});

export async function employerGetVacancy(
  vacancyId: number
): Promise<{ id: number; companyId: number } | null> {
  const base = process.env.EMPLOYER_SERVICE_URL!;
  const res = await fetch(`${base}/internal/vacancies/${vacancyId}`, {
    headers: internalHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`employer vacancy: ${res.status}`);
  return (await res.json()) as { id: number; companyId: number };
}

export async function employerEmployerAccess(
  vacancyId: number,
  userId: number
): Promise<{ allowed: boolean; companyId: number } | null> {
  const base = process.env.EMPLOYER_SERVICE_URL!;
  const res = await fetch(
    `${base}/internal/vacancies/${vacancyId}/employer-access?userId=${userId}`,
    { headers: internalHeaders() }
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as { allowed: boolean; companyId: number };
}

export async function jobseekerResumeOk(resumeId: number, ownerUserId: number): Promise<boolean> {
  const base = process.env.JOBSEEKER_SERVICE_URL!;
  const res = await fetch(
    `${base}/internal/resumes/${resumeId}?ownerUserId=${ownerUserId}`,
    { headers: internalHeaders() }
  );
  return res.ok;
}
