import { describe, expect, it, vi } from "vitest";
import { mysqlDriver } from "../../../src/session/driver";
import { QUERY_ROW_LIMIT } from "../../../src/session/driver/Driver";

describe("mysqlDriver", () => {
  // mysql2의 createConnection(...).promise() 형태를 흉내 낸다
  function fakeMysql2(queryResult: (sql: string) => Promise<unknown>) {
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

  // SQL에 들어 있는 키워드로 응답을 고르는 가짜 query
  function routedQuery(routes: [string, unknown[]][], executed: string[] = []) {
    return async (sql: string) => {
      executed.push(sql);
      const route = routes.find(([keyword]) => sql.includes(keyword));
      if (!route) throw new Error(`예상하지 못한 쿼리: ${sql}`);
      return [route[1], []];
    };
  }

  // testdb에 orders, users 두 테이블이 있는 서버. COUNT(*) 응답은 count로 정한다
  function overviewQuery(
    count: (sql: string) => Promise<unknown[]>,
    executed: string[] = [],
  ) {
    const base = routedQuery(
      [
        ["VERSION()", [{ version: "8.4.0" }]],
        ["information_schema_stats_expiry", []],
        ["SELECT DATABASE() AS db", [{ db: "testdb" }]],
        [
          "AS name FROM information_schema.SCHEMATA",
          [{ name: "app" }, { name: "testdb" }],
        ],
        [
          "information_schema.TABLES",
          [
            // TABLE_ROWS는 number, 크기 합은 DECIMAL이라 문자열로 온다
            { name: "orders", row_count: 3, bytes: "32768" },
            { name: "users", row_count: null, bytes: "16384" },
          ],
        ],
        [
          "index_count",
          [
            {
              index_count: 4,
              view_count: 1,
              trigger_count: 0,
              encoding: "utf8mb4",
            },
          ],
        ],
      ],
      executed,
    );
    return async (sql: string) =>
      sql.includes("exact_rows") ? [await count(sql), []] : base(sql);
  }

  it("overview는 현재 DB의 테이블·정확한 행 수·객체 수·크기·인코딩을 조회한다", async () => {
    const executed: string[] = [];
    const { mod } = fakeMysql2(
      overviewQuery(async (sql) => {
        executed.push(sql);
        return [{ exact_rows: sql.includes("`orders`") ? 100000 : 6 }];
      }, executed),
    );
    const session = await mysqlDriver.connect(mod, { host: "db" });

    await expect(session.overview()).resolves.toEqual({
      database: "testdb",
      tables: [
        { name: "orders", rows: 100000, rowsEstimated: false, bytes: 32768 },
        { name: "users", rows: 6, rowsEstimated: false, bytes: 16384 },
      ],
      indexes: 4,
      views: 1,
      triggers: 0,
      sizeBytes: 49152,
      encoding: "utf8mb4",
      databases: ["app", "testdb"],
    });
    // 통계 캐시를 끄는 설정을 먼저 실행한다
    expect(executed[1]).toContain("information_schema_stats_expiry = 0");
    // COUNT(*)는 시간 제한 힌트를 붙여 실행한다
    const countSql = executed.find((sql) => sql.includes("exact_rows"));
    expect(countSql).toContain("MAX_EXECUTION_TIME(1000)");
  });

  it("COUNT(*)가 시간 제한을 넘기면 그 테이블만 추정값을 쓴다", async () => {
    const { mod } = fakeMysql2(
      overviewQuery(async (sql) => {
        if (sql.includes("`orders`"))
          throw new Error(
            "Query execution was interrupted, maximum statement execution time exceeded",
          );
        return [{ exact_rows: 6 }];
      }),
    );
    const session = await mysqlDriver.connect(mod, { host: "db" });

    const overview = await session.overview();
    expect(overview.tables).toEqual([
      { name: "orders", rows: 3, rowsEstimated: true, bytes: 32768 },
      { name: "users", rows: 6, rowsEstimated: false, bytes: 16384 },
    ]);
  });

  it("정확한 행 수 조회에 쓴 시간이 예산을 넘으면 남은 테이블은 세지 않는다", async () => {
    let clock = 0;
    const now = vi.spyOn(Date, "now").mockImplementation(() => clock);
    const counted: string[] = [];
    const { mod } = fakeMysql2(
      overviewQuery(async (sql) => {
        counted.push(sql);
        clock += 5_000; // 첫 테이블에서 예산을 다 쓴다
        return [{ exact_rows: 100000 }];
      }),
    );
    const session = await mysqlDriver.connect(mod, { host: "db" });

    try {
      const overview = await session.overview();
      expect(counted).toHaveLength(1);
      expect(overview.tables.map((t) => [t.rows, t.rowsEstimated])).toEqual([
        [100000, false],
        [0, true],
      ]);
    } finally {
      now.mockRestore();
    }
  });

  it("테이블 이름의 백틱은 이스케이프한다", async () => {
    const counted: string[] = [];
    const base = routedQuery([
      ["VERSION()", [{ version: "8.4.0" }]],
      ["information_schema_stats_expiry", []],
      ["SELECT DATABASE() AS db", [{ db: "testdb" }]],
      ["AS name FROM information_schema.SCHEMATA", []],
      [
        "information_schema.TABLES",
        [{ name: "we`ird", row_count: 0, bytes: 0 }],
      ],
      ["index_count", [{}]],
    ]);
    const { mod } = fakeMysql2(async (sql) => {
      if (!sql.includes("exact_rows")) return base(sql);
      counted.push(sql);
      return [[{ exact_rows: 1 }], []];
    });
    const session = await mysqlDriver.connect(mod, { host: "db" });

    await session.overview();
    expect(counted[0]).toContain("FROM `we``ird`");
  });

  it("데이터베이스를 지정하지 않았으면 DB 목록만 채워 돌려준다", async () => {
    const { mod } = fakeMysql2(
      routedQuery([
        ["VERSION()", [{ version: "8.4.0" }]],
        ["information_schema_stats_expiry", []],
        ["SELECT DATABASE() AS db", [{ db: null }]],
        ["AS name FROM information_schema.SCHEMATA", [{ name: "testdb" }]],
      ]),
    );
    const session = await mysqlDriver.connect(mod, { host: "db" });

    await expect(session.overview()).resolves.toMatchObject({
      database: null,
      tables: [],
      databases: ["testdb"],
    });
  });

  it("통계 캐시 설정이 없는 서버(5.7)에서도 overview를 조회한다", async () => {
    const base = routedQuery([
      ["VERSION()", [{ version: "5.7.44" }]],
      ["SELECT DATABASE() AS db", [{ db: null }]],
      ["AS name FROM information_schema.SCHEMATA", []],
    ]);
    const { mod } = fakeMysql2(async (sql) => {
      if (sql.includes("information_schema_stats_expiry"))
        throw new Error("Unknown system variable");
      return base(sql);
    });
    const session = await mysqlDriver.connect(mod, { host: "db" });

    await expect(session.overview()).resolves.toMatchObject({ database: null });
  });

  // 접속(VERSION()) 뒤 사용자 SQL에는 queryResult로 응답하는 세션
  async function queryableSession(
    queryResult: (options: { sql: string }) => [unknown, unknown],
  ) {
    const { mod } = fakeMysql2(async (arg) =>
      typeof arg === "string"
        ? [[{ version: "8.4.0" }], []]
        : queryResult(arg as unknown as { sql: string }),
    );
    return mysqlDriver.connect(mod, { host: "db" });
  }

  it("query는 열 이름과 배열 행을 돌려준다 (같은 이름의 열도 유지)", async () => {
    let received: unknown;
    const session = await queryableSession((options) => {
      received = options;
      return [
        [
          [1, "kim", 10],
          [2, null, 20],
        ],
        [{ name: "id" }, { name: "name" }, { name: "id" }],
      ];
    });

    const result = await session.query("  SELECT * FROM a JOIN b;  ");

    expect(received).toMatchObject({
      sql: "SELECT * FROM a JOIN b",
      rowsAsArray: true,
    });
    expect(result).toMatchObject({
      kind: "rows",
      columns: ["id", "name", "id"],
      rows: [
        [1, "kim", 10],
        [2, null, 20],
      ],
      truncated: false,
    });
  });

  it("query는 IPC로 보낼 수 없는 값을 화면용 값으로 바꾼다", async () => {
    const session = await queryableSession(() => [
      [
        [
          BigInt("9007199254740993"),
          new Date("2026-01-02T03:04:05.000Z"),
          Uint8Array.from([0xde, 0xad]),
          { a: 1 },
          undefined,
        ],
      ],
      [
        { name: "big" },
        { name: "at" },
        { name: "bin" },
        { name: "json" },
        { name: "u" },
      ],
    ]);

    const result = await session.query("SELECT 1");

    expect(result.kind === "rows" && result.rows[0]).toEqual([
      "9007199254740993",
      "2026-01-02T03:04:05.000Z",
      "0xdead",
      '{"a":1}',
      null,
    ]);
  });

  it(`query는 ${QUERY_ROW_LIMIT}행까지만 담고 truncated로 알린다`, async () => {
    const rows = Array.from({ length: QUERY_ROW_LIMIT + 5 }, (_, i) => [i]);
    const session = await queryableSession(() => [rows, [{ name: "n" }]]);

    const result = await session.query("SELECT n FROM t");

    expect(result.kind === "rows" && result.rows.length).toBe(QUERY_ROW_LIMIT);
    expect(result).toMatchObject({ truncated: true });
  });

  it("행을 돌려주지 않는 문은 영향받은 행 수를 돌려준다", async () => {
    const session = await queryableSession(() => [
      { affectedRows: 3, insertId: 0 },
      undefined,
    ]);

    await expect(session.query("UPDATE t SET a = 1")).resolves.toMatchObject({
      kind: "affected",
      affectedRows: 3,
    });
  });

  it("CALL 결과는 첫 결과 집합을 보여 준다", async () => {
    const session = await queryableSession(() => [
      [[["x"]], { affectedRows: 0 }],
      [[{ name: "col" }], undefined],
    ]);

    await expect(session.query("CALL p()")).resolves.toMatchObject({
      kind: "rows",
      columns: ["col"],
      rows: [["x"]],
    });
  });

  it("query 오류는 그대로 전달한다", async () => {
    const session = await queryableSession(() => {
      throw new Error("You have an error in your SQL syntax");
    });

    await expect(session.query("SELEC 1")).rejects.toThrow("SQL syntax");
  });
});
