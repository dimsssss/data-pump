import { describe, expect, it } from "vitest";
import type { ConnectionForm, SavedConnection } from "@packages/utils/client";
import {
  connectionAddress,
  connectionName,
  describeSavedConnection,
} from "../../../src/connection/model/connection-label";

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

const saved = (overrides: Partial<SavedConnection> = {}): SavedConnection => ({
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
  ...overrides,
});

describe("connectionName", () => {
  it("Name이 있으면 그대로 쓴다", () => {
    expect(connectionName(form({ name: " prod " }))).toBe("prod");
  });

  it("Name이 비어 있으면 접속 정보로 만든다 (데이터베이스는 넣지 않는다)", () => {
    expect(connectionName(form({ name: "" }))).toBe(
      "mysql: app@127.0.0.1:3306",
    );
  });

  it("Host가 비어 있으면 Url을 쓴다", () => {
    expect(
      connectionName(
        form({ name: "", host: "", port: "", user: "", url: "mysql://h/db" }),
      ),
    ).toBe("mysql: mysql://h/db");
  });
});

describe("connectionAddress", () => {
  it("user@host:port/db 형태로 만든다", () => {
    expect(connectionAddress(form({ host: " 127.0.0.1 " }))).toBe(
      "app@127.0.0.1:3306/testdb",
    );
  });

  it("비어 있는 부분은 뺀다", () => {
    expect(connectionAddress(form({ user: "", port: "", database: "" }))).toBe(
      "127.0.0.1",
    );
  });

  it("비밀번호는 넣지 않는다", () => {
    expect(connectionAddress(form())).not.toContain("apppass");
  });
});

describe("describeSavedConnection", () => {
  it("Url이 있으면 Url을 그대로 쓴다", () => {
    expect(describeSavedConnection(saved({ url: "mysql://h/db" }))).toBe(
      "mysql://h/db",
    );
  });

  it("Url이 없으면 driver://user@host:port/db 형태로 만든다", () => {
    expect(describeSavedConnection(saved())).toBe(
      "mysql://app@127.0.0.1:3306/testdb",
    );
  });
});
