import { Tab } from "@packages/components";
import { TabId } from "./Connection";

export function ConnectionTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (name: TabId) => void;
}) {
  return (
    <ul className="flex flex-row border-b border-[#1F4A3C] gap-1">
      <Tab
        key={1}
        name={"general"}
        onSelect={() => onTabChange("general")}
        active={activeTab === "general"}
      />
    </ul>
  );
}
