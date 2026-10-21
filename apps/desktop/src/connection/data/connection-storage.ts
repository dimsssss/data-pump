// 저장된 접속 정보 파일(connections.json) 읽기·쓰기와 비밀번호 암호화 (main 전용)
import fsp from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ConnectionForm, SavedConnection } from "@packages/utils/client";
import { parsePort } from "../model/connection-form";

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

export type ConnectionStorage = ReturnType<typeof createConnectionStorage>;

export function createConnectionStorage(
  // OS별 표준 설정 위치의 connections.json (main에서 app.getPath("userData")로 결정)
  file: string,
  secrets: SecretStore | null,
) {
  async function read(): Promise<ConnectionsFile> {
    try {
      const data = JSON.parse(await fsp.readFile(file, "utf8"));
      if (data?.version === 1 && Array.isArray(data.connections)) return data;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    return { version: 1, connections: [] };
  }

  // 임시 파일에 쓴 뒤 rename: 쓰는 도중 앱이 죽어도 기존 파일이 깨지지 않는다
  async function write(data: ConnectionsFile) {
    await fsp.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    // 접속 정보는 본인만 읽을 수 있게 (Windows에서는 무시됨)
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await fsp.rename(tmp, file);
  }

  async function list(): Promise<StoredConnection[]> {
    return (await read()).connections;
  }

  async function get(id: string): Promise<StoredConnection | undefined> {
    return (await read()).connections.find((c) => c.id === id);
  }

  function newId() {
    return randomUUID();
  }

  // id가 같으면 갱신, 없으면 추가.
  // 입력 검증과 이름 정하기는 호출하는 쪽(connection/model)이 끝낸 뒤 넘긴다
  async function save(
    id: string,
    form: ConnectionForm,
    options: { connectedAt?: Date } = {},
  ): Promise<{ connection: StoredConnection; passwordSaved: boolean }> {
    const data = await read();
    const now = new Date().toISOString();
    const existing = data.connections.find((c) => c.id === id);

    const password =
      form.password && secrets
        ? { scheme: secrets.scheme, data: secrets.encrypt(form.password) }
        : null;

    const connection: StoredConnection = {
      id,
      name: form.name.trim(),
      comment: form.comment,
      driver: form.driver,
      host: form.host.trim(),
      port: parsePort(form.port),
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
    await write(data);

    return { connection, passwordSaved: password !== null };
  }

  async function getPassword(id: string): Promise<string | undefined> {
    const stored = (await get(id))?.password;
    if (!stored || !secrets || stored.scheme !== secrets.scheme)
      return undefined;
    return secrets.decrypt(stored.data);
  }

  return { file, list, get, newId, save, getPassword };
}
