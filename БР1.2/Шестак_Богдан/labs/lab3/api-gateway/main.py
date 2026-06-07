import os
import httpx
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API Gateway", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

AUTH_SERVICE    = os.getenv("AUTH_SERVICE_URL",    "http://auth-service:8001")
VACANCY_SERVICE = os.getenv("VACANCY_SERVICE_URL", "http://vacancy-service:8002")
RESUME_SERVICE  = os.getenv("RESUME_SERVICE_URL",  "http://resume-service:8003")
APP_SERVICE     = os.getenv("APP_SERVICE_URL",     "http://application-service:8004")

# Order matters — more specific prefixes first
ROUTES = [
    ("/auth",         AUTH_SERVICE),
    ("/users",        AUTH_SERVICE),
    ("/skills",       VACANCY_SERVICE),
    ("/companies",    VACANCY_SERVICE),
    ("/vacancies",    VACANCY_SERVICE),    # /vacancies/{id}/apply and /vacancies/{id}/applications → app-service handled below
    ("/resumes",      RESUME_SERVICE),
    ("/applications", APP_SERVICE),
]

# Routes that belong to application-service despite /vacancies prefix
APP_SERVICE_PATTERNS = ["/apply", "/applications"]


def resolve(path: str) -> str:
    # application-service handles /vacancies/{id}/apply and /vacancies/{id}/applications
    if path.startswith("/vacancies/"):
        for pattern in APP_SERVICE_PATTERNS:
            if pattern in path:
                return APP_SERVICE + path

    for prefix, target in ROUTES:
        if path.startswith(prefix):
            return target + path

    raise HTTPException(status_code=404, detail="Route not found")


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(path: str, request: Request):
    target_url = resolve("/" + path)
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.request(
                method=request.method,
                url=target_url,
                params=dict(request.query_params),
                headers=headers,
                content=body,
                timeout=15.0,
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Upstream error: {str(e)}")

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers={k: v for k, v in resp.headers.items() if k.lower() != "transfer-encoding"},
        media_type=resp.headers.get("content-type"),
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}
