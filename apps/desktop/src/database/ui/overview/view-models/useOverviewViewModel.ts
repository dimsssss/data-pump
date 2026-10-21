import { useMemo } from "react";
import type {
  ActiveConnection,
  DatabaseOverview,
} from "@packages/utils/client";

export interface StatItem {
  label: string;
  icon: string;
  // 조회 전이면 "–"
  value: string;
  description: string;
}

export interface MetaItem {
  label: string;
  description: string;
  value: string;
}

export interface ChartBar {
  name: string;
  rows: number;
  // 정확한 행 수를 세지 못해 DB 통계의 추정값을 썼으면 true
  rowsEstimated: boolean;
  // 막대 높이 (y축 최댓값 대비 %)
  percent: number;
}

const DRIVER_NAMES: Record<string, string> = {
  mysql: "MySQL",
  sqlite: "SQLite",
  postgres: "PostgreSQL",
};

const driverDisplayName = (driver: string) => DRIVER_NAMES[driver] ?? driver;

const EMPTY = "–";

const Y_TICK_COUNT = 4;

// 테이블이 많으면 막대가 너무 얇아지므로 행 수가 많은 순으로 이만큼만 그린다
const MAX_BARS = 12;

// y축 최댓값: 가장 큰 값을 넘는 1·2·2.5·5·10 × 10^n 중 가장 작은 값 (예: 8715 → 10000)
function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)!;
  return step * magnitude;
}

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// 예: 8830976 → 8.42 MB
function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${unit === 0 ? value : value.toFixed(2)} ${units[unit]}`;
}

// 예: 11 Oct 2026 22:41
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

export function useOverviewViewModel(
  connection: ActiveConnection,
  overview: DatabaseOverview | null,
) {
  const count = (n: number | undefined) =>
    n === undefined ? EMPTY : String(n);

  const stats: StatItem[] = [
    {
      label: "TABLES",
      icon: "▦",
      value: count(overview?.tables.length),
      description: "The number of tables in the DB.",
    },
    {
      label: "INDEXES",
      icon: "≣",
      value: count(overview?.indexes),
      description: "The number of indexes in the DB.",
    },
    {
      label: "VIEWS",
      icon: "◫",
      value: count(overview?.views),
      description: "The number of views in the DB.",
    },
    {
      label: "TRIGGERS",
      icon: "⚡",
      value: count(overview?.triggers),
      description: "The number of triggers in the DB.",
    },
  ];

  const chart = useMemo(() => {
    const tables = overview?.tables ?? [];
    const sorted = [...tables]
      .sort((a, b) => b.rows - a.rows)
      .slice(0, MAX_BARS);
    const max = niceMax(sorted[0]?.rows ?? 0);
    const bars: ChartBar[] = sorted.map((t) => ({
      name: t.name,
      rows: t.rows,
      rowsEstimated: t.rowsEstimated,
      percent: (t.rows / max) * 100,
    }));
    // 위에서 아래로: 최댓값 … 0
    const yTicks = Array.from({ length: Y_TICK_COUNT + 1 }, (_, i) =>
      compact.format((max * (Y_TICK_COUNT - i)) / Y_TICK_COUNT),
    );
    const totalRows = tables.reduce((sum, t) => sum + t.rows, 0);
    return {
      bars,
      yTicks,
      totalRows: totalRows.toLocaleString("en"),
      // 추정값이 하나라도 섞였으면 합계도 추정값이다
      totalEstimated: tables.some((t) => t.rowsEstimated),
      // 차트에 다 그리지 못한 테이블 수
      hiddenCount: tables.length - bars.length,
    };
  }, [overview]);

  const metadata: MetaItem[] = [
    {
      label: "DATABASE SIZE",
      description: "The size of the DB on disk.",
      value: overview ? formatBytes(overview.sizeBytes) : EMPTY,
    },
    {
      label: "SERVER VERSION",
      description: `${driverDisplayName(connection.driver)} server version.`,
      value: connection.serverVersion,
    },
    {
      label: "ENCODING",
      description: "Server-side character set.",
      value: overview?.encoding || EMPTY,
    },
    {
      label: "DATABASES",
      description: "Databases visible to this user.",
      value: overview ? overview.databases.join(", ") || EMPTY : EMPTY,
    },
    {
      label: "CONNECTED",
      description: "Session started at.",
      value: formatDateTime(connection.connectedAt),
    },
  ];

  return { stats, chart, metadata };
}
