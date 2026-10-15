import { Button, SqlEditor } from "@packages/components";
import type { ActiveConnection } from "@packages/utils/client";
import { useQueryViewModel } from "../view-models/useQueryViewModel";
import { QueryResultTable } from "./QueryResultTable";

// 작업 화면 QUERY 탭: 위는 SQL 편집기, 아래는 실행 결과.
// 다른 탭을 다녀와도 입력한 SQL과 결과가 남도록 Workspace는 이 탭을 숨기기만 한다
function Query({ connection }: { connection: ActiveConnection }) {
  const vm = useQueryViewModel(connection);
  const { status } = vm;
  const running = status.kind === "running";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-[#1E3A30] px-4 py-2">
        <Button
          label={running ? "Running…" : "Run"}
          variant="primary"
          size="sm"
          icon={<span className="text-[10px]">▶</span>}
          onClick={vm.run}
          disabled={!vm.canRun}
        />
        <span className="font-mono text-[11px] text-[#7F9A8E]">
          ⌘/Ctrl + Enter
        </span>
      </div>
      <div className="relative min-h-0 basis-2/5 border-b border-[#1E3A30]">
        <SqlEditor
          className="absolute inset-0"
          value={vm.sql}
          onChange={vm.setSql}
          onRun={vm.run}
        />
      </div>
      <section
        aria-label="Query result"
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex h-8 shrink-0 items-center border-b border-[#1E3A30] px-4 font-mono text-[11px] text-[#7F9A8E]">
          {status.kind === "idle" && "SQL을 입력하고 실행하세요"}
          {running && "실행 중…"}
          {status.kind === "error" && (
            <span className="text-[#F2C4C4]">실행 실패</span>
          )}
          {status.kind === "done" && vm.summary}
          {status.kind === "done" &&
            status.result.kind === "rows" &&
            status.result.truncated && (
              <span className="ml-3 text-[#FBBF24]">
                앞의 {status.result.rows.length.toLocaleString("en")}행만
                표시합니다
              </span>
            )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {status.kind === "error" && (
            <pre
              role="alert"
              className="m-4 rounded-[8px] border border-[#5B2A2A] bg-[#2A1414] px-5 py-3 font-mono text-[12px] leading-normal whitespace-pre-wrap text-[#F2C4C4]"
            >
              {status.message}
            </pre>
          )}
          {status.kind === "done" && status.result.kind === "rows" && (
            <QueryResultTable
              columns={status.result.columns}
              rows={status.result.rows}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default Query;
