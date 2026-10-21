import { List } from "@packages/components";
import type { ConnectionViewModel } from "../view-models/useConnectionViewModel";

export function ConnectionSidebar({
  items,
  selectedId,
  onSelect,
  onCreate,
}: {
  items: ConnectionViewModel["listItems"];
  selectedId: ConnectionViewModel["selectedId"];
  onSelect: ConnectionViewModel["select"];
  onCreate: ConnectionViewModel["createNew"];
}) {
  return (
    <aside className="flex min-h-0 flex-col bg-[#071611]">
      <div className="flex shrink-0 items-center px-4 pt-3 pb-2">
        <h2 className="text-sm/[normal] font-semibold text-[#E6F2EC]">
          Project Data Sources
        </h2>
        <button
          type="button"
          aria-label="새 접속"
          title="새 접속"
          onClick={onCreate}
          className="ml-auto cursor-pointer rounded-[5px] px-1.5 text-sm/[normal] text-[#7F9A8E] hover:bg-[#10362A] hover:text-[#E6F2EC]"
        >
          +
        </button>
      </div>
      <List
        className="min-h-0 flex-1 overflow-y-auto"
        items={items}
        selectedId={selectedId}
        onSelect={onSelect}
        emptyMessage="저장된 접속 정보가 없습니다"
      />
    </aside>
  );
}
