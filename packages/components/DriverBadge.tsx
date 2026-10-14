// 드라이버별 배지 글자와 색
const DRIVER_BADGES: Record<string, { label: string; color: string }> = {
  mysql: { label: "MY", color: "#00758F" },
  sqlite: { label: "SL", color: "#0F80CC" },
  postgres: { label: "PG", color: "#33669E" },
};

const FALLBACK_BADGE = { label: "DB", color: "#4B5563" };

const sizes = {
  // 작업 화면 사이드바 접속 표시
  md: "size-[22px] text-[9px]",
  // 접속 설정 화면 목록
  lg: "size-8 text-[12px]",
} as const;

export function DriverBadge({
  driver,
  size = "lg",
}: {
  driver: string;
  size?: keyof typeof sizes;
}) {
  const badge = DRIVER_BADGES[driver] ?? FALLBACK_BADGE;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[5px] leading-normal font-bold text-white ${sizes[size]}`}
      style={{ backgroundColor: badge.color }}
    >
      {badge.label}
    </span>
  );
}
