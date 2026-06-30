import { describe, expect, it } from "vitest";

import { buildExportArgs, exportFormatInfo, type ExportFormat } from "./export-format";

const IN = "/tmp/job-in.mp4";

function out(format: ExportFormat): string {
  return `/tmp/job-out.${exportFormatInfo(format).ext}`;
}

describe("exportFormatInfo", () => {
  it("returns ext + contentType per format", () => {
    expect(exportFormatInfo("mp4")).toEqual({ ext: "mp4", contentType: "video/mp4" });
    expect(exportFormatInfo("webm")).toEqual({ ext: "webm", contentType: "video/webm" });
    expect(exportFormatInfo("mov_h264")).toEqual({ ext: "mov", contentType: "video/quicktime" });
    expect(exportFormatInfo("mov_prores")).toEqual({ ext: "mov", contentType: "video/quicktime" });
  });
});

describe("buildExportArgs", () => {
  const formats: ExportFormat[] = ["mp4", "webm", "mov_h264", "mov_prores"];

  it.each(formats)("argv for %s starts with -i input and ends with -y output", (format) => {
    const output = out(format);
    const args = buildExportArgs(IN, format, output);

    expect(args.slice(0, 2)).toEqual(["-i", IN]);
    expect(args.slice(-2)).toEqual(["-y", output]);
  });

  it("mp4 -> libx264 + aac + faststart", () => {
    const args = buildExportArgs(IN, "mp4", out("mp4"));
    expect(args).toContain("libx264");
    expect(args[args.indexOf("-preset") + 1]).toBe("fast");
    expect(args[args.indexOf("-crf") + 1]).toBe("23");
    expect(args[args.indexOf("-pix_fmt") + 1]).toBe("yuv420p");
    expect(args).toContain("aac");
    expect(args[args.indexOf("-movflags") + 1]).toBe("+faststart");
  });

  it("webm -> libvpx-vp9 + libopus", () => {
    const args = buildExportArgs(IN, "webm", out("webm"));
    expect(args).toContain("libvpx-vp9");
    expect(args[args.indexOf("-b:v") + 1]).toBe("0");
    expect(args[args.indexOf("-crf") + 1]).toBe("32");
    expect(args).toContain("libopus");
    expect(args).not.toContain("libx264");
  });

  it("mov_h264 -> libx264 + aac forced to mov container", () => {
    const args = buildExportArgs(IN, "mov_h264", out("mov_h264"));
    expect(args).toContain("libx264");
    expect(args[args.indexOf("-preset") + 1]).toBe("fast");
    expect(args[args.indexOf("-crf") + 1]).toBe("23");
    expect(args[args.indexOf("-pix_fmt") + 1]).toBe("yuv420p");
    expect(args).toContain("aac");
    expect(args[args.indexOf("-f") + 1]).toBe("mov");
  });

  it("mov_prores -> prores_ks + pcm_s16le forced to mov container", () => {
    const args = buildExportArgs(IN, "mov_prores", out("mov_prores"));
    expect(args).toContain("prores_ks");
    expect(args[args.indexOf("-profile:v") + 1]).toBe("3");
    expect(args).toContain("pcm_s16le");
    expect(args[args.indexOf("-f") + 1]).toBe("mov");
    expect(args).not.toContain("libx264");
  });
});

describe("image formats", () => {
  it("png -> single-frame png", () => {
    expect(exportFormatInfo("png")).toEqual({ ext: "png", contentType: "image/png" });
    const args = buildExportArgs(IN, "png", out("png"));
    expect(args).toContain("png");
    expect(args[args.indexOf("-frames:v") + 1]).toBe("1");
    expect(args[args.indexOf("-update") + 1]).toBe("1");
  });

  it("jpg -> single-frame mjpeg", () => {
    expect(exportFormatInfo("jpg")).toEqual({ ext: "jpg", contentType: "image/jpeg" });
    const args = buildExportArgs(IN, "jpg", out("jpg"));
    expect(args).toContain("mjpeg");
    expect(args[args.indexOf("-frames:v") + 1]).toBe("1");
  });

  it("webp -> single-frame libwebp", () => {
    expect(exportFormatInfo("webp")).toEqual({ ext: "webp", contentType: "image/webp" });
    const args = buildExportArgs(IN, "webp", out("webp"));
    expect(args).toContain("libwebp");
    expect(args[args.indexOf("-frames:v") + 1]).toBe("1");
  });
});

describe("audio formats", () => {
  it("mp3 -> libmp3lame, no video", () => {
    expect(exportFormatInfo("mp3")).toEqual({ ext: "mp3", contentType: "audio/mpeg" });
    const args = buildExportArgs(IN, "mp3", out("mp3"));
    expect(args).toContain("libmp3lame");
    expect(args).toContain("-vn");
  });

  it("m4a -> aac, no video", () => {
    expect(exportFormatInfo("m4a")).toEqual({ ext: "m4a", contentType: "audio/mp4" });
    const args = buildExportArgs(IN, "m4a", out("m4a"));
    expect(args).toContain("aac");
    expect(args).toContain("-vn");
  });

  it("wav -> pcm_s16le, no video", () => {
    expect(exportFormatInfo("wav")).toEqual({ ext: "wav", contentType: "audio/wav" });
    const args = buildExportArgs(IN, "wav", out("wav"));
    expect(args).toContain("pcm_s16le");
    expect(args).toContain("-vn");
  });
});
