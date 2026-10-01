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
import { DriverInstaller } from "../../src/installer/DriverInstaller";
import {
  buildManifest,
  createSigner,
  exists,
  makeTempDir,
  publishManifest,
  sha256Hex,
  startServer,
  type TestServer,
} from "../helpers";

// 실제 드라이버 번들처럼 esbuild CJS 형태의 작은 모듈
const BUNDLE = `"use strict";module.exports = { createConnection: () => "connected" };`;

describe("DriverInstaller", () => {
  const signer = createSigner();
  let server: TestServer;
  let driverDir: string;
  let manifestUrl: string;

  const publish = (overrides: Parameters<typeof buildManifest>[0] = {}) => {
    const manifest = buildManifest({
      drivers: {
        mysql: {
          package: "mysql2",
          version: "3.24.4",
          url: server.url("/mysql.js"),
          sha256: sha256Hex(BUNDLE),
          size: Buffer.byteLength(BUNDLE),
        },
      },
      ...overrides,
    });
    manifestUrl = publishManifest(server, signer, manifest).url;
    return manifest;
  };

  const createInstaller = (
    onProgress?: (p: { name: string; percent: number }) => void,
  ) =>
    new DriverInstaller({
      driverDir,
      manifestUrl,
      trustedKeys: signer.trustedKeys,
      onProgress,
    });

  const bundlePath = () => path.join(driverDir, "mysql", "3.24.4", "index.cjs");

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(() => server.close());

  beforeEach(async () => {
    driverDir = await makeTempDir();
    server.set("/mysql.js", BUNDLE);
    publish();
  });

  afterEach(async () => {
    await fsp.rm(driverDir, { recursive: true, force: true });
  });

  it("드라이버를 설치하고 로드한다", async () => {
    const progress: number[] = [];
    const installer = createInstaller((p) => progress.push(p.percent));

    await expect(installer.install("mysql")).resolves.toEqual({
      name: "mysql",
      version: "3.24.4",
    });
    expect(await fsp.readFile(bundlePath(), "utf8")).toBe(BUNDLE);
    expect(progress[progress.length - 1]).toBe(100);
    await expect(installer.list()).resolves.toEqual([
      { name: "mysql", version: "3.24.4" },
    ]);

    const mod = await installer.load<{ createConnection: () => string }>(
      "mysql",
    );
    expect(mod.createConnection()).toBe("connected");
  });

  it("installed.json과 manifest-state.json을 기록한다", async () => {
    await createInstaller().install("mysql");

    const installed = JSON.parse(
      await fsp.readFile(path.join(driverDir, "installed.json"), "utf8"),
    );
    expect(installed.mysql).toEqual({
      version: "3.24.4",
      sha256: sha256Hex(BUNDLE),
      file: bundlePath(),
    });

    const state = JSON.parse(
      await fsp.readFile(path.join(driverDir, "manifest-state.json"), "utf8"),
    );
    expect(state).toEqual({ sequence: 100 });
  });

  it("이미 받은 파일의 체크섬이 맞으면 다시 받지 않는다", async () => {
    await createInstaller().install("mysql");
    server.delete("/mysql.js"); // 다시 받으려 하면 404로 실패

    await expect(createInstaller().install("mysql")).resolves.toMatchObject({
      name: "mysql",
    });
  });

  it("이미 받은 파일이 손상되었으면 다시 받는다", async () => {
    await createInstaller().install("mysql");
    await fsp.writeFile(bundlePath(), "corrupted");

    await createInstaller().install("mysql");
    expect(await fsp.readFile(bundlePath(), "utf8")).toBe(BUNDLE);
  });

  it("서버의 번들이 manifest와 다르면 설치하지 않는다", async () => {
    server.set("/mysql.js", `module.exports = { evil: true };`);

    await expect(createInstaller().install("mysql")).rejects.toThrow();
    expect(await exists(bundlePath())).toBe(false);
    expect(await exists(path.join(driverDir, "installed.json"))).toBe(false);
  });

  it("설치 후 디스크에서 변조된 번들은 로드하지 않는다", async () => {
    await createInstaller().install("mysql");
    await fsp.appendFile(bundlePath(), "\n// tampered");

    await expect(createInstaller().load("mysql")).rejects.toThrow(
      "체크섬 불일치",
    );
  });

  it("manifest에 없는 드라이버는 거부한다", async () => {
    await expect(createInstaller().install("oracle")).rejects.toThrow(
      "지원하지 않는 드라이버: oracle",
    );
  });

  describe("ensure", () => {
    it("설치되어 있지 않으면 다운로드한다", async () => {
      await expect(createInstaller().ensure("mysql")).resolves.toEqual({
        name: "mysql",
        version: "3.24.4",
        downloaded: true,
      });
      expect(await fsp.readFile(bundlePath(), "utf8")).toBe(BUNDLE);
    });

    it("설치된 드라이버가 온전하면 네트워크 없이 그대로 쓴다", async () => {
      await createInstaller().install("mysql");
      // manifest와 번들을 모두 내려 네트워크를 쓰면 실패하게 만든다
      server.delete("/manifest.json");
      server.delete("/mysql.js");

      await expect(createInstaller().ensure("mysql")).resolves.toEqual({
        name: "mysql",
        version: "3.24.4",
        downloaded: false,
      });
    });

    it("설치된 드라이버가 손상되었으면 다시 받는다", async () => {
      await createInstaller().install("mysql");
      await fsp.writeFile(bundlePath(), "corrupted");

      await expect(createInstaller().ensure("mysql")).resolves.toMatchObject({
        downloaded: true,
      });
      expect(await fsp.readFile(bundlePath(), "utf8")).toBe(BUNDLE);
    });

    it("manifest에 없는 드라이버는 거부한다", async () => {
      await expect(createInstaller().ensure("sqlite")).rejects.toThrow(
        "지원하지 않는 드라이버: sqlite",
      );
    });
  });

  it("설치되지 않은 드라이버는 로드하지 않는다", async () => {
    await expect(createInstaller().load("mysql")).rejects.toThrow(
      "설치되지 않은 드라이버: mysql",
    );
  });

  it("신뢰하지 않는 키로 서명된 manifest면 설치하지 않는다", async () => {
    const installer = new DriverInstaller({
      driverDir,
      manifestUrl,
      trustedKeys: createSigner().trustedKeys,
    });

    await expect(installer.install("mysql")).rejects.toThrow(
      "manifest 서명 검증 실패",
    );
    expect(await exists(bundlePath())).toBe(false);
  });

  it("이전보다 낮은 sequence의 manifest로 롤백되면 거부한다", async () => {
    publish({ sequence: 200 });
    await createInstaller().install("mysql");

    publish({ sequence: 150 });
    await expect(createInstaller().install("mysql")).rejects.toThrow(
      "롤백이 감지되었습니다",
    );

    const state = JSON.parse(
      await fsp.readFile(path.join(driverDir, "manifest-state.json"), "utf8"),
    );
    expect(state).toEqual({ sequence: 200 });
  });
});
