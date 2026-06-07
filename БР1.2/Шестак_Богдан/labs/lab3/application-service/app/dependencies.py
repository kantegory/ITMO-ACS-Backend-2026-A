import os
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

AUTH_SERVICE_URL    = os.getenv("AUTH_SERVICE_URL",    "http://auth-service:8001")
VACANCY_SERVICE_URL = os.getenv("VACANCY_SERVICE_URL", "http://vacancy-service:8002")
RESUME_SERVICE_URL  = os.getenv("RESUME_SERVICE_URL",  "http://resume-service:8003")

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{AUTH_SERVICE_URL}/internal/validate",
                params={"token": credentials.credentials},
                timeout=5.0,
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")
    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid token")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Auth service error")
    return resp.json()


async def fetch_vacancy(vacancy_id: int) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{VACANCY_SERVICE_URL}/internal/vacancies/{vacancy_id}", timeout=5.0
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Vacancy service unavailable")
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Vacancy service error")
    return resp.json()


async def fetch_resume(resume_id: int) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{RESUME_SERVICE_URL}/resumes/internal/{resume_id}", timeout=5.0
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Resume service unavailable")
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Resume service error")
    return resp.json()
