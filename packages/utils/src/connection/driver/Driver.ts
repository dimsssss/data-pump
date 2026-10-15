// DB와 직접 대화하는 계층.
// 드라이버 모듈은 DriverInstaller.load로 받은 번들이며, 드라이버마다 사용법이 달라 Driver로 감싼다.
import type { DatabaseOverview, QueryResult } from "../../../client";

export type { DatabaseOverview, QueryResult };

export interface ConnectParams {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  url?: string;
}

export interface DriverSession {
  serverVersion: string;
  // 메타데이터 SQL은 DB마다 달라 드라이버가 구현한다
  overview(): Promise<DatabaseOverview>;
  // 사용자가 입력한 SQL 한 문장을 실행한다
  query(sql: string): Promise<QueryResult>;
  close(): Promise<void>;
}

export interface Driver {
  connect(driverModule: unknown, params: ConnectParams): Promise<DriverSession>;
}

export const CONNECT_TIMEOUT_MS = 10_000;

// 화면에 보낼 최대 행 수. 넘는 행은 버리고 truncated로 알린다
export const QUERY_ROW_LIMIT = 1_000;
