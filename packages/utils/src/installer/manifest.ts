import { createPublicKey, verify } from "node:crypto";

// ---------------------------------------------------------------------------
// 신뢰하는 서명 키
// ---------------------------------------------------------------------------

// manifest 서명 검증용 Ed25519 공개키 (keyId → PEM)
// 앱 빌드에 포함되어 배포되며, 절대 런타임에 원격에서 받아오지 않는다.
// 키 교체: 새 키를 추가한 앱을 먼저 배포 → CI 서명 키 교체 → 다음 릴리스에서 옛 키 제거
export const TRUSTED_KEYS: Record<string, string> = {
  k2026a: `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAtv8Gh83XOQdTU0R071VbmHR16oWgY1Cp0z0xipFlr7E=
-----END PUBLIC KEY-----`,
};

// ---------------------------------------------------------------------------
// manifest
// ---------------------------------------------------------------------------

// GitHub Releases의 고정 태그(drivers-manifest)에 CI가 올려두는 드라이버 목록
export const DEFAULT_MANIFEST_URL =
  "https://github.com/dimsssss/data-pump/releases/download/drivers-manifest/manifest.json";

export interface ManifestEntry {
  package: string;
  version: string;
  url: string;
  sha256: string;
  size: number;
}

export interface DriverManifest {
  schemaVersion: number;
  sequence: number;
  publishedAt: string;
  expiresAt: string;
  drivers: Record<string, ManifestEntry>;
}

export interface FetchManifestOptions {
  // 이전에 받아들인 manifest의 sequence. 이보다 낮으면 롤백 공격으로 보고 거부
  minSequence?: number;
  trustedKeys?: Record<string, string>;
}

const SUPPORTED_SCHEMA_VERSION = 1;

async function fetchOk(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`manifest 요청 실패: ${res.status} ${url}`);
  return res;
}

export function verifyManifestSignature(
  body: Buffer,
  signature: { keyId: string; sig: string },
  trustedKeys: Record<string, string> = TRUSTED_KEYS,
) {
  const pem = trustedKeys[signature.keyId];
  if (!pem) throw new Error(`신뢰하지 않는 서명 키: ${signature.keyId}`);

  // sign-manifest.mjs와 동일하게 Ed25519(sign(null, ...))로 원본 바이트를 검증
  const ok = verify(
    null,
    body,
    createPublicKey(pem),
    Buffer.from(signature.sig, "base64"),
  );
  if (!ok) throw new Error("manifest 서명 검증 실패: 파일이 변조되었습니다");
}

export async function fetchManifest(
  url: string = DEFAULT_MANIFEST_URL,
  options: FetchManifestOptions = {},
): Promise<DriverManifest> {
  const [bodyRes, sigRes] = await Promise.all([
    fetchOk(url),
    fetchOk(`${url}.sig`),
  ]);
  const body = Buffer.from(await bodyRes.arrayBuffer());
  const signature = (await sigRes.json()) as { keyId: string; sig: string };

  // 서명은 파싱 전의 원본 바이트 기준이므로 검증 후에 JSON.parse
  verifyManifestSignature(body, signature, options.trustedKeys);

  const manifest = JSON.parse(body.toString("utf8")) as DriverManifest;
  if (manifest.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    throw new Error(
      `지원하지 않는 manifest schemaVersion: ${manifest.schemaVersion}`,
    );
  }
  if (Date.parse(manifest.expiresAt) < Date.now()) {
    throw new Error(`manifest가 만료되었습니다: ${manifest.expiresAt}`);
  }
  if (
    options.minSequence !== undefined &&
    manifest.sequence < options.minSequence
  ) {
    throw new Error(
      `이전 manifest로의 롤백이 감지되었습니다: sequence ${manifest.sequence} < ${options.minSequence}`,
    );
  }
  return manifest;
}
