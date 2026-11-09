import { Elysia } from "elysia";

const env = {
  AUTH: process.env.AUTH_SERVICE_URL ?? "http://127.0.0.1:3001",
  CATALOG: process.env.CATALOG_SERVICE_URL ?? "http://127.0.0.1:3002",
  JOBSEEKER: process.env.JOBSEEKER_SERVICE_URL ?? "http://127.0.0.1:3003",
  EMPLOYER: process.env.EMPLOYER_SERVICE_URL ?? "http://127.0.0.1:3004",
  APPLICATION: process.env.APPLICATION_SERVICE_URL ?? "http://127.0.0.1:3005",
};

function pickTarget(pathname: string): string | null {
  if (pathname.startsWith("/api/v1/auth")) return env.AUTH;
  if (pathname.startsWith("/api/v1/me/applications")) return env.APPLICATION;
  if (pathname.startsWith("/api/v1/me/employer")) return env.EMPLOYER;
  if (pathname.startsWith("/api/v1/me")) return env.AUTH;
  if (
    pathname.startsWith("/api/v1/industries") ||
    pathname.startsWith("/api/v1/experience-levels") ||
    pathname.startsWith("/api/v1/skills")
  )
    return env.CATALOG;
  if (pathname.startsWith("/api/v1/job-seeker") || pathname.startsWith("/api/v1/resumes"))
    return env.JOBSEEKER;
  if (pathname.startsWith("/api/v1/applications/")) return env.APPLICATION;
  if (/^\/api\/v1\/vacancies\/\d+\/applications/.test(pathname)) return env.APPLICATION;
  if (pathname.startsWith("/api/v1/companies") || pathname.startsWith("/api/v1/vacancies"))
    return env.EMPLOYER;
  return null;
}

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia()
  .get("/health", () => ({ ok: true }))
  .all("/*", async ({ request }) => {
    const url = new URL(request.url);
    const base = pickTarget(url.pathname);
    if (!base) return new Response("Not Found", { status: 404 });

    const target = new URL(url.pathname + url.search, base);
    return fetch(new Request(target.toString(), request));
  })
  .listen(port);

console.log(`Gateway: http://${app.server?.hostname}:${app.server?.port}`);
