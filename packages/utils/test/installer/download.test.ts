import fsp from "node:fs/promises";
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { downloadVerified } from "../../src/installer/download";
import {
  exists,
  makeTempDir,
  sha256Hex,
  startServer,
  type TestServer,
} from "../helpers";

describe("downloadVerified", () => {
  // 진행률 이벤트가 여러 번 발생하도록 청크보다 큰 파일
  const content = Buffer.alloc(256 * 1024, "a");
  const expected = { sha256: sha256Hex(content), size: content.length };
  let server: TestServer;
  let dir: string;
  let dest: string;

  beforeAll(async () => {
    server = await startServer();
    server.set("/bundle.js", content);
  });

  afterAll(() => server.close());

  beforeEach(async () => {
    dir = await makeTempDir();
    dest = path.join(dir, "nested", "index.cjs");
  });

  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it("다운로드 후 검증에 성공하면 최종 경로에 저장하고 임시 파일을 남기지 않는다", async () => {
    const progress: number[] = [];
    await downloadVerified(server.url("/bundle.js"), dest, expected, (p) =>
      progress.push(p),
    );

    expect(await fsp.readFile(dest)).toEqual(content);
    expect(await exists(`${dest}.download`)).toBe(false);
    expect(progress[progress.length - 1]).toBe(100);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
  });

  it("체크섬이 다르면 거부하고 최종 파일과 임시 파일을 모두 남기지 않는다", async () => {
    await expect(
      downloadVerified(server.url("/bundle.js"), dest, {
        ...expected,
        sha256: "0".repeat(64),
      }),
    ).rejects.toThrow("체크섬 불일치");

    expect(await exists(dest)).toBe(false);
    expect(await exists(`${dest}.download`)).toBe(false);
  });

  it("크기가 다르면 거부한다", async () => {
    await expect(
      downloadVerified(server.url("/bundle.js"), dest, {
        ...expected,
        size: 10,
      }),
    ).rejects.toThrow("파일 크기 불일치");
    expect(await exists(dest)).toBe(false);
  });

  it("HTTP 오류면 거부한다", async () => {
    await expect(
      downloadVerified(server.url("/missing.js"), dest, expected),
    ).rejects.toThrow("다운로드 실패: 404");
    expect(await exists(dest)).toBe(false);
  });
});
