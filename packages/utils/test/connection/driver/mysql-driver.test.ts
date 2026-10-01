import { describe, expect, it } from "vitest";
import { mysqlDriver } from "../../../src/connection/driver";

describe("mysqlDriver", () => {
  // mysql2의 createConnection(...).promise() 형태를 흉내 낸다
  function fakeMysql2(queryResult: () => Promise<unknown>) {
    const calls: {
      options?: Record<string, unknown>;
      ended: boolean;
      destroyed: boolean;
    } = {
      ended: false,
      destroyed: false,
    };
    const mod = {
      createConnection(options: Record<string, unknown>) {
        calls.options = options;
        return {
          promise: () => ({
            query: queryResult,
            end: async () => {
              calls.ended = true;
            },
            destroy: () => {
              calls.destroyed = true;
            },
          }),
        };
      },
    };
    return { mod, calls };
  }

  it("host 기반 옵션으로 접속하고 버전을 조회한다", async () => {
    const { mod, calls } = fakeMysql2(async () => [[{ version: "8.4.0" }], []]);
    const session = await mysqlDriver.connect(mod, {
      host: "127.0.0.1",
      port: 3306,
      user: "app",
      password: "secret",
      database: "testdb",
    });

    expect(session.serverVersion).toBe("8.4.0");
    expect(calls.options).toMatchObject({
      host: "127.0.0.1",
      port: 3306,
      user: "app",
      password: "secret",
      database: "testdb",
      connectTimeout: 10_000,
    });
    await session.close();
    expect(calls.ended).toBe(true);
  });

  it("host가 비어 있으면 url로 접속한다", async () => {
    const { mod, calls } = fakeMysql2(async () => [[{ version: "8.0.0" }], []]);
    await mysqlDriver.connect(mod, {
      url: "mysql://app@db:3306/testdb",
      password: "pw",
    });

    expect(calls.options).toMatchObject({
      uri: "mysql://app@db:3306/testdb",
      password: "pw",
    });
    expect(calls.options).not.toHaveProperty("host");
  });

  it("로그인에 실패하면 연결을 정리하고 에러를 전달한다", async () => {
    const { mod, calls } = fakeMysql2(async () => {
      throw new Error("Access denied for user 'app'@'localhost'");
    });

    await expect(mysqlDriver.connect(mod, { host: "db" })).rejects.toThrow(
      "Access denied",
    );
    expect(calls.destroyed).toBe(true);
  });
});
