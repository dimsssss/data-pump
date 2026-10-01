import type { ConnectStatus } from "../view-models/useConnectionViewModel";

const COLORS: Record<ConnectStatus["kind"], string> = {
  idle: "text-[#7F9A8E]",
  working: "text-[#7F9A8E]",
  success: "text-[#34D399]",
  error: "text-[#F87171]",
};

export function ConnectionResultDisplay({ status }: { status: ConnectStatus }) {
  return (
    <footer
      className="shrink-0 text-xs/[normal]"
      role="status"
      aria-live="polite"
    >
      {status.kind !== "idle" && (
        <>
          <p className={COLORS[status.kind]}>{status.message}</p>
          {status.kind === "success" && (
            <p className="mt-0.5 truncate text-[#7F9A8E]" title={status.detail}>
              {status.detail}
            </p>
          )}
        </>
      )}
    </footer>
  );
}
