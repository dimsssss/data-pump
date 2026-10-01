export interface TabProps {
  name: string;
  active: boolean;
  onSelect: () => void;
}

export function Tab({ name, active, onSelect }: TabProps) {
  return (
    <li>
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onSelect}
        className="cursor-pointer border-b-2 border-transparent px-1 pb-1 text-sm capitalize text-[#7F9A8E]
                   aria-selected:border-[#10B981] aria-selected:font-semibold aria-selected:text-[#E6F2EC]"
      >
        {name}
      </button>
    </li>
  );
}
