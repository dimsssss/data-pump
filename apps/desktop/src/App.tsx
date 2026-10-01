import { SqlEditor } from "@packages/components";
import { useState } from "react";

type TabId = "tables" | "query";

const tabs: { id: TabId; label: string }[] = [
  { id: "tables", label: "Tables" },
  { id: "query", label: "Query" },
];

function App() {
  const [activeTab, setActiveTab] = useState<string>("tables");
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
        </header>
        <main className="relative flex-1 min-h-0">
          {activeTab === "tables" && <div>TODO</div>}
          {activeTab === "query" && <SqlEditor className="absolute inset-0" />}
        </main>
      </div>
    </>
  );
}

export default App;
