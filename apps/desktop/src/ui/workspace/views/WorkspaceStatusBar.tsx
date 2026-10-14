import { StatusDot } from "@packages/components";
import type { ActiveConnection } from "@packages/utils/client";

export function WorkspaceStatusBar({
  connection,
}: {
  connection: ActiveConnection;
}) {
  return (
    <footer className="flex shrink-0 items-center gap-4 border-t border-[#1E3A30] bg-[#071611] px-4 py-[5px] leading-normal whitespace-nowrap">
      <StatusDot size={6} />
      <span className="text-[11px] text-[#6EE7B7]">
        Connected · {connection.name}
      </span>
      <span className="truncate font-mono text-[10px] text-[#7F9A8E]">
        {connection.address}
      </span>
    </footer>
  );
}
