import { useCallback, useRef, useState } from "react";
import type { ActiveConnection, QueryResult } from "@packages/utils/client";
import { databaseApi } from "../../../ipc.renderer";
import { toMessage } from "../../view-models/useWorkspaceViewModel";

export type QueryStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; result: QueryResult }
  | { kind: "error"; message: string };

const integer = new Intl.NumberFormat("en");

// 결과 영역 상단에 표시할 요약 (예: 1,000 rows · 12 ms)
function summarize(result: QueryResult) {
  const duration = `${integer.format(result.durationMs)} ms`;
  if (result.kind === "affected") {
    const n = result.affectedRows;
    return `${integer.format(n)} ${n === 1 ? "row" : "rows"} affected · ${duration}`;
  }
  const n = result.rows.length;
  return `${integer.format(n)}${result.truncated ? "+" : ""} ${n === 1 ? "row" : "rows"} · ${duration}`;
}

export function useQueryViewModel(
  connection: ActiveConnection,
  databaseClient = databaseApi,
) {
  const [sql, setSql] = useState("");
  const [status, setStatus] = useState<QueryStatus>({ kind: "idle" });
  // 세션 하나로 순서대로 실행되므로 실행 중에는 다시 실행하지 않는다
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current || !sql.trim()) return;
    running.current = true;
    setStatus({ kind: "running" });
    try {
      const result = await databaseClient.query(connection.id, sql);
      setStatus({ kind: "done", result });
    } catch (err) {
      setStatus({ kind: "error", message: toMessage(err) });
    } finally {
      running.current = false;
    }
  }, [databaseClient, connection.id, sql]);

  return {
    sql,
    setSql,
    run,
    status,
    canRun: status.kind !== "running" && sql.trim() !== "",
    summary: status.kind === "done" ? summarize(status.result) : "",
  };
}
