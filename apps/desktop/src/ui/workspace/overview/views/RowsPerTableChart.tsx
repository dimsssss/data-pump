import { Card } from "@packages/components";
import type { ChartBar } from "../view-models/useOverviewViewModel";

export function RowsPerTableChart({
  bars,
  yTicks,
  totalRows,
  totalEstimated,
  hiddenCount,
  isLoading,
}: {
  bars: ChartBar[];
  yTicks: string[];
  totalRows: string;
  totalEstimated: boolean;
  hiddenCount: number;
  isLoading: boolean;
}) {
  return (
    <Card className="flex min-w-0 flex-1 flex-col gap-4 px-6 py-5">
      <div className="flex items-center gap-3 leading-normal whitespace-nowrap">
        <h2 className="font-mono text-[15px] font-bold tracking-[0.04em] text-[#E6F2EC]">
          ROWS PER TABLE
        </h2>
        {/* 시간 안에 세지 못한 테이블은 DB 통계의 추정값이라 ≈로 표시한다 */}
        <p
          className="ml-auto font-mono text-[11px] text-[#7F9A8E]"
          title={
            totalEstimated
              ? "일부 테이블은 행 수를 시간 안에 세지 못해 DB 통계의 추정값을 썼습니다"
              : undefined
          }
        >
          {hiddenCount > 0 &&
            `top ${bars.length} of ${bars.length + hiddenCount} · `}
          total {totalEstimated && "≈"}
          {totalRows} rows
        </p>
      </div>
      {bars.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-[12px] text-[#7F9A8E]">
          {isLoading ? "불러오는 중…" : "테이블이 없습니다"}
        </p>
      ) : (
        // 1행: y축 | 막대, 2행: (빈 칸) | 테이블 이름
        <div className="grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-x-2.5">
          <div className="flex flex-col items-end justify-between pt-0.5 font-mono text-[10px] leading-normal text-[#7F9A8E]">
            {yTicks.map((tick, i) => (
              <span key={i}>{tick}</span>
            ))}
          </div>
          <ul className="flex items-end gap-2.5 border-b border-l border-[#1E3A30]">
            {bars.map((bar, i) => (
              <li
                key={bar.name}
                title={`${bar.name}: ${bar.rowsEstimated ? "≈" : ""}${bar.rows.toLocaleString("en")} rows`}
                className={`min-w-0 flex-1 rounded-t-[3px] ${
                  i === 0 ? "bg-[#34D399]" : "bg-[#34D399]/85"
                }`}
                style={{ height: `${bar.percent}%` }}
              />
            ))}
          </ul>
          <div />
          <ul className="flex gap-2.5 pt-1.5">
            {bars.map((bar) => (
              <li
                key={bar.name}
                className="min-w-0 flex-1 truncate text-center font-mono text-[9px] leading-normal text-[#7F9A8E]"
              >
                {bar.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
