import { describe, expect, it } from "vitest";

import { NodeEditorSchema } from "@bigmotion/schema";

// Regression: a node with an empty static `inputs` map but dynamic `resolveInputs` (compositor)
// must NOT be treated as a source node — otherwise it gets no node run and is never executed.
describe("isSourceNode classification", () => {
  const sourceTypes = ["prompt", "image-input"];
  const workTypes = ["llm", "text-to-image", "image-to-video", "compositor", "export"];

  it("treats prompt / image-input as sources", () => {
    for (const type of sourceTypes) {
      expect(NodeEditorSchema.isSourceNode(NodeEditorSchema.NodeRegistry[type])).toBe(true);
    }
  });

  it("does NOT treat compositor (dynamic inputs) or other work nodes as sources", () => {
    for (const type of workTypes) {
      expect(NodeEditorSchema.isSourceNode(NodeEditorSchema.NodeRegistry[type])).toBe(false);
    }
  });
});
