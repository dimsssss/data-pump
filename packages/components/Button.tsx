const base =
  "inline-flex items-center gap-1.5 rounded-[5px] border py-[7px] text-[12px] leading-normal whitespace-nowrap cursor-pointer " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10B981] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary:
    "border-transparent bg-[#10B981] text-[#04130D] font-semibold hover:bg-[#34D399]",
  secondary:
    "border-[#1E3A30] bg-[#12291F] text-[#E6F2EC] font-normal hover:bg-[#1A3A2D]",
} as const;

const sizes = {
  md: "px-[18px]",
  // 아이콘과 함께 쓰는 작업 화면 버튼
  sm: "px-[14px]",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  // label 앞에 붙는 아이콘. 크기·색은 쓰는 쪽에서 정한다
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = "secondary",
  size = "md",
  icon,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </button>
  );
}
