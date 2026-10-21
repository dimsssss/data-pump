import { DriverBadge } from "./DriverBadge";

export interface ListItemProps {
  name: string;
  driver: string;
  // 이름 아래 보조 텍스트 (예: 접속 URL)
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export function ListItem({
  name,
  driver,
  description,
  selected,
  onSelect,
}: ListItemProps) {
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
        <DriverBadge driver={driver} />
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
