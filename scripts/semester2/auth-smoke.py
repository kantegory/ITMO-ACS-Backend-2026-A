#!/usr/bin/env python3
"""Exercise the public auth contract without logging credentials or tokens."""
import argparse
import json
import secrets
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("base")
parser.add_argument("--prefix", default="/api/v1")
parser.add_argument("--timeout", type=int, default=55)
args = parser.parse_args()
suffix = str(time.time_ns())[-8:]
login = {"email": f"auth-smoke-{suffix}@example.test", "password": secrets.token_urlsafe(24)}

def call(route, status, body=None, *, api=True):
    prefix = args.prefix if api else ""
    request = Request(
        args.base.rstrip("/") + prefix + route,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(request, timeout=args.timeout) as res:
            actual, response = res.status, json.load(res)
    except HTTPError as error:
        actual, response = error.code, {}
    if actual != status:
        raise SystemExit(f"{route}: expected {status}, got {actual}")
    print(f"{request.get_method()} {prefix}{route} → {actual}", flush=True)
    return response

account = dict(login, first_name="Auth", last_name="Smoke", phone=f"+79{suffix}1", role="APPLICANT")
register = call("/auth/register", 200, account)
assert register["email"] == login["email"] and register["roles"] == ["APPLICANT"]
call("/auth/register", 409, account)
call("/auth/login", 401, dict(login, password="invalid"))
tokens = call("/auth/login", 200, login)
assert tokens["access_token"] and tokens["user"]["user_id"] == register["user_id"]
refreshed = call("/auth/refresh", 200, {"refresh_token": tokens["refresh_token"]})
assert refreshed["refresh_token"] != tokens["refresh_token"]
call("/auth/refresh", 401, {"refresh_token": tokens["refresh_token"]})
assert "openapi" in call("/v3/api-docs", 200, api=False)
