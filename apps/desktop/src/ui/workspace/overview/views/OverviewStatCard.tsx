import { Card } from "@packages/components";
import type { StatItem } from "../view-models/useOverviewViewModel";

export function OverviewStatCard({ stat }: { stat: StatItem }) {
  return (
    <Card className="flex flex-col gap-1.5 px-5 py-4.5">
      <div className="flex items-center leading-normal">
        <h2 className="font-mono text-[11px] font-bold tracking-[0.04em] text-[#E6F2EC]">
          {stat.label}
        </h2>
        <span aria-hidden="true" className="ml-auto text-[13px] text-[#7F9A8E]">
          {stat.icon}
        </span>
      </div>
      <p className="font-mono text-[28px] leading-normal font-bold text-[#34D399]">
        {stat.value}
      </p>
      <p className="truncate text-[11px] leading-normal text-[#7F9A8E]">
        {stat.description}
      </p>
    </Card>
  );
}
