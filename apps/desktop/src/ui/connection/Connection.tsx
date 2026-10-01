import { ConnectionList } from "@packages/components";
import { ConnectionHeader } from "./ConnectionHeader";
import { ConnectionTabs } from "./ConnectionTabs";
import { GeneralTab } from "./GeneralTab";
import { useState } from "react";
import { ConnectionResultDisplay } from "./ConnectionResultDisplay";
import { ConnectionFooter } from "./ConnectionFooter";

const TABS = ["general"] as const;
export type TabId = (typeof TABS)[number];

function Connection() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden">
        <main className="grid min-h-0 flex-1 grid-cols-[250px_1fr] grid-rows-[minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col bg-[#071611]">
            <h2 className="shrink-0 px-4 pt-3 pb-2 text-sm/[normal] font-semibold text-[#E6F2EC]">
              Project Data Sources
            </h2>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              <ConnectionList />
            </ul>
          </aside>
          <section className="flex flex-col min-h-0  px-6 py-5 gap-5">
            <ConnectionHeader />
            <ConnectionTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <GeneralTab />
            </div>
            <ConnectionResultDisplay />
          </section>
        </main>
        <ConnectionFooter />
      </div>
    </>
  );
}

export default Connection;
