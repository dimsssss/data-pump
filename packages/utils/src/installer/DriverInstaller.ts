import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
// renderer와 공유하는 타입은 Node 의존성이 없는 client 입구에 둔다
import type { DriverInfo, DriverProgress } from "../../client";
import { verifyFile } from "./checksum";
import { downloadVerified } from "./download";
import { DEFAULT_MANIFEST_URL, fetchManifest } from "./manifest";

export interface DriverInstallerConfig {
  driverDir: string;
  manifestUrl?: string;
  // 기본값은 앱에 포함된 TRUSTED_KEYS
  trustedKeys?: Record<string, string>;
  onProgress?: (p: DriverProgress) => void;
}

interface InstalledEntry {
  version: string;
  sha256: string;
  file: string;
}

type Installed = Record<string, InstalledEntry>;

export class DriverInstaller {
  private loaded = new Map<string, unknown>();

  constructor(private config: DriverInstallerConfig) {}

  private get installedPath() {
    return path.join(this.config.driverDir, "installed.json");
  }

  // 마지막으로 받아들인 manifest sequence (롤백 방지용)
  private get manifestStatePath() {
    return path.join(this.config.driverDir, "manifest-state.json");
  }

  private async readLastSequence(): Promise<number | undefined> {
    try {
      const { sequence } = JSON.parse(
        await fsp.readFile(this.manifestStatePath, "utf8"),
      );
      return typeof sequence === "number" ? sequence : undefined;
    } catch {
      return undefined;
    }
  }

  private async writeLastSequence(sequence: number) {
    await fsp.mkdir(this.config.driverDir, { recursive: true });
    await fsp.writeFile(
      this.manifestStatePath,
      JSON.stringify({ sequence }, null, 2),
    );
  }

  private async readInstalled(): Promise<Installed> {
    try {
      return JSON.parse(await fsp.readFile(this.installedPath, "utf8"));
    } catch {
      return {};
    }
  }

  private async writeInstalled(data: Installed) {
    await fsp.mkdir(this.config.driverDir, { recursive: true });
    await fsp.writeFile(this.installedPath, JSON.stringify(data, null, 2));
  }

  async list(): Promise<DriverInfo[]> {
    const installed = await this.readInstalled();
    return Object.entries(installed).map(([name, v]) => ({
      name,
      version: v.version,
    }));
  }

  async install(name: string): Promise<DriverInfo> {
    const manifest = await fetchManifest(
      this.config.manifestUrl ?? DEFAULT_MANIFEST_URL,
      {
        minSequence: await this.readLastSequence(),
        trustedKeys: this.config.trustedKeys,
      },
    );
    await this.writeLastSequence(manifest.sequence);

    const entry = manifest.drivers[name];
    if (!entry) throw new Error(`지원하지 않는 드라이버: ${name}`);

    const finalPath = path.join(
      this.config.driverDir,
      name,
      entry.version,
      "index.cjs",
    );
    const expected = { sha256: entry.sha256, size: entry.size };

    // 이미 받은 파일이 있어도 체크섬이 맞을 때만 재사용
    const reusable =
      fs.existsSync(finalPath) &&
      (await verifyFile(finalPath, expected).then(
        () => true,
        () => false,
      ));

    if (!reusable) {
      await downloadVerified(entry.url, finalPath, expected, (percent) =>
        this.config.onProgress?.({ name, percent }),
      );
    }
    this.config.onProgress?.({ name, percent: 100 });

    const installed = await this.readInstalled();
    installed[name] = {
      version: entry.version,
      sha256: entry.sha256,
      file: finalPath,
    };
    await this.writeInstalled(installed);
    this.loaded.delete(name);

    return { name, version: entry.version };
  }

  // 설치되어 있고 체크섬이 맞으면 네트워크 없이 그대로 쓰고, 없거나 손상됐을 때만 설치한다
  async ensure(name: string): Promise<DriverInfo & { downloaded: boolean }> {
    const info = (await this.readInstalled())[name];
    if (info) {
      const intact = await verifyFile(info.file, { sha256: info.sha256 }).then(
        () => true,
        () => false,
      );
      if (intact) return { name, version: info.version, downloaded: false };
    }
    return { ...(await this.install(name)), downloaded: true };
  }

  async load<T = unknown>(name: string): Promise<T> {
    if (this.loaded.has(name)) return this.loaded.get(name) as T;

    const installed = await this.readInstalled();
    const info = installed[name];
    if (!info) throw new Error(`설치되지 않은 드라이버: ${name}`);

    // 설치 이후 디스크에서 변조되지 않았는지 로드 직전에 한 번 더 확인
    await verifyFile(info.file, { sha256: info.sha256 });

    const req = createRequire(info.file);
    const mod = req(info.file) as T;
    this.loaded.set(name, mod);
    return mod;
  }
}
