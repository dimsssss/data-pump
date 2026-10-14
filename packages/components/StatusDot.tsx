// 접속 상태 표시 점 (피그마 Status Dot: 지름 7px, 상태 바는 6px)
export function StatusDot({ size = 7 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="block shrink-0"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
    >
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#34D399" />
    </svg>
  );
}
