import fsp from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ConnectionForm } from "../../client";
import {
  ConnectionStorageService,
  defaultConnectionName,
  parseConnectionForm,
  toSavedConnection,
  type SecretStore,
} from "../../src/connection/ConnectionStorageService";
import { makeTempDir } from "../helpers";

// OS 키체인 대신 쓰는 가역 암호화 (테스트용)
const fakeSecrets: SecretStore = {
  scheme: "test-reverse",
  encrypt: (s) => Buffer.from([...s].reverse().join("")).toString("base64"),
  decrypt: (s) => [...Buffer.from(s, "base64").toString()].reverse().join(""),
};

const form = (overrides: Partial<ConnectionForm> = {}): ConnectionForm => ({
  name: "local",
  comment: "",
  driver: "mysql",
  host: "127.0.0.1",
  port: "3306",
  user: "app",
  password: "apppass",
  database: "testdb",
  url: "",
  ...overrides,
});

describe("parseConnectionForm", () => {
  it("입력값을 접속 파라미터로 변환한다", () => {
    expect(
      parseConnectionForm(form({ host: " 127.0.0.1 ", database: "" })),
    ).toEqual({
      host: "127.0.0.1",
      port: 3306,
      user: "app",
      password: "apppass",
      database: undefined,
      url: undefined,
    });
  });

  it("Host와 Url이 모두 비어 있으면 거부한다", () => {
    expect(() => parseConnectionForm(form({ host: " ", url: "" }))).toThrow(
      "Host 또는 Url을 입력하세요",
    );
  });

  it.each(["abc", "0", "65536", "33.5"])(
    "잘못된 Port(%s)는 거부한다",
    (port) => {
      expect(() => parseConnectionForm(form({ port }))).toThrow(
        "Port가 올바르지 않습니다",
      );
    },
  );

  it("Port가 비어 있으면 드라이버 기본값을 쓰도록 undefined로 둔다", () => {
    expect(parseConnectionForm(form({ port: "" })).port).toBeUndefined();
  });

  it("드라이버가 없으면 거부한다", () => {
    expect(() => parseConnectionForm(form({ driver: "" }))).toThrow(
      "드라이버를 선택하세요",
    );
  });
});

describe("defaultConnectionName", () => {
  it("Name이 있으면 그대로 쓴다", () => {
    expect(defaultConnectionName(form({ name: " prod " }))).toBe("prod");
  });

  it("Name이 비어 있으면 접속 정보로 만든다", () => {
    expect(defaultConnectionName(form({ name: "" }))).toBe(
      "mysql: app@127.0.0.1:3306",
    );
  });
});

describe("ConnectionStorageService", () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await makeTempDir();
    file = path.join(dir, "config", "connections.json");
  });

  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it("파일이 없으면 빈 목록이다", async () => {
    await expect(
      new ConnectionStorageService(file, fakeSecrets).list(),
    ).resolves.toEqual([]);
  });

  it("접속 정보를 저장하고 비밀번호는 암호화해서 기록한다", async () => {
    const storage = new ConnectionStorageService(file, fakeSecrets);
    const connectedAt = new Date("2026-09-30T00:00:00Z");

    const { connection, passwordSaved } = await storage.save("id-1", form(), {
      connectedAt,
    });

    expect(passwordSaved).toBe(true);
    expect(connection).toMatchObject({
      id: "id-1",
      name: "local",
      driver: "mysql",
      host: "127.0.0.1",
      port: 3306,
      user: "app",
      database: "testdb",
      password: { scheme: "test-reverse" },
      lastConnectedAt: "2026-09-30T00:00:00.000Z",
    });

    const raw = await fsp.readFile(file, "utf8");
    expect(raw).not.toContain("apppass");
    expect(JSON.parse(raw)).toMatchObject({
      version: 1,
      connections: [{ id: "id-1" }],
    });
    await expect(storage.getPassword("id-1")).resolves.toBe("apppass");
  });

  it("파일은 본인만 읽고 쓸 수 있는 권한으로 만든다", async () => {
    if (process.platform === "win32") return;
    await new ConnectionStorageService(file, fakeSecrets).save("id-1", form());

    expect((await fsp.stat(file)).mode & 0o777).toBe(0o600);
  });

  it("보안 저장소가 없으면 비밀번호를 저장하지 않는다", async () => {
    const storage = new ConnectionStorageService(file, null);
    const { connection, passwordSaved } = await storage.save("id-1", form());

    expect(passwordSaved).toBe(false);
    expect(connection.password).toBeNull();
    expect(await fsp.readFile(file, "utf8")).not.toContain("apppass");
    await expect(storage.getPassword("id-1")).resolves.toBeUndefined();
  });

  it("같은 id로 저장하면 갱신하고 createdAt은 유지한다", async () => {
    const storage = new ConnectionStorageService(file, fakeSecrets);
    const first = (await storage.save("id-1", form())).connection;
    await storage.save("id-2", form({ name: "other" }));

    await new Promise((r) => setTimeout(r, 5));
    const updated = (
      await storage.save("id-1", form({ name: "renamed", port: "3307" }))
    ).connection;

    const list = await storage.list();
    expect(list.map((c) => c.id)).toEqual(["id-1", "id-2"]);
    expect(updated).toMatchObject({
      name: "renamed",
      port: 3307,
      createdAt: first.createdAt,
    });
    expect(updated.updatedAt > first.updatedAt).toBe(true);
  });

  it("쓰기 후 임시 파일을 남기지 않는다", async () => {
    await new ConnectionStorageService(file, fakeSecrets).save("id-1", form());
    expect(await fsp.readdir(path.dirname(file))).toEqual(["connections.json"]);
  });

  it("다른 방식으로 암호화된 비밀번호는 복호화하지 않는다", async () => {
    await new ConnectionStorageService(file, fakeSecrets).save("id-1", form());
    const other = new ConnectionStorageService(file, {
      ...fakeSecrets,
      scheme: "other",
    });

    await expect(other.getPassword("id-1")).resolves.toBeUndefined();
  });

  it("깨진 파일은 덮어쓰지 않고 에러를 낸다", async () => {
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.writeFile(file, "{ not json");

    await expect(
      new ConnectionStorageService(file, fakeSecrets).save("id-1", form()),
    ).rejects.toThrow();
    expect(await fsp.readFile(file, "utf8")).toBe("{ not json");
  });

  it("newId는 매번 다른 id를 만든다", () => {
    const storage = new ConnectionStorageService(file, fakeSecrets);
    expect(storage.newId()).not.toBe(storage.newId());
  });
});

describe("toSavedConnection", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTempDir();
  });

  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it("renderer로 보낼 형태에는 비밀번호(암호문 포함)가 없고 저장 여부만 있다", async () => {
    const storage = new ConnectionStorageService(
      path.join(dir, "c.json"),
      fakeSecrets,
    );
    const { connection } = await storage.save("id-1", form());

    const saved = toSavedConnection(connection);

    expect(saved).toEqual({
      id: "id-1",
      name: "local",
      comment: "",
      driver: "mysql",
      host: "127.0.0.1",
      port: "3306",
      user: "app",
      database: "testdb",
      url: "",
      hasPassword: true,
      lastConnectedAt: undefined,
    });
    expect(JSON.stringify(saved)).not.toContain(connection.password!.data);
  });

  it("비밀번호가 없으면 hasPassword는 false, port가 없으면 빈 문자열", async () => {
    const storage = new ConnectionStorageService(
      path.join(dir, "c.json"),
      null,
    );
    const { connection } = await storage.save("id-1", form({ port: "" }));

    expect(toSavedConnection(connection)).toMatchObject({
      hasPassword: false,
      port: "",
    });
  });
});
