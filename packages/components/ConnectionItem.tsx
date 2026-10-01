import { DriverBadge } from "./DriverBadge";

export interface ConnectionItemProps {
  name: string;
  driver: string;
  // 이름 아래 보조 텍스트 (예: 접속 URL)
  description: string;
  selected: boolean;
  onSelect: () => void;
}

const DRIVER_BADGES: Record<string, { label: string; color: string }> = {
  mysql: { label: "MY", color: "#00758F" },
  sqlite: { label: "SL", color: "#0F80CC" },
};

const FALLBACK_BADGE = { label: "DB", color: "#4B5563" };

export function ConnectionItem({
  name,
  driver,
  description,
  selected,
  onSelect,
}: ConnectionItemProps) {
  const badge = DRIVER_BADGES[driver] ?? FALLBACK_BADGE;

  return (
    <li className="px-2">
      <button
        type="button"
        onClick={onSelect}
        data-selected={selected}
        aria-current={selected}
        className="group flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] px-2 py-1.5 text-left
                   active:bg-[#10362A]/60
                   data-[selected=true]:bg-[#10362A]"
      >
        <DriverBadge label={badge.label} color={badge.color} />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <p className="truncate text-xs/[normal] text-[#E6F2EC] group-data-[selected=true]:font-semibold">
            {name}
          </p>
          <p
            className="truncate text-[10px]/[normal] text-[#7F9A8E]"
            title={description}
          >
            {description}
          </p>
        </div>
      </button>
    </li>
  );
}
