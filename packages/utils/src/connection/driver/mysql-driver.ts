import {
  CONNECT_TIMEOUT_MS,
  QUERY_ROW_LIMIT,
  type DatabaseOverview,
  type Driver,
  type QueryResult,
} from "./Driver";
import type { QueryValue } from "../../../client";

type Row = Record<string, unknown>;

// mysql2 번들 중 여기서 쓰는 부분만의 타입
interface Mysql2Module {
  createConnection(options: Record<string, unknown>): {
    promise(): MysqlConnection;
  };
}

interface MysqlConnection {
  query(sql: string): Promise<[Row[], unknown]>;
  // rowsAsArray: 같은 이름의 열이 덮어쓰이지 않도록 행을 배열로 받는다
  query(options: {
    sql: string;
    rowsAsArray: true;
    dateStrings: true;
    supportBigNumbers: true;
  }): Promise<[unknown, unknown]>;
  end(): Promise<void>;
  destroy(): void;
}

// 목록에서 제외하는 MySQL 시스템 데이터베이스
const SYSTEM_DATABASES = [
  "mysql",
  "information_schema",
  "performance_schema",
  "sys",
];

// COUNT는 number, SUM은 DECIMAL이라 문자열로 오므로 숫자로 맞춘다
const toNumber = (v: unknown) => Number(v ?? 0) || 0;

// 정확한 행 수(COUNT(*))의 시간 제한. 넘으면 information_schema의 추정값을 쓴다
export const EXACT_COUNT_TIMEOUT_MS = 1_000;
// 테이블이 많아도 overview가 오래 걸리지 않도록 정확한 행 수 조회에 쓰는 전체 시간
export const EXACT_COUNT_BUDGET_MS = 5_000;

const quoteIdentifier = (name: string) => `\`${name.replace(/`/g, "``")}\``;

// 테이블마다 COUNT(*)를 시간 제한을 두고 실행한다.
// InnoDB의 TABLE_ROWS 추정값은 실제와 크게 다를 수 있어(10만 행이 0으로 나오기도 한다) 정확한 값을 우선한다
async function countRows(
  conn: MysqlConnection,
  tables: { name: string; estimate: number }[],
) {
  const startedAt = Date.now();
  const results: { rows: number; rowsEstimated: boolean }[] = [];
  for (const table of tables) {
    if (Date.now() - startedAt >= EXACT_COUNT_BUDGET_MS) {
      results.push({ rows: table.estimate, rowsEstimated: true });
      continue;
    }
    try {
      // MAX_EXECUTION_TIME 힌트: MySQL 5.7.8+에서 SELECT를 제한 시간에 중단한다
      const [[row]] = await conn.query(
        `SELECT /*+ MAX_EXECUTION_TIME(${EXACT_COUNT_TIMEOUT_MS}) */ COUNT(*) AS exact_rows
         FROM ${quoteIdentifier(table.name)}`,
      );
      results.push({ rows: toNumber(row?.exact_rows), rowsEstimated: false });
    } catch {
      // 시간 초과·권한 부족 등은 추정값으로 대신한다
      results.push({ rows: table.estimate, rowsEstimated: true });
    }
  }
  return results;
}

async function queryOverview(conn: MysqlConnection): Promise<DatabaseOverview> {
  // MySQL 8은 information_schema의 행 수·크기 통계를 기본 24시간 캐시하므로 바로 갱신되게 끈다.
  // 5.7에는 없는 변수라 실패해도 무시한다
  await conn
    .query("SET SESSION information_schema_stats_expiry = 0")
    .catch(() => {});

  const [[current]] = await conn.query("SELECT DATABASE() AS db");
  const [databaseRows] = await conn.query(
    `SELECT SCHEMA_NAME AS name FROM information_schema.SCHEMATA
     WHERE SCHEMA_NAME NOT IN (${SYSTEM_DATABASES.map((d) => `'${d}'`).join(", ")})
     ORDER BY SCHEMA_NAME`,
  );
  const databases = databaseRows.map((r) => String(r.name));

  const database = current?.db == null ? null : String(current.db);
  if (database === null) {
    return {
      database,
      tables: [],
      indexes: 0,
      views: 0,
      triggers: 0,
      sizeBytes: 0,
      encoding: "",
      databases,
    };
  }

  // TABLE_ROWS는 통계 기반 추정값이라 정확한 행 수를 조회하지 못했을 때만 쓴다
  const [tableRows] = await conn.query(
    `SELECT TABLE_NAME AS name, TABLE_ROWS AS row_count,
            DATA_LENGTH + INDEX_LENGTH AS bytes
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`,
  );
  const [[counts]] = await conn.query(
    `SELECT
       (SELECT COUNT(DISTINCT TABLE_NAME, INDEX_NAME) FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()) AS index_count,
       (SELECT COUNT(*) FROM information_schema.VIEWS
        WHERE TABLE_SCHEMA = DATABASE()) AS view_count,
       (SELECT COUNT(*) FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE()) AS trigger_count,
       (SELECT DEFAULT_CHARACTER_SET_NAME FROM information_schema.SCHEMATA
        WHERE SCHEMA_NAME = DATABASE()) AS encoding`,
  );

  const counted = await countRows(
    conn,
    tableRows.map((r) => ({
      name: String(r.name),
      estimate: toNumber(r.row_count),
    })),
  );
  const tables = tableRows.map((r, i) => ({
    name: String(r.name),
    ...counted[i],
    bytes: toNumber(r.bytes),
  }));
  return {
    database,
    tables,
    indexes: toNumber(counts?.index_count),
    views: toNumber(counts?.view_count),
    triggers: toNumber(counts?.trigger_count),
    sizeBytes: tables.reduce((sum, t) => sum + t.bytes, 0),
    encoding: String(counts?.encoding ?? ""),
    databases,
  };
}

// 바이너리 값은 앞부분만 16진수로 보여 준다
const BINARY_PREVIEW_BYTES = 32;

// mysql2가 돌려준 값을 IPC로 보낼 수 있고 화면에 그릴 수 있는 값으로 바꾼다
function toQueryValue(value: unknown): QueryValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "bigint" || typeof value === "boolean")
    return String(value);
  // dateStrings로 날짜는 문자열로 오지만, 드라이버 설정에 따라 Date로 올 수도 있다
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? String(value) : value.toISOString();
  if (value instanceof Uint8Array) {
    const hex = Array.from(value.subarray(0, BINARY_PREVIEW_BYTES), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    return `0x${hex}${value.length > BINARY_PREVIEW_BYTES ? "…" : ""}`;
  }
  // JSON 열은 mysql2가 객체로 파싱해 준다
  return JSON.stringify(value);
}

// 실행 결과가 행 목록이 아니면(INSERT·UPDATE·DDL) ResultSetHeader 객체다
async function runQuery(
  conn: MysqlConnection,
  sql: string,
): Promise<QueryResult> {
  const startedAt = performance.now();
  // 마지막 세미콜론은 문장 구분자일 뿐이라 떼어 낸다 (한 번에 한 문장만 실행한다)
  const [result, fields] = await conn.query({
    sql: sql.trim().replace(/;+\s*$/, ""),
    rowsAsArray: true,
    // 날짜는 시간대 변환 없이 DB에 저장된 그대로 받는다
    dateStrings: true,
    // BIGINT·DECIMAL 중 Number로 정확히 나타낼 수 없는 값만 문자열로 받는다
    supportBigNumbers: true,
  });
  const durationMs = Math.round(performance.now() - startedAt);

  if (!Array.isArray(result)) {
    const header = result as { affectedRows?: number };
    return {
      kind: "affected",
      affectedRows: header.affectedRows ?? 0,
      durationMs,
    };
  }

  // CALL은 [결과 행들, ResultSetHeader]로 오므로 첫 결과 집합을 보여 준다
  const isMultiResult = Array.isArray((fields as unknown[] | undefined)?.[0]);
  const rows = (isMultiResult ? result[0] : result) as unknown[][];
  const columns = (
    ((isMultiResult ? (fields as unknown[])[0] : fields) ?? []) as {
      name: string;
    }[]
  ).map((f) => f.name);

  return {
    kind: "rows",
    columns,
    rows: rows.slice(0, QUERY_ROW_LIMIT).map((row) => row.map(toQueryValue)),
    truncated: rows.length > QUERY_ROW_LIMIT,
    durationMs,
  };
}

export const mysqlDriver: Driver = {
  async connect(driverModule, params) {
    const mysql = driverModule as Mysql2Module;
    // Host가 비어 있고 Url만 입력했으면 URL로 접속 (비밀번호는 입력란 값을 우선)
    const options =
      !params.host && params.url
        ? { uri: params.url, password: params.password || undefined }
        : {
            host: params.host,
            port: params.port,
            user: params.user,
            password: params.password,
            database: params.database || undefined,
          };

    const conn = mysql
      .createConnection({ ...options, connectTimeout: CONNECT_TIMEOUT_MS })
      .promise();
    try {
      // 실제 로그인은 첫 쿼리 시점에 이루어지므로 버전 조회로 인증까지 확인
      const [rows] = await conn.query("SELECT VERSION() AS version");
      return {
        serverVersion: String(rows[0]?.version ?? ""),
        overview: () => queryOverview(conn),
        query: (sql) => runQuery(conn, sql),
        close: () => conn.end(),
      };
    } catch (err) {
      conn.destroy();
      throw err;
    }
  },
};
