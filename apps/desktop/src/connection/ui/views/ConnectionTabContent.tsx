import type { ReactNode } from "react";

export function ConnectionTabContent({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>;
}
