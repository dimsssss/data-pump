import { Card } from "@packages/components";
import type { MetaItem } from "../view-models/useOverviewViewModel";

export function MoreMetadata({ items }: { items: MetaItem[] }) {
  return (
    <Card className="flex w-105 shrink-0 flex-col gap-1 overflow-y-auto px-6 pt-5 pb-3">
      <h2 className="font-mono text-[15px] leading-normal font-bold tracking-[0.04em] text-[#E6F2EC]">
        MORE METADATA
      </h2>
      <p className="mb-2 text-[12px] leading-normal text-[#7F9A8E]">
        More info about the DB.
      </p>
      <ul>
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-3 border-b border-[#1E3A30] py-3"
          >
            <div className="flex min-w-0 flex-col gap-0.75 text-[11px] leading-normal">
              <h3 className="font-mono font-bold tracking-[0.03em] text-[#E6F2EC]">
                {item.label}
              </h3>
              <p className="truncate text-[#7F9A8E]">{item.description}</p>
            </div>
            <p className="ml-auto shrink-0 font-mono text-[12px] leading-normal font-medium text-[#E6F2EC]">
              {item.value}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
