import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

// Import schema sources directly (relative) to avoid pulling the heavy root
// `@bigmotion/schema` barrel (which transitively loads @bigmotion/db / @bigmotion/api).
import { validateGraph, type Graph } from "../../../../../../packages/schema/node-editor/graph";
import { CompositorNodeDef } from "../../../../../../packages/schema/node-editor/node-types/compositor";

const baseParams = {
  width: 1920,
  height: 1080,
  durationMs: 5000,
  frameRate: 30,
};

describe("CompositorNodeDef.resolveInputs", () => {
  it("derives one port per layer with kind-mapped types", () => {
    const params = {
      ...baseParams,
      layers: [
        { id: "vid", kind: "video", x: 0, y: 0, width: 10, height: 10, startMs: 0, endMs: 1000, visible: true, muted: false },
        { id: "pic", kind: "image", x: 0, y: 0, width: 10, height: 10, startMs: 0, endMs: 1000, visible: true, muted: true },
      ],
    };
    const ports = CompositorNodeDef.resolveInputs(params);
    expect(ports).toEqual({
      "layer:vid": { type: "video-url", required: false },
      "layer:pic": { type: "image-url", required: false },
    });
  });

  it("returns no ports for invalid parameters", () => {
    expect(CompositorNodeDef.resolveInputs({ not: "valid" })).toEqual({});
  });

  it("static inputs map is empty", () => {
    expect(CompositorNodeDef.inputs).toEqual({});
  });
});

describe("validateGraph with dynamic layer ports", () => {
  const compositorId = randomUUID();
  const videoSourceId = randomUUID();
  const imageSourceId = randomUUID();
  const layerId = "abc";

  function compositorNode(layerKind: "video" | "image") {
    return {
      id: compositorId,
      type: "compositor",
      position: { x: 0, y: 0 },
      parameters: {
        ...baseParams,
        layers: [
          {
            id: layerId,
            kind: layerKind,
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            startMs: 0,
            endMs: 1000,
            visible: true,
            muted: false,
          },
        ],
      },
    };
  }

  // image-to-video produces `videoUrl: video-url`; image-input produces `imageUrl: image-url`.
  const videoSourceNode = {
    id: videoSourceId,
    type: "image-to-video",
    position: { x: 0, y: 0 },
    parameters: { model: "kling-v2-6", duration: 5 },
  };
  const imageSourceNode = {
    id: imageSourceId,
    type: "image-input",
    position: { x: 0, y: 0 },
    parameters: { url: "https://example.com/i.png" },
  };

  it("accepts a layer:<id> edge with a matching port type", () => {
    const graph: Graph = {
      nodes: [videoSourceNode, compositorNode("video")],
      edges: [
        {
          id: randomUUID(),
          source: videoSourceId,
          sourcePort: "videoUrl",
          target: compositorId,
          targetPort: `layer:${layerId}`,
        },
      ],
      groups: [],
    };
    const result = validateGraph(graph);
    expect(result.ok).toBe(true);
  });

  it("rejects a layer:<id> edge with a type mismatch", () => {
    // image-url source feeding a video-kind layer port (video-url) → mismatch
    const graph: Graph = {
      nodes: [imageSourceNode, compositorNode("video")],
      edges: [
        {
          id: randomUUID(),
          source: imageSourceId,
          sourcePort: "imageUrl",
          target: compositorId,
          targetPort: `layer:${layerId}`,
        },
      ],
      groups: [],
    };
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("edge-port-mismatch");
  });
});
