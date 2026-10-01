import { sign, verify, createPrivateKey, createPublicKey } from 'node:crypto';
import fs from 'node:fs/promises';

const { DRIVER_SIGNING_KEY, DRIVER_KEY_ID, DRIVER_BASE_URL, DRIVER_SEQUENCE } = process.env;
for (const [k, v] of Object.entries({ DRIVER_SIGNING_KEY, DRIVER_KEY_ID, DRIVER_BASE_URL, DRIVER_SEQUENCE })) {
  if (!v) throw new Error(`missing env: ${k}`);
}

const results = JSON.parse(await fs.readFile('dist/build-result.json', 'utf8'));
const now = new Date();
const VALID_DAYS = 30;

const manifest = {
  schemaVersion: 1,
  sequence: Number(DRIVER_SEQUENCE),
  publishedAt: now.toISOString(),
  expiresAt: new Date(now.getTime() + VALID_DAYS * 86400_000).toISOString(),
  drivers: Object.fromEntries(
    results.map((r) => [
      r.id,
      {
        package: r.package,
        version: r.version,
        url: `${DRIVER_BASE_URL}/${r.file}`, // 태그가 포함된 릴리스 다운로드 경로
        sha256: r.sha256,
        size: r.size,
      },
    ]),
  ),
};

const body = Buffer.from(JSON.stringify(manifest));
const privateKey = createPrivateKey(DRIVER_SIGNING_KEY);
const signature = sign(null, body, privateKey);

if (!verify(null, body, createPublicKey(privateKey), signature)) {
  throw new Error('self-verification failed');
}

await fs.writeFile('dist/manifest.json', body);
await fs.writeFile(
  'dist/manifest.json.sig',
  JSON.stringify({ keyId: DRIVER_KEY_ID, sig: signature.toString('base64') }),
);

console.log(`signed manifest seq=${manifest.sequence} keyId=${DRIVER_KEY_ID}`);