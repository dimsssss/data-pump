import { ConnectionList } from "@packages/components";
import { ConnectionHeader } from "./ConnectionHeader";
import { ConnectionTabs } from "./ConnectionTabs";
import { GeneralTab } from "./GeneralTab";
import { useState } from "react";
import { ConnectionResultDisplay } from "./ConnectionResultDisplay";
import { ConnectionFooter } from "./ConnectionFooter";
import { useConnectionViewModel } from "../view-models/useConnectionViewModel";
import type { ActiveConnection } from "@packages/utils/client";

export type TabId = "general";

function Connection({
  onApply,
}: {
  onApply: (active: ActiveConnection) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const vm = useConnectionViewModel();
  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden">
        <main className="grid min-h-0 flex-1 grid-cols-[250px_1fr] grid-rows-[minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col bg-[#071611]">
            <div className="flex shrink-0 items-center px-4 pt-3 pb-2">
              <h2 className="text-sm/[normal] font-semibold text-[#E6F2EC]">
                Project Data Sources
              </h2>
              <button
                type="button"
                aria-label="새 접속"
                title="새 접속"
                onClick={vm.createNew}
                className="ml-auto cursor-pointer rounded-[5px] px-1.5 text-sm/[normal] text-[#7F9A8E] hover:bg-[#10362A] hover:text-[#E6F2EC]"
              >
                +
              </button>
            </div>
            <ConnectionList
              className="min-h-0 flex-1 overflow-y-auto"
              items={vm.listItems}
              selectedId={vm.selectedId}
              onSelect={vm.select}
            />
          </aside>
          <section className="flex flex-col min-h-0  px-6 py-5 gap-5">
            <ConnectionHeader form={vm.form} onChange={vm.setField} />
            <ConnectionTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <GeneralTab
                form={vm.form}
                onChange={vm.setField}
                usesSavedPassword={vm.usesSavedPassword}
              />
            </div>
            <ConnectionResultDisplay status={vm.status} />
          </section>
        </main>
        <ConnectionFooter
          onConnect={vm.connect}
          onApply={() => vm.apply(onApply)}
          isConnecting={vm.isConnecting}
        />
      </div>
    </>
  );
}

export default Connection;
