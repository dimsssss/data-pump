import type { ReactNode } from "react";

export function ConnectionPanel({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col min-h-0  px-6 py-5 gap-5">
      {children}
    </section>
  );
}
