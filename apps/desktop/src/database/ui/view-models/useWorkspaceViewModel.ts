import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ActiveConnection,
  DatabaseOverview,
} from "@packages/utils/client";
import { version } from "../../../../package.json";
import { databaseApi } from "../../ipc.renderer";

export type WorkspaceTabId = "overview" | "tables" | "query" | "schema";

export const WORKSPACE_TABS: WorkspaceTabId[] = [
  "overview",
  "tables",
  "query",
  "schema",
];

export type OverviewStatus =
  { kind: "loading" } | { kind: "ready" } | { kind: "error"; message: string };

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// 사이드바·차트에 표시할 짧은 행 수 (예: 8715 → 8.7K)
export const formatCount = (n: number) => compact.format(n);

// ipcRenderer.invoke가 붙이는 "Error invoking remote method '...': Error: " 접두어 제거
export const toMessage = (err: unknown) =>
  (err instanceof Error ? err.message : String(err)).replace(
    /^Error invoking remote method '[^']+': (?:\w*Error: )?/,
    "",
  );

export function useWorkspaceViewModel(
  connection: ActiveConnection,
  databaseClient = databaseApi,
) {
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("overview");
  const [tableFilter, setTableFilter] = useState("");
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [overviewStatus, setOverviewStatus] = useState<OverviewStatus>({
    kind: "loading",
  });
  // Refresh를 연달아 누르면 마지막 요청의 결과만 반영한다
  const latestRequest = useRef(0);

  // 사이드바 테이블 목록과 Overview 탭이 같은 조회 결과를 함께 쓴다
  const refreshOverview = useCallback(async () => {
    const request = ++latestRequest.current;
    setOverviewStatus({ kind: "loading" });
    try {
      const result = await databaseClient.overview(connection.id);
      if (request !== latestRequest.current) return;
      setOverview(result);
      setOverviewStatus({ kind: "ready" });
    } catch (err) {
      if (request !== latestRequest.current) return;
      setOverviewStatus({
        kind: "error",
        message: `DB 정보를 불러오지 못했습니다: ${toMessage(err)}`,
      });
    }
  }, [databaseClient, connection.id]);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  const tables = useMemo(() => overview?.tables ?? [], [overview]);

  const filteredTables = useMemo(() => {
    const keyword = tableFilter.trim().toLowerCase();
    return keyword
      ? tables.filter((t) => t.name.toLowerCase().includes(keyword))
      : tables;
  }, [tables, tableFilter]);

  return {
    appVersion: version,
    activeTab,
    setActiveTab,
    overview,
    overviewStatus,
    refreshOverview,
    tables,
    tableFilter,
    setTableFilter,
    filteredTables,
  };
}

export type WorkspaceViewModel = ReturnType<typeof useWorkspaceViewModel>;
