import fsp from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sha256, verifyFile } from "../../src/installer/checksum";
import { makeTempDir, sha256Hex } from "../helpers";

describe("checksum", () => {
  const content = "driver bundle contents";
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await makeTempDir();
    file = path.join(dir, "bundle.js");
    await fsp.writeFile(file, content);
  });

  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it("파일의 sha256을 hex로 계산한다", async () => {
    expect(await sha256(file)).toBe(sha256Hex(content));
  });

  it("크기와 해시가 맞으면 통과한다", async () => {
    await expect(
      verifyFile(file, {
        sha256: sha256Hex(content),
        size: Buffer.byteLength(content),
      }),
    ).resolves.toBeUndefined();
  });

  it("기대 해시가 대문자여도 통과한다", async () => {
    await expect(
      verifyFile(file, { sha256: sha256Hex(content).toUpperCase() }),
    ).resolves.toBeUndefined();
  });

  it("크기가 다르면 거부한다", async () => {
    await expect(
      verifyFile(file, { sha256: sha256Hex(content), size: 1 }),
    ).rejects.toThrow("파일 크기 불일치");
  });

  it("해시가 다르면 거부한다", async () => {
    await expect(verifyFile(file, { sha256: "0".repeat(64) })).rejects.toThrow(
      "체크섬 불일치",
    );
  });
});
