import { Button } from "@packages/components";
import type {
  ActiveConnection,
  DatabaseOverview,
} from "@packages/utils/client";
import type { OverviewStatus } from "../../view-models/useWorkspaceViewModel";
import { useOverviewViewModel } from "../view-models/useOverviewViewModel";
import { OverviewStatCard } from "./OverviewStatCard";
import { RowsPerTableChart } from "./RowsPerTableChart";
import { MoreMetadata } from "./MoreMetadata";

// 작업 화면 OVERVIEW 탭: 접속한 DB의 개요 (객체 수, 테이블별 행 수, 메타데이터)
function Overview({
  connection,
  overview,
  status,
  onRefresh,
  onNewQuery,
}: {
  connection: ActiveConnection;
  overview: DatabaseOverview | null;
  status: OverviewStatus;
  onRefresh: () => void;
  onNewQuery: () => void;
}) {
  const vm = useOverviewViewModel(connection, overview);
  const isLoading = status.kind === "loading";
  const noDatabase = overview !== null && overview.database === null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto px-8 py-7">
      <header className="flex shrink-0 items-baseline gap-3 border-b border-[#1E3A30] pb-4">
        <h1 className="flex min-w-0 items-baseline gap-3 font-mono text-[26px] leading-normal whitespace-nowrap">
          <span className="text-[#7F9A8E]">EXPLORING</span>
          <span className="truncate font-bold text-[#E6F2EC]">
            {/* 조회 전에는 접속 설정의 DB 이름을, 조회 후에는 실제 현재 DB를 보여 준다 */}
            {(overview ? overview.database : connection.database) ||
              connection.name}
          </span>
        </h1>
        <p className="font-mono text-[14px] leading-normal whitespace-nowrap text-[#7F9A8E]">
          @ {connection.name}
        </p>
        <div className="ml-auto flex shrink-0 gap-3">
          <Button
            label={isLoading ? "Refreshing…" : "Refresh"}
            size="sm"
            icon={<span className="text-[11px] text-[#7F9A8E]">↻</span>}
            onClick={onRefresh}
            disabled={isLoading}
          />
          <Button
            label="New Query"
            variant="primary"
            size="sm"
            icon={<span className="text-[10px]">▶</span>}
            onClick={onNewQuery}
          />
        </div>
      </header>
      {status.kind === "error" && (
        <div
          role="alert"
          className="flex shrink-0 items-center gap-3 rounded-[8px] border border-[#5B2A2A] bg-[#2A1414] px-5 py-3 text-[12px] leading-normal text-[#F2C4C4]"
        >
          <p className="min-w-0 flex-1">{status.message}</p>
          <Button label="다시 시도" size="sm" onClick={onRefresh} />
        </div>
      )}
      {noDatabase ? (
        <p className="text-[12px] leading-normal text-[#7F9A8E]">
          데이터베이스를 지정하지 않고 접속했습니다. 접속 설정의 Database에 DB
          이름을 입력해 다시 접속하세요.
        </p>
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-4 gap-4">
            {vm.stats.map((stat) => (
              <OverviewStatCard key={stat.label} stat={stat} />
            ))}
          </div>
          <div className="flex min-h-80 flex-1 gap-4">
            <RowsPerTableChart {...vm.chart} isLoading={isLoading} />
            <MoreMetadata items={vm.metadata} />
          </div>
        </>
      )}
    </div>
  );
}

export default Overview;
