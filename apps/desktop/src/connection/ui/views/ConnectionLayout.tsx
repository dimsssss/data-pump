import type { ReactNode } from "react";

export function ConnectionLayout({
  sidebar,
  footer,
  children,
}: {
  sidebar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <main className="grid min-h-0 flex-1 grid-cols-[250px_1fr] grid-rows-[minmax(0,1fr)]">
        {sidebar}
        {children}
      </main>
      {footer}
    </div>
  );
}
