const variants = {
  default:
    "px-1 pb-1 text-sm capitalize text-[#7F9A8E] " +
    "aria-selected:border-[#10B981] aria-selected:font-semibold aria-selected:text-[#E6F2EC]",
  // 작업 화면 상단 내비게이션
  nav:
    "px-2.5 pt-[15px] pb-[13px] font-mono text-[12px] leading-normal font-medium uppercase tracking-[0.04em] text-[#7F9A8E] hover:text-[#E6F2EC] " +
    "aria-selected:border-[#10B981] aria-selected:font-bold aria-selected:text-[#34D399]",
} as const;

export interface TabProps {
  name: string;
  active: boolean;
  onSelect: () => void;
  variant?: keyof typeof variants;
}

export function Tab({ name, active, onSelect, variant = "default" }: TabProps) {
  return (
    <li>
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onSelect}
        className={`cursor-pointer border-b-2 border-transparent ${variants[variant]}`}
      >
        {name}
      </button>
    </li>
  );
}
