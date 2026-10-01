import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { verifyFile } from "./checksum";

export async function downloadTo(
  url: string,
  dest: string,
  options: {
    expectedSize?: number;
    onProgress?: (percent: number) => void;
  } = {},
) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`다운로드 실패: ${res.status} ${url}`);
  }

  await fsp.mkdir(path.dirname(dest), { recursive: true });

  const total =
    Number(res.headers.get("content-length")) || options.expectedSize || 0;
  let received = 0;

  const progress = new Transform({
    transform(chunk, _enc, cb) {
      received += chunk.length;
      if (total && options.onProgress) {
        options.onProgress(Math.min(100, Math.round((received / total) * 100)));
      }
      cb(null, chunk);
    },
  });

  // fetch의 전역 ReadableStream 타입과 node:stream/web 타입이 달라 명시적으로 맞춰준다
  const body = res.body as NodeWebReadableStream<Uint8Array>;
  await pipeline(Readable.fromWeb(body), progress, fs.createWriteStream(dest));
}

export async function downloadVerified(
  url: string,
  dest: string,
  expected: { sha256: string; size?: number },
  onProgress?: (percent: number) => void,
) {
  const tmp = `${dest}.download`;
  try {
    await downloadTo(url, tmp, { expectedSize: expected.size, onProgress });
    await verifyFile(tmp, expected);
    await fsp.rename(tmp, dest);
  } catch (err) {
    await fsp.rm(tmp, { force: true });
    throw err;
  }
}
