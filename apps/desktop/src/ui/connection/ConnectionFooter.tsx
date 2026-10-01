import { ConnectionButton } from "@packages/components";

export function ConnectionFooter() {
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
        <ConnectionButton label="Cancel" />
        <ConnectionButton label="Apply" />
        <ConnectionButton label="Connect" variant="primary" />
      </div>
    </footer>
  );
}
