import fsp from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ConnectionForm, SavedConnection } from "../../client";
import type { ConnectParams } from "./driver";

// 비밀번호 암호화 방법. main에서 Electron safeStorage(OS 키체인)로 구현해 주입한다
export interface SecretStore {
  // 파일에 함께 기록해 어떤 방식으로 암호화했는지 구분
  scheme: string;
  encrypt(plain: string): string;
  decrypt(encrypted: string): string;
}

export interface StoredConnection {
  id: string;
  name: string;
  comment: string;
  driver: string;
  host: string;
  port?: number;
  user: string;
  database: string;
  url: string;
  // 평문 비밀번호는 절대 저장하지 않는다. 보안 저장소가 없으면 null
  password: { scheme: string; data: string } | null;
  createdAt: string;
  updatedAt: string;
  lastConnectedAt?: string;
}

interface ConnectionsFile {
  version: 1;
  connections: StoredConnection[];
}

// ---------------------------------------------------------------------------
// 입력값 검증: renderer 값은 신뢰하지 않고 main에서 다시 확인한다
// ---------------------------------------------------------------------------

export function parseConnectionForm(form: ConnectionForm): ConnectParams {
  if (!form.driver) throw new Error("드라이버를 선택하세요");

  const host = form.host.trim();
  const url = form.url.trim();
  if (!host && !url) throw new Error("Host 또는 Url을 입력하세요");

  let port: number | undefined;
  if (form.port.trim()) {
    port = Number(form.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Port가 올바르지 않습니다: ${form.port}`);
    }
  }

  return {
    host: host || undefined,
    port,
    user: form.user.trim() || undefined,
    password: form.password || undefined,
    database: form.database.trim() || undefined,
    url: url || undefined,
  };
}

export function defaultConnectionName(form: ConnectionForm) {
  if (form.name.trim()) return form.name.trim();
  const host = form.host.trim() || form.url.trim();
  const user = form.user.trim();
  return `${form.driver}: ${user ? `${user}@` : ""}${host}${form.port ? `:${form.port}` : ""}`;
}

// renderer로 보낼 형태: 암호화된 비밀번호도 포함하지 않는다
export function toSavedConnection(c: StoredConnection): SavedConnection {
  return {
    id: c.id,
    name: c.name,
    comment: c.comment,
    driver: c.driver,
    host: c.host,
    port: c.port === undefined ? "" : String(c.port),
    user: c.user,
    database: c.database,
    url: c.url,
    hasPassword: c.password !== null,
    lastConnectedAt: c.lastConnectedAt,
  };
}

// ---------------------------------------------------------------------------
// 저장소
// ---------------------------------------------------------------------------

export class ConnectionStorageService {
  constructor(
    // OS별 표준 설정 위치의 connections.json (main에서 app.getPath("userData")로 결정)
    readonly file: string,
    private secrets: SecretStore | null,
  ) {}

  get canStorePassword() {
    return this.secrets !== null;
  }

  private async read(): Promise<ConnectionsFile> {
    try {
      const data = JSON.parse(await fsp.readFile(this.file, "utf8"));
      if (data?.version === 1 && Array.isArray(data.connections)) return data;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    return { version: 1, connections: [] };
  }

  // 임시 파일에 쓴 뒤 rename: 쓰는 도중 앱이 죽어도 기존 파일이 깨지지 않는다
  private async write(data: ConnectionsFile) {
    await fsp.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    // 접속 정보는 본인만 읽을 수 있게 (Windows에서는 무시됨)
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await fsp.rename(tmp, this.file);
  }

  async list(): Promise<StoredConnection[]> {
    return (await this.read()).connections;
  }

  async get(id: string): Promise<StoredConnection | undefined> {
    return (await this.read()).connections.find((c) => c.id === id);
  }

  newId() {
    return randomUUID();
  }

  // id가 같으면 갱신, 없으면 추가
  async save(
    id: string,
    form: ConnectionForm,
    options: { connectedAt?: Date } = {},
  ): Promise<{ connection: StoredConnection; passwordSaved: boolean }> {
    const data = await this.read();
    const now = new Date().toISOString();
    const existing = data.connections.find((c) => c.id === id);
    const port = form.port.trim() ? Number(form.port) : undefined;

    const password =
      form.password && this.secrets
        ? {
            scheme: this.secrets.scheme,
            data: this.secrets.encrypt(form.password),
          }
        : null;

    const connection: StoredConnection = {
      id,
      name: defaultConnectionName(form),
      comment: form.comment,
      driver: form.driver,
      host: form.host.trim(),
      port,
      user: form.user.trim(),
      database: form.database.trim(),
      url: form.url.trim(),
      password,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastConnectedAt:
        options.connectedAt?.toISOString() ?? existing?.lastConnectedAt,
    };

    data.connections = existing
      ? data.connections.map((c) => (c.id === id ? connection : c))
      : [...data.connections, connection];
    await this.write(data);

    return { connection, passwordSaved: password !== null };
  }

  async getPassword(id: string): Promise<string | undefined> {
    const stored = (await this.get(id))?.password;
    if (!stored || !this.secrets || stored.scheme !== this.secrets.scheme)
      return undefined;
    return this.secrets.decrypt(stored.data);
  }
}
