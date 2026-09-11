import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("compose keeps infrastructure private and defines both application profiles", async () => {
  const compose = await read("docker-compose.yml");

  assert.match(compose, /profiles: \[monolith\]/);
  assert.match(compose, /profiles: \[microservices\]/);
  assert.match(compose, /auth-db:/);
  assert.match(compose, /workout-db:/);
  assert.match(compose, /progress-db:/);
  assert.match(compose, /content-db:/);
  assert.match(compose, /rabbitmq:/);
  assert.doesNotMatch(compose, /5432:5432/);
  assert.doesNotMatch(compose, /5672:5672/);
});

test("deployment workflow is triggered by main and supports manual retry", async () => {
  const workflow = await read(".github/workflows/deploy.yml");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /SSH_KNOWN_HOSTS/);
  assert.match(workflow, /needs: verify/);
  assert.match(workflow, /uses: \.\/\.github\/workflows\/ci\.yml/);
  assert.match(workflow, /StrictHostKeyChecking=yes/);
});

test("example deployment environment contains no usable production secrets", async () => {
  const env = await read("deploy/.env.example");

  assert.match(env, /JWT_SECRET=replace-with-/);
  assert.match(env, /POSTGRES_PASSWORD=replace-with-/);
  assert.match(env, /RABBITMQ_PASSWORD=replace-with-/);
});

test("nginx exposes all microservice route groups", async () => {
  const nginx = await read("deploy/nginx/microservices.conf");

  for (const route of ["auth", "workouts", "plans", "progress", "articles"]) {
    assert.match(nginx, new RegExp(`/api/v1/${route}`));
  }
});
