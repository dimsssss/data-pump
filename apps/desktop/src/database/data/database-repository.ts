import type { DatabaseOverview, QueryResult } from "@packages/utils";
import type { DriverService } from "../../driver/data/driver-service";

// 접속한 DB의 데이터: 접속할 때 driver process에 만든 세션(connectionId)으로 조회한다
export type DatabaseRepository = ReturnType<typeof createDatabaseRepository>;

export function createDatabaseRepository(deps: { driver: DriverService }) {
  const { driver } = deps;

  function getOverview(connectionId: string): Promise<DatabaseOverview> {
    return driver.overview(connectionId);
  }

  function runQuery(connectionId: string, sql: string): Promise<QueryResult> {
    return driver.query(connectionId, sql);
  }

  return { getOverview, runQuery };
}
