import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import YAML from "yaml";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("OpenAPI contract is parseable and covers every domain", async () => {
  const contract = YAML.parse(await read("docs/openapi.yaml")) as {
    openapi: string;
    paths: Record<string, unknown>;
  };
  assert.equal(contract.openapi, "3.0.3");
  assert.equal(Object.keys(contract.paths).length, 14);
  for (const domain of ["auth", "workouts", "plans", "progress", "articles"]) {
    assert.ok(Object.keys(contract.paths).some((path) => path.includes(domain)));
  }
});

test("Postman scenario contains 19 executable requests", async () => {
  const collection = JSON.parse(await read("postman/FitFlow.postman_collection.json")) as {
    item: Array<{ item?: Array<{ request?: { url?: string | { raw?: string } } }> }>;
  };
  const requests = collection.item.flatMap((folder) => folder.item ?? []).filter((item) => item.request);
  assert.equal(requests.length, 19);
  for (const item of requests) {
    const url = typeof item.request?.url === "string" ? item.request.url : item.request?.url?.raw ?? "";
    assert.match(url, /^\{\{(?:apiBaseUrl|healthUrl)\}\}/);
  }
});

test("Postman environment contains no external destination", async () => {
  const environment = JSON.parse(await read("postman/FitFlow.local.postman_environment.json")) as {
    values: Array<{ key: string; value: string }>;
  };
  const baseUrls = environment.values.filter((item) => ["apiBaseUrl", "healthUrl"].includes(item.key));
  assert.equal(baseUrls.length, 2);
  for (const item of baseUrls) assert.match(item.value, /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/);
});
