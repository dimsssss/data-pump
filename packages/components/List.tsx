import { ListItem } from "./ListItem";

export interface ListItemData {
  id: string;
  name: string;
  driver: string;
  description: string;
}

export function List({
  items,
  selectedId,
  onSelect,
  emptyMessage = "항목이 없습니다",
  className = "",
}: {
  items: ListItemData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  // 목록 영역의 배치·스크롤 스타일. 빈 목록 안내에도 같이 적용해 레이아웃이 유지되게 한다
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <p
        className={`px-4 py-2 text-[11px]/[normal] text-[#7F9A8E] ${className}`}
      >
        {emptyMessage}
      </p>
    );
  }
  return (
    <ul className={className}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          name={item.name}
          driver={item.driver}
          description={item.description}
          selected={selectedId === item.id}
          onSelect={() => onSelect(item.id)}
        />
      ))}
    </ul>
  );
}
