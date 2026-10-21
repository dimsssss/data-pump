import { describe, expect, it } from "vitest";
import type { ConnectionForm, SavedConnection } from "@packages/utils/client";
import {
  EMPTY_FORM,
  parseConnectionForm,
  toActiveConnection,
  toForm,
} from "../../../src/connection/model/connection-form";

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

describe("toForm", () => {
  it("저장된 접속을 폼으로 채우고 비밀번호는 비워 둔다", () => {
    const saved: SavedConnection = {
      id: "id-1",
      name: "local",
      comment: "memo",
      driver: "mysql",
      host: "127.0.0.1",
      port: "3306",
      user: "app",
      database: "testdb",
      url: "",
      hasPassword: true,
    };
    expect(toForm(saved)).toEqual({
      ...EMPTY_FORM,
      ...form({ comment: "memo", password: "" }),
      id: "id-1",
    });
  });
});

describe("toActiveConnection", () => {
  it("작업 화면에 넘길 현재 접속을 만든다", () => {
    const connectedAt = new Date("2026-01-01T00:00:00.000Z");
    expect(
      toActiveConnection("id-1", form({ name: "" }), "8.4.0", connectedAt),
    ).toEqual({
      id: "id-1",
      name: "mysql: app@127.0.0.1:3306",
      driver: "mysql",
      serverVersion: "8.4.0",
      database: "testdb",
      address: "app@127.0.0.1:3306/testdb",
      connectedAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
