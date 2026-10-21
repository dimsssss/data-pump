import { useState } from "react";
import type { ActiveConnection } from "@packages/utils/client";
import { useConnectionViewModel } from "../view-models/useConnectionViewModel";
import { ConnectionLayout } from "./ConnectionLayout";
import { ConnectionSidebar } from "./ConnectionSidebar";
import { ConnectionPanel } from "./ConnectionPanel";
import { ConnectionHeader } from "./ConnectionHeader";
import { ConnectionTabs, type TabId } from "./ConnectionTabs";
import { ConnectionTabContent } from "./ConnectionTabContent";
import { GeneralTab } from "./GeneralTab";
import { ConnectionResultDisplay } from "./ConnectionResultDisplay";
import { ConnectionFooter } from "./ConnectionFooter";

function Connection({
  onApply,
}: {
  onApply: (active: ActiveConnection) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const vm = useConnectionViewModel();
  return (
    <ConnectionLayout
      sidebar={
        <ConnectionSidebar
          items={vm.listItems}
          selectedId={vm.selectedId}
          onSelect={vm.select}
          onCreate={vm.createNew}
        />
      }
      footer={
        <ConnectionFooter
          onConnect={vm.connect}
          onApply={() => vm.apply(onApply)}
          isConnecting={vm.isConnecting}
        />
      }
    >
      <ConnectionPanel>
        <ConnectionHeader form={vm.form} onChange={vm.setField} />
        <ConnectionTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <ConnectionTabContent>
          <GeneralTab
            form={vm.form}
            onChange={vm.setField}
            usesSavedPassword={vm.usesSavedPassword}
          />
        </ConnectionTabContent>
        <ConnectionResultDisplay status={vm.status} />
      </ConnectionPanel>
    </ConnectionLayout>
  );
}

export default Connection;
