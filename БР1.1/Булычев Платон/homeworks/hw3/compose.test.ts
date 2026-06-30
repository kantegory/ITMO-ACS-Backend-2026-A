import { describe, expect, it } from "vitest";

import type { CompositionCanvas, CompositionLayer } from "../enqueue";
import { buildComposeArgs } from "./compose";

const canvas: CompositionCanvas = {
  width: 1920,
  height: 1080,
  durationMs: 10_000,
  frameRate: 30,
};

function videoLayer(over: Partial<CompositionLayer> = {}): CompositionLayer {
  return {
    id: "v",
    kind: "video",
    url: "https://example.com/v.mp4",
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    startMs: 0,
    endMs: 10_000,
    muted: false,
    ...over,
  };
}

function imageLayer(over: Partial<CompositionLayer> = {}): CompositionLayer {
  return {
    id: "img",
    kind: "image",
    url: "https://example.com/i.png",
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    startMs: 0,
    endMs: 10_000,
    muted: true,
    ...over,
  };
}

function audioLayer(over: Partial<CompositionLayer> = {}): CompositionLayer {
  return {
    id: "aud",
    kind: "audio",
    url: "https://example.com/a.mp3",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startMs: 0,
    endMs: 10_000,
    muted: false,
    ...over,
  };
}

function filterComplex(args: string[]): string {
  const idx = args.indexOf("-filter_complex");
  return idx === -1 ? "" : args[idx + 1];
}

describe("buildComposeArgs", () => {
  it("(a) two video layers with different time windows stacked by z-order", () => {
    // layers[0] is topmost; overlay applied bottom-to-top => layer 1 first, layer 0 last.
    // The top layer is trimmed to a 4s window (trim 0..4s) placed at timeline 2s => [2,6].
    const layers: CompositionLayer[] = [
      videoLayer({ id: "top", x: 100, y: 100, width: 640, height: 480, startMs: 2000, trimStartMs: 0, trimEndMs: 4000 }),
      videoLayer({ id: "bottom", x: 0, y: 0, width: 1920, height: 1080, startMs: 0 }),
    ];
    const paths = ["/tmp/top.mp4", "/tmp/bottom.mp4"];
    const args = buildComposeArgs(canvas, layers, paths, "/tmp/out.mp4", [false, false]);
    const fc = filterComplex(args);

    // base canvas input 0
    expect(args.slice(0, 4)).toEqual([
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=1920x1080:r=30:d=10",
    ]);

    // per-layer trim + scale + setpts time offset (bottom has no trim and runs to canvas end)
    expect(fc).toContain("[1:v]trim=start=0:end=4,scale=640:480,setpts=PTS-STARTPTS+2/TB[v0]");
    expect(fc).toContain("[2:v]scale=1920:1080,setpts=PTS-STARTPTS+0/TB[v1]");

    // overlay enable windows, applied bottom-to-top: layer 1 (bottom) first over [0:v], then layer 0 (top)
    const bottomOverlayIdx = fc.indexOf("[0:v][v1]overlay=x=0:y=0:enable='between(t,0,10)'[acc1]");
    const topOverlayIdx = fc.indexOf("[acc1][v0]overlay=x=100:y=100:enable='between(t,2,6)'[acc0]");
    expect(bottomOverlayIdx).toBeGreaterThanOrEqual(0);
    expect(topOverlayIdx).toBeGreaterThan(bottomOverlayIdx);

    // final video map is the topmost overlay output
    const mapIdx = args.indexOf("-map");
    expect(args[mapIdx + 1]).toBe("[acc0]");

    // output settings
    expect(args[args.indexOf("-t") + 1]).toBe("10");
    expect(args[args.indexOf("-r") + 1]).toBe("30");
    expect(args).toContain("libx264");
    expect(args).toContain("yuv420p");
  });

  it("(b) an image overlay layer loops a single frame; only the bg video carries audio", () => {
    const layers: CompositionLayer[] = [
      imageLayer({ id: "logo", x: 50, y: 60, width: 300, height: 120, startMs: 1000, endMs: 4000 }),
      videoLayer({ id: "bg", startMs: 0, endMs: 10_000 }),
    ];
    const paths = ["/tmp/logo.png", "/tmp/bg.mp4"];
    // png has no audio, bg video does
    const args = buildComposeArgs(canvas, layers, paths, "/tmp/out.mp4", [false, true]);
    const fc = filterComplex(args);

    // image input is looped: ["-loop", "1", "-i", "/tmp/logo.png"]
    const logoInputIdx = args.indexOf("/tmp/logo.png");
    expect(args[logoInputIdx - 1]).toBe("-i");
    expect(args[logoInputIdx - 2]).toBe("1");
    expect(args[logoInputIdx - 3]).toBe("-loop");

    // image scale + overlay enable window
    expect(fc).toContain("[1:v]scale=300:120,setpts=PTS-STARTPTS+1/TB[v0]");
    expect(fc).toContain("overlay=x=50:y=60:enable='between(t,1,4)'");

    // single audio source maps straight to [aout] — no amix, no normalize, no image audio
    expect(fc).toContain("[2:a]adelay=0|0[aout]");
    expect(fc).not.toContain("amix");
    expect(fc).not.toContain("normalize");
    expect(fc).not.toContain("[1:a]");
  });

  it("(c) audio mixing across two unmuted video layers, muted video excluded", () => {
    const layers: CompositionLayer[] = [
      videoLayer({ id: "a", startMs: 0, endMs: 10_000, muted: false }),
      videoLayer({ id: "b", startMs: 3000, endMs: 9000, muted: false }),
      videoLayer({ id: "c", startMs: 0, endMs: 5000, muted: true }),
    ];
    const paths = ["/tmp/a.mp4", "/tmp/b.mp4", "/tmp/c.mp4"];
    const args = buildComposeArgs(canvas, layers, paths, "/tmp/out.mp4", [true, true, true]);
    const fc = filterComplex(args);

    expect(fc).toContain("[1:a]adelay=0|0[a0]");
    expect(fc).toContain("[2:a]adelay=3000|3000[a1]");
    // muted layer c (input 3) contributes no audio
    expect(fc).not.toContain("[3:a]");
    // amix without the (unsupported) normalize option
    expect(fc).toContain("[a0][a1]amix=inputs=2[aout]");
    expect(fc).not.toContain("normalize");

    expect(args).toContain("[aout]");
    expect(args).toContain("-c:a");
    expect(args).toContain("aac");
  });

  it("(d) zero visible layers -> black canvas, no audio", () => {
    const args = buildComposeArgs(canvas, [], [], "/tmp/out.mp4", []);

    // No layers -> no filtergraph at all; the base canvas video stream is mapped directly.
    expect(args).not.toContain("-filter_complex");
    const mapIdx = args.indexOf("-map");
    expect(args[mapIdx + 1]).toBe("0:v");
    expect(args).not.toContain("[aout]");
    expect(args).not.toContain("-c:a");
    expect(args[args.indexOf("-t") + 1]).toBe("10");
  });

  it("(f) audio layer mixes into the output and is not overlaid as video", () => {
    const layers: CompositionLayer[] = [
      videoLayer({ id: "bg", startMs: 0, endMs: 10_000 }),
      audioLayer({ id: "music", startMs: 2000 }),
    ];
    const paths = ["/tmp/bg.mp4", "/tmp/music.mp3"];
    const args = buildComposeArgs(canvas, layers, paths, "/tmp/out.mp4", [true, true]);
    const fc = filterComplex(args);

    // audio layer (input 2) has no video stream -> never scaled/overlaid
    expect(fc).not.toContain("[2:v]");
    // bg video still overlaid
    expect(fc).toContain("[1:v]scale=");
    // both bg audio and the audio layer mix in, delayed by their start
    expect(fc).toContain("[1:a]adelay=0|0[a0]");
    expect(fc).toContain("[2:a]adelay=2000|2000[a1]");
    expect(fc).toContain("amix=inputs=2[aout]");
    expect(args).toContain("[aout]");
    expect(args).toContain("aac");
  });

  it("(g) audio-only composition maps the base canvas video", () => {
    const layers: CompositionLayer[] = [audioLayer({ id: "music" })];
    const args = buildComposeArgs(canvas, layers, ["/tmp/music.mp3"], "/tmp/out.mp4", [true]);
    const fc = filterComplex(args);

    // no video overlay (audio has no :v stream)
    expect(fc).not.toContain("[1:v]");
    // base canvas video mapped directly; single audio source maps straight to [aout]
    const mapIdx = args.indexOf("-map");
    expect(args[mapIdx + 1]).toBe("0:v");
    expect(fc).toContain("[1:a]adelay=0|0[aout]");
    expect(args).toContain("[aout]");
  });

  it("(h) muted audio layer is excluded from the mix", () => {
    const layers: CompositionLayer[] = [
      videoLayer({ id: "bg", muted: true }),
      audioLayer({ id: "music", muted: true }),
    ];
    const args = buildComposeArgs(canvas, layers, ["/tmp/bg.mp4", "/tmp/music.mp3"], "/tmp/out.mp4", [true, true]);
    const fc = filterComplex(args);

    expect(fc).not.toContain("adelay");
    expect(args).not.toContain("[aout]");
    expect(args).not.toContain("-c:a");
  });

  it("(e) unmuted video without an audio stream produces a silent output", () => {
    const layers: CompositionLayer[] = [videoLayer({ id: "noaudio", muted: false })];
    // audioFlags=false -> the input has no audio track, so no audio graph is built
    const args = buildComposeArgs(canvas, layers, ["/tmp/noaudio.mp4"], "/tmp/out.mp4", [false]);
    const fc = filterComplex(args);

    expect(fc).not.toContain("adelay");
    expect(fc).not.toContain("amix");
    expect(args).not.toContain("[aout]");
    expect(args).not.toContain("-c:a");
  });

  it("(i) per-layer volume appends a gain filter to the audio chain", () => {
    const layers: CompositionLayer[] = [
      videoLayer({ id: "a", volume: 0.5 }),
      audioLayer({ id: "music", startMs: 1000, volume: 1.5 }),
    ];
    const args = buildComposeArgs(canvas, layers, ["/tmp/a.mp4", "/tmp/music.mp3"], "/tmp/out.mp4", [true, true]);
    const fc = filterComplex(args);

    expect(fc).toContain("[1:a]adelay=0|0,volume=0.5[a0]");
    expect(fc).toContain("[2:a]adelay=1000|1000,volume=1.5[a1]");
  });

  it("(j) volume of 1 (or unset) adds no gain filter", () => {
    const layers: CompositionLayer[] = [videoLayer({ id: "a", volume: 1 })];
    const args = buildComposeArgs(canvas, layers, ["/tmp/a.mp4"], "/tmp/out.mp4", [true]);
    const fc = filterComplex(args);

    expect(fc).toContain("[1:a]adelay=0|0[aout]");
    expect(fc).not.toContain("volume=");
  });

  it("encodes with an explicit fast x264 preset (not the slow libx264 default)", () => {
    const args = buildComposeArgs(canvas, [videoLayer()], ["/tmp/v.mp4"], "/tmp/out.mp4", [false]);

    const presetIdx = args.indexOf("-preset");
    expect(presetIdx).toBeGreaterThanOrEqual(0);
    expect(args[presetIdx + 1]).toBe("veryfast");

    const crfIdx = args.indexOf("-crf");
    expect(crfIdx).toBeGreaterThanOrEqual(0);
    expect(args[crfIdx + 1]).toBe("23");
  });

  it("a video layer with no trim window spans to the canvas duration", () => {
    const layers: CompositionLayer[] = [videoLayer({ id: "x", startMs: 0 })];
    const args = buildComposeArgs(canvas, layers, ["/tmp/x.mp4"], "/tmp/out.mp4", [false]);
    const fc = filterComplex(args);
    // no trim filter, overlay runs for the whole canvas
    expect(fc).toContain("[1:v]scale=1920:1080,setpts=PTS-STARTPTS+0/TB[v0]");
    expect(fc).toContain("enable='between(t,0,10)'");
  });

  it("clamps a trim window that overruns the canvas duration", () => {
    const layers: CompositionLayer[] = [
      videoLayer({ id: "x", startMs: 0, trimStartMs: 0, trimEndMs: 99_000 }),
    ];
    const args = buildComposeArgs(canvas, layers, ["/tmp/x.mp4"], "/tmp/out.mp4", [false]);
    const fc = filterComplex(args);
    expect(fc).toContain("[1:v]trim=start=0:end=99,scale=1920:1080,setpts=PTS-STARTPTS+0/TB[v0]");
    expect(fc).toContain("enable='between(t,0,10)'");
  });

  it("(k) trims a video into its source window and places it at the timeline start", () => {
    // (startMs=0, trimStartMs=1000, trimEndMs=5000): take the clip's 1..5s slice at timeline 0..4s.
    const layers: CompositionLayer[] = [
      videoLayer({ id: "v", startMs: 0, trimStartMs: 1000, trimEndMs: 5000 }),
    ];
    const args = buildComposeArgs(canvas, layers, ["/tmp/v.mp4"], "/tmp/out.mp4", [true]);
    const fc = filterComplex(args);

    expect(fc).toContain("[1:v]trim=start=1:end=5,scale=1920:1080,setpts=PTS-STARTPTS+0/TB[v0]");
    expect(fc).toContain("enable='between(t,0,4)'");
    // the video's audio is trimmed to the same window before being delayed to startMs
    expect(fc).toContain("[1:a]atrim=start=1:end=5,asetpts=PTS-STARTPTS,adelay=0|0[aout]");
  });

  it("(l) an open-ended trim start keeps the clip to its natural end", () => {
    const layers: CompositionLayer[] = [
      videoLayer({ id: "v", startMs: 2000, trimStartMs: 1000 }),
    ];
    const args = buildComposeArgs(canvas, layers, ["/tmp/v.mp4"], "/tmp/out.mp4", [false]);
    const fc = filterComplex(args);

    expect(fc).toContain("[1:v]trim=start=1,scale=1920:1080,setpts=PTS-STARTPTS+2/TB[v0]");
    // no known trim end -> overlay runs to the canvas end
    expect(fc).toContain("enable='between(t,2,10)'");
  });

  it("(m) trims and delays an audio layer", () => {
    const layers: CompositionLayer[] = [
      audioLayer({ id: "music", startMs: 2000, trimStartMs: 1000, trimEndMs: 5000 }),
    ];
    const args = buildComposeArgs(canvas, layers, ["/tmp/music.mp3"], "/tmp/out.mp4", [true]);
    const fc = filterComplex(args);

    expect(fc).toContain("[1:a]atrim=start=1:end=5,asetpts=PTS-STARTPTS,adelay=2000|2000[aout]");
  });

  it("decodes a .webm alpha-matte layer with the libvpx decoder so overlay keeps transparency", () => {
    const args = buildComposeArgs(canvas, [videoLayer({ id: "matte" })], ["/tmp/matte.webm"], "/tmp/out.mp4", [false]);
    const idx = args.indexOf("/tmp/matte.webm");
    expect(args[idx - 1]).toBe("-i");
    expect(args[idx - 2]).toBe("libvpx");
    expect(args[idx - 3]).toBe("-c:v");
  });
});
