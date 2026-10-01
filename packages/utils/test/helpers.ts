import http from "node:http";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createHash,
  generateKeyPairSync,
  sign,
  type KeyObject,
} from "node:crypto";
import type { AddressInfo } from "node:net";
import type { DriverManifest } from "../src/installer/manifest";

// 네트워크 없이 GitHub Releases를 흉내 내는 로컬 HTTP 서버
export async function startServer() {
  const routes = new Map<string, string | Buffer>();
  const server = http.createServer((req, res) => {
    const body = routes.get(req.url ?? "");
    if (body === undefined) {
      res.statusCode = 404;
      return res.end();
    }
    res.setHeader("content-length", Buffer.byteLength(body));
    res.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: (p: string) => `http://127.0.0.1:${port}${p}`,
    set: (p: string, body: string | Buffer) => routes.set(p, body),
    delete: (p: string) => routes.delete(p),
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export type TestServer = Awaited<ReturnType<typeof startServer>>;

export function createSigner(keyId = "test-key") {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    keyId,
    privateKey,
    trustedKeys: {
      [keyId]: publicKey.export({ type: "spki", format: "pem" }).toString(),
    },
  };
}

export type Signer = ReturnType<typeof createSigner>;

export const sha256Hex = (data: string | Buffer) =>
  createHash("sha256").update(data).digest("hex");

// sign-manifest.mjs와 같은 방식: JSON.stringify 결과 바이트에 Ed25519 서명
export function signManifest(
  manifest: DriverManifest,
  privateKey: KeyObject,
  keyId: string,
) {
  const body = Buffer.from(JSON.stringify(manifest));
  const sig = JSON.stringify({
    keyId,
    sig: sign(null, body, privateKey).toString("base64"),
  });
  return { body, sig };
}

export function buildManifest(
  overrides: Partial<DriverManifest> = {},
): DriverManifest {
  const now = Date.now();
  return {
    schemaVersion: 1,
    sequence: 100,
    publishedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 30 * 86400_000).toISOString(),
    drivers: {},
    ...overrides,
  };
}

// manifest + 서명을 서버의 path 경로에 올린다
export function publishManifest(
  server: TestServer,
  signer: Signer,
  manifest: DriverManifest,
  p = "/manifest.json",
) {
  const { body, sig } = signManifest(manifest, signer.privateKey, signer.keyId);
  server.set(p, body);
  server.set(`${p}.sig`, sig);
  return { body, sig, url: server.url(p) };
}

export async function makeTempDir() {
  return fsp.mkdtemp(path.join(os.tmpdir(), "utils-test-"));
}

export async function exists(file: string) {
  return fsp.access(file).then(
    () => true,
    () => false,
  );
}
