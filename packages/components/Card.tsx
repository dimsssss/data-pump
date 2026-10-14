// 작업 화면의 카드 패널. 안쪽 여백과 배치는 쓰는 쪽에서 className으로 정한다
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-[#1E3A30] bg-[#071611] ${className}`}
    >
      {children}
    </section>
  );
}
