import { describe, expect, it } from "vitest";
import { splitFilesIntoUploadBatches } from "./api";

function createFile(name: string, bytes: number) {
  return new File([new Uint8Array(bytes)], name, {
    type: "image/png",
  });
}

describe("study upload batching", () => {
  it("splits large file lists into multiple safe batches", () => {
    const files = Array.from({ length: 85 }, (_, index) => createFile(`slice-${index + 1}.png`, 32 * 1024));
    const batches = splitFilesIntoUploadBatches(files);

    expect(batches.length).toBeGreaterThan(1);
    expect(batches.flat()).toHaveLength(85);
    expect(batches.every((batch) => batch.length <= 20)).toBe(true);
  });

  it("throws when a single file is too large for the web upload route", () => {
    const oversizedFile = createFile("huge.dcm", 4 * 1024 * 1024);

    expect(() => splitFilesIntoUploadBatches([oversizedFile])).toThrow(/too large/i);
  });
});
