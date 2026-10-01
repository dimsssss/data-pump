import { sign } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  fetchManifest,
  TRUSTED_KEYS,
  verifyManifestSignature,
} from "../../src/installer/manifest";
import {
  buildManifest,
  createSigner,
  publishManifest,
  signManifest,
  startServer,
  type TestServer,
} from "../helpers";

describe("fetchManifest", () => {
  const signer = createSigner();
  const attacker = createSigner(signer.keyId); // 같은 keyId를 사칭하는 다른 키
  let server: TestServer;

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(() => server.close());

  const fetchWith = (url: string, minSequence?: number) =>
    fetchManifest(url, { trustedKeys: signer.trustedKeys, minSequence });

  it("신뢰하는 키로 서명된 manifest를 받아들인다", async () => {
    const manifest = buildManifest({ sequence: 7 });
    const { url } = publishManifest(
      server,
      signer,
      manifest,
      "/ok/manifest.json",
    );

    await expect(fetchWith(url)).resolves.toEqual(manifest);
  });

  it("서명 후 본문이 변조되면 거부한다", async () => {
    const { body, sig } = signManifest(
      buildManifest(),
      signer.privateKey,
      signer.keyId,
    );
    const tampered = Buffer.from(
      body.toString().replace('"sequence":100', '"sequence":999'),
    );
    server.set("/tampered/manifest.json", tampered);
    server.set("/tampered/manifest.json.sig", sig);

    await expect(
      fetchWith(server.url("/tampered/manifest.json")),
    ).rejects.toThrow("manifest 서명 검증 실패");
  });

  it("keyId를 사칭한 다른 키의 서명은 거부한다", async () => {
    const { url } = publishManifest(
      server,
      attacker,
      buildManifest(),
      "/spoof/manifest.json",
    );

    await expect(fetchWith(url)).rejects.toThrow("manifest 서명 검증 실패");
  });

  it("모르는 keyId는 거부한다", async () => {
    const { url } = publishManifest(
      server,
      createSigner("unknown"),
      buildManifest(),
      "/unknown/manifest.json",
    );

    await expect(fetchWith(url)).rejects.toThrow(
      "신뢰하지 않는 서명 키: unknown",
    );
  });

  it("서명 파일이 없으면 거부한다", async () => {
    const { url } = publishManifest(
      server,
      signer,
      buildManifest(),
      "/nosig/manifest.json",
    );
    server.delete("/nosig/manifest.json.sig");

    await expect(fetchWith(url)).rejects.toThrow("manifest 요청 실패: 404");
  });

  it("지원하지 않는 schemaVersion은 거부한다", async () => {
    const { url } = publishManifest(
      server,
      signer,
      buildManifest({ schemaVersion: 2 }),
      "/schema/manifest.json",
    );

    await expect(fetchWith(url)).rejects.toThrow(
      "지원하지 않는 manifest schemaVersion: 2",
    );
  });

  it("만료된 manifest는 거부한다", async () => {
    const expiresAt = new Date(Date.now() - 1000).toISOString();
    const { url } = publishManifest(
      server,
      signer,
      buildManifest({ expiresAt }),
      "/expired/manifest.json",
    );

    await expect(fetchWith(url)).rejects.toThrow("manifest가 만료되었습니다");
  });

  it("minSequence보다 낮은 sequence는 롤백으로 보고 거부한다", async () => {
    const { url } = publishManifest(
      server,
      signer,
      buildManifest({ sequence: 5 }),
      "/rollback/manifest.json",
    );

    await expect(fetchWith(url, 6)).rejects.toThrow("롤백이 감지되었습니다");
    await expect(fetchWith(url, 5)).resolves.toMatchObject({ sequence: 5 });
  });
});

describe("TRUSTED_KEYS", () => {
  it("앱에 포함된 키는 Ed25519 서명을 검증할 수 있다", () => {
    // 개인키 없이 검증 가능한 형식인지만 확인 (잘못된 서명은 false로 떨어져 에러가 나야 함)
    const body = Buffer.from("{}");
    for (const keyId of Object.keys(TRUSTED_KEYS)) {
      expect(() =>
        verifyManifestSignature(body, {
          keyId,
          sig: Buffer.alloc(64).toString("base64"),
        }),
      ).toThrow("manifest 서명 검증 실패");
    }
  });

  it("주입한 키 목록이 있으면 그 키로 검증한다", () => {
    const injected = createSigner("injected");
    const body = Buffer.from("{}");
    const sig = sign(null, body, injected.privateKey).toString("base64");

    expect(() =>
      verifyManifestSignature(
        body,
        { keyId: "injected", sig },
        injected.trustedKeys,
      ),
    ).not.toThrow();
    // 기본 키 목록에는 없는 keyId
    expect(() =>
      verifyManifestSignature(body, { keyId: "injected", sig }),
    ).toThrow("신뢰하지 않는 서명 키");
  });
});
