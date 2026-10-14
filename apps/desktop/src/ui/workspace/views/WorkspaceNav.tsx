import { Tab } from "@packages/components";
import {
  WORKSPACE_TABS,
  type WorkspaceTabId,
} from "../view-models/useWorkspaceViewModel";

export function WorkspaceNav({
  appVersion,
  activeTab,
  onTabChange,
}: {
  appVersion: string;
  activeTab: WorkspaceTabId;
  onTabChange: (tab: WorkspaceTabId) => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-6 border-b border-[#1E3A30] bg-[#071611] px-4">
      <nav>
        <ul role="tablist" className="flex items-center gap-1">
          {WORKSPACE_TABS.map((tab) => (
            <Tab
              key={tab}
              name={tab}
              variant="nav"
              active={activeTab === tab}
              onSelect={() => onTabChange(tab)}
            />
          ))}
        </ul>
      </nav>
      <span className="ml-auto shrink-0 font-mono text-[11px] leading-normal text-[#34D399]">
        [{appVersion}]
      </span>
    </header>
  );
}
