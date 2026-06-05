import os
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Validates token via auth-service and returns user data."""
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

    return resp.json()  # {user_id, role, email}
