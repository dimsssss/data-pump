import { DriverBadge, StatusDot } from "@packages/components";
import type { ActiveConnection } from "@packages/utils/client";
import type { TableSummary } from "@packages/utils/client";
import { formatCount } from "../view-models/useWorkspaceViewModel";

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center px-3.5 pt-3 pb-1.5 text-[10px] leading-normal text-[#7F9A8E]">
      <h2 className="font-semibold">{title}</h2>
      {count !== undefined && <span className="ml-auto">{count}</span>}
    </div>
  );
}

export function WorkspaceSidebar({
  connection,
  tableCount,
  tables,
  filter,
  onFilterChange,
  isLoading,
}: {
  connection: ActiveConnection;
  tableCount: number;
  tables: TableSummary[];
  filter: string;
  onFilterChange: (value: string) => void;
  isLoading: boolean;
}) {
  return (
    <aside className="flex min-h-0 w-62.5 shrink-0 flex-col border-r border-[#1E3A30] bg-[#071611] pt-1">
      <SectionTitle title="CONNECTED" />
      <div className="px-2">
        <div className="flex items-center gap-2.5 rounded-[5px] bg-[#10362A] px-2 py-1.5">
          <DriverBadge driver={connection.driver} size="md" />
          <div className="flex min-w-0 flex-col gap-px leading-normal">
            <p className="truncate text-[12px] font-semibold text-[#E6F2EC]">
              {connection.name}
            </p>
            <p
              className="truncate text-[10px] text-[#7F9A8E]"
              title={connection.address}
            >
              {connection.address}
            </p>
          </div>
          <span className="ml-auto">
            <StatusDot />
          </span>
        </div>
      </div>
      <div className="px-3.5 pt-2.5 pb-0.5">
        <label className="flex items-center gap-1.5 rounded-[5px] border border-[#1E3A30] bg-[#0B1E17] px-2.5 py-1.5 text-[12px] leading-normal text-[#7F9A8E] focus-within:border-[#10B981]">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter tables…"
            aria-label="테이블 검색"
            className="min-w-0 flex-1 bg-transparent text-[#E6F2EC] outline-none placeholder:text-[#7F9A8E]"
          />
        </label>
      </div>
      <SectionTitle title="TABLES" count={tableCount} />
      {tables.length === 0 && (
        <p className="px-3.5 py-1.5 text-[11px] leading-normal text-[#7F9A8E]">
          {isLoading
            ? "불러오는 중…"
            : filter
              ? "일치하는 테이블이 없습니다"
              : "테이블이 없습니다"}
        </p>
      )}
      <ul className="min-h-0 flex-1 overflow-y-auto pb-2">
        {tables.map((table) => (
          <li key={table.name} className="px-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[5px] text-left leading-normal hover:bg-[#10362A]/60"
            >
              <span aria-hidden="true" className="text-[9px] text-[#7F9A8E]">
                ▸
              </span>
              <span aria-hidden="true" className="text-[11px] text-[#10B981]">
                ▦
              </span>
              <span className="truncate font-mono text-[12px] text-[#E6F2EC]">
                {table.name}
              </span>
              <span
                className="ml-auto font-mono text-[10px] text-[#7F9A8E]"
                title={
                  table.rowsEstimated
                    ? `≈${table.rows.toLocaleString("en")} rows (시간 안에 세지 못해 추정값)`
                    : `${table.rows.toLocaleString("en")} rows`
                }
              >
                {table.rowsEstimated && "≈"}
                {formatCount(table.rows)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
