import { SqlEditor } from "@packages/components";
import type { ActiveConnection } from "@packages/utils/client";
import Overview from "../overview/views/Overview";
import { useWorkspaceViewModel } from "../view-models/useWorkspaceViewModel";
import { WorkspaceNav } from "./WorkspaceNav";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { WorkspaceStatusBar } from "./WorkspaceStatusBar";

// 접속 설정 화면에서 Apply로 넘어오면 DB 개요(OVERVIEW 탭)부터 보여준다
function Workspace({
  connection,
  onLeave,
}: {
  connection: ActiveConnection;
  // 접속 화면으로 돌아가기
  onLeave: () => void;
}) {
  const vm = useWorkspaceViewModel(connection);
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0B1E17]">
      <WorkspaceNav
        appVersion={vm.appVersion}
        activeTab={vm.activeTab}
        onTabChange={vm.setActiveTab}
      />
      <div className="flex min-h-0 flex-1">
        <WorkspaceSidebar
          connection={connection}
          tableCount={vm.tables.length}
          tables={vm.filteredTables}
          isLoading={vm.overviewStatus.kind === "loading" && !vm.overview}
          filter={vm.tableFilter}
          onFilterChange={vm.setTableFilter}
        />
        <main className="relative min-w-0 flex-1">
          {vm.activeTab === "overview" && (
            <Overview
              connection={connection}
              overview={vm.overview}
              status={vm.overviewStatus}
              onRefresh={vm.refreshOverview}
              onLeave={onLeave}
              onNewQuery={() => vm.setActiveTab("query")}
            />
          )}
          {vm.activeTab === "query" && (
            <SqlEditor className="absolute inset-0" />
          )}
          {(vm.activeTab === "tables" || vm.activeTab === "schema") && (
            <p className="p-8 text-[12px] text-[#7F9A8E]">TODO</p>
          )}
        </main>
      </div>
      <WorkspaceStatusBar connection={connection} />
    </div>
  );
}

export default Workspace;
