import fs from "node:fs";
import fsp from "node:fs/promises";
import { createHash } from "node:crypto";

export async function sha256(file: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of fs.createReadStream(file)) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

export async function verifyFile(
  file: string,
  expected: { sha256: string; size?: number },
) {
  if (expected.size !== undefined) {
    const { size } = await fsp.stat(file);
    if (size !== expected.size) {
      throw new Error(
        `파일 크기 불일치: expected ${expected.size}, actual ${size}`,
      );
    }
  }

  const actual = await sha256(file);
  if (actual !== expected.sha256.toLowerCase()) {
    throw new Error(
      `체크섬 불일치\n  expected: ${expected.sha256}\n  actual:   ${actual}`,
    );
  }
}
