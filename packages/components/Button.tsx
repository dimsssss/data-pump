const base =
  "inline-flex items-center rounded-[5px] border px-[18px] py-[7px] text-[12px] leading-normal whitespace-nowrap cursor-pointer " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10B981] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary:
    "border-transparent bg-[#10B981] text-[#04130D] font-semibold hover:bg-[#34D399]",
  secondary:
    "border-[#1E3A30] bg-[#12291F] text-[#E6F2EC] font-normal hover:bg-[#1A3A2D]",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: keyof typeof variants;
}

export function Button({
  label,
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}
