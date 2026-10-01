import { Button } from "@packages/components";

export function ConnectionFooter({
  onConnect,
  onApply,
  isConnecting,
}: {
  onConnect: () => void;
  onApply: () => void;
  isConnecting: boolean;
}) {
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-[#1E3A30] bg-[#0B1E17] px-4 py-3">
      <button
        type="button"
        aria-label="도움말"
        className="text-[13px] font-semibold leading-normal text-[#7F9A8E] hover:text-[#E6F2EC]"
      >
        ?
      </button>
      <div className="ml-auto flex items-center gap-2">
        <Button label="Cancel" />
        <Button label="Apply" onClick={onApply} disabled={isConnecting} />
        <Button
          label={isConnecting ? "Connecting…" : "Connect"}
          variant="primary"
          onClick={onConnect}
          disabled={isConnecting}
        />
      </div>
    </footer>
  );
}
