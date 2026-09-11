import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { authRequired, health, signAccessToken, validate } from "../packages/shared/src/index.js";

test("access token is accepted by auth middleware", () => {
  const token = signAccessToken({ sub: "user-1", email: "ruslan@example.com", role: "user" });
  const req = {
    header: (name: string) => (name === "authorization" ? `Bearer ${token}` : undefined),
  } as Request;
  let forwarded: unknown;
  authRequired(req, {} as Response, ((error?: unknown) => {
    forwarded = error ?? null;
  }) as NextFunction);
  assert.equal(forwarded, null);
  assert.equal(req.auth?.sub, "user-1");
  assert.equal(req.auth?.role, "user");
});

test("request validation rejects malformed UUID", () => {
  assert.throws(() => validate(z.string().uuid(), "not-a-uuid"));
});

test("health payload identifies service", () => {
  const payload = health("fitflow-test");
  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "fitflow-test");
  assert.ok(!Number.isNaN(Date.parse(payload.timestamp)));
});
