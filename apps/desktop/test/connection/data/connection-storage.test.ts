import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ConnectionForm } from "@packages/utils/client";
import {
  createConnectionStorage,
  toSavedConnection,
  type SecretStore,
} from "../../../src/connection/data/connection-storage";

const makeTempDir = () => fsp.mkdtemp(path.join(os.tmpdir(), "desktop-test-"));

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

describe("createConnectionStorage", () => {
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
      createConnectionStorage(file, fakeSecrets).list(),
    ).resolves.toEqual([]);
  });

  it("접속 정보를 저장하고 비밀번호는 암호화해서 기록한다", async () => {
    const storage = createConnectionStorage(file, fakeSecrets);
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
    await createConnectionStorage(file, fakeSecrets).save("id-1", form());

    expect((await fsp.stat(file)).mode & 0o777).toBe(0o600);
  });

  it("보안 저장소가 없으면 비밀번호를 저장하지 않는다", async () => {
    const storage = createConnectionStorage(file, null);
    const { connection, passwordSaved } = await storage.save("id-1", form());

    expect(passwordSaved).toBe(false);
    expect(connection.password).toBeNull();
    expect(await fsp.readFile(file, "utf8")).not.toContain("apppass");
    await expect(storage.getPassword("id-1")).resolves.toBeUndefined();
  });

  it("같은 id로 저장하면 갱신하고 createdAt은 유지한다", async () => {
    const storage = createConnectionStorage(file, fakeSecrets);
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
    await createConnectionStorage(file, fakeSecrets).save("id-1", form());
    expect(await fsp.readdir(path.dirname(file))).toEqual(["connections.json"]);
  });

  it("다른 방식으로 암호화된 비밀번호는 복호화하지 않는다", async () => {
    await createConnectionStorage(file, fakeSecrets).save("id-1", form());
    const other = createConnectionStorage(file, {
      ...fakeSecrets,
      scheme: "other",
    });

    await expect(other.getPassword("id-1")).resolves.toBeUndefined();
  });

  it("깨진 파일은 덮어쓰지 않고 에러를 낸다", async () => {
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.writeFile(file, "{ not json");

    await expect(
      createConnectionStorage(file, fakeSecrets).save("id-1", form()),
    ).rejects.toThrow();
    expect(await fsp.readFile(file, "utf8")).toBe("{ not json");
  });

  it("newId는 매번 다른 id를 만든다", () => {
    const storage = createConnectionStorage(file, fakeSecrets);
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
    const storage = createConnectionStorage(
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
    const storage = createConnectionStorage(path.join(dir, "c.json"), null);
    const { connection } = await storage.save("id-1", form({ port: "" }));

    expect(toSavedConnection(connection)).toMatchObject({
      hasPassword: false,
      port: "",
    });
  });
});
