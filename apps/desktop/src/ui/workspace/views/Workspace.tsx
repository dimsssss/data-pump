import { SqlEditor } from "@packages/components";
import { useState } from "react";
import type { ActiveConnection } from "@packages/utils/client";

type TabId = "tables" | "query";

const tabs: { id: TabId; label: string }[] = [
  { id: "tables", label: "Tables" },
  { id: "query", label: "Query" },
];

// 접속 설정 화면에서 Apply로 넘어오면 바로 SQL을 작성할 수 있게 Query 탭으로 연다
function Workspace({ connection }: { connection: ActiveConnection }) {
  const [activeTab, setActiveTab] = useState<TabId>("query");
  return (
    <>
      <div className="bg-amber-500 flex flex-col h-screen overflow-hidden p-4">
        <header className="h-12 flex flex-row items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`cursor-pointer text-xl uppercase tracking-wide transition-colors
                  focus-visible:outline-2 focus-visible:outline-studio-accent
                  ${
                    isActive
                      ? "font-bold text-studio-accent"
                      : "font-medium text-studio-muted hover:text-gray-200"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
          <p className="ml-auto text-sm" title={connection.id}>
            {connection.name} · {connection.driver} {connection.serverVersion}
          </p>
        </header>
        <main className="relative flex-1 min-h-0">
          {activeTab === "tables" && <div>TODO</div>}
          {activeTab === "query" && <SqlEditor className="absolute inset-0" />}
        </main>
      </div>
    </>
  );
}

export default Workspace;
