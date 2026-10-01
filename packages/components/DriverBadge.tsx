export function DriverBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-[5px] text-[12px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
