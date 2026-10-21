// renderer ↔ main 사이의 database IPC 계약 (connection/contract.ts와 같은 방식).
// 접속한 DB의 데이터를 조회한다. 어느 DB인지는 connection이 만든 connectionId로 정한다.
// 세 프로세스에서 import하므로 타입과 상수만 둔다
import type { DatabaseOverview, QueryResult } from "@packages/utils/client";

// preload가 window에 노출하는 이름 (window.database)
export const DATABASE_API_KEY = "database";

export const DATABASE_CHANNELS = {
  overview: "database:overview",
  query: "database:query",
} as const;

export interface DatabaseApi {
  // 접속 중인 세션으로 DB 개요를 조회한다
  overview(connectionId: string): Promise<DatabaseOverview>;
  // 접속 중인 세션으로 SQL 한 문장을 실행한다
  query(connectionId: string, sql: string): Promise<QueryResult>;
}
