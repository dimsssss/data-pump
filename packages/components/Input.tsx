export type InputType =
  "text" | "password" | "number" | "checkbox" | "radio" | "file";

export function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  type?: InputType;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange && ((e) => onChange(e.target.value))}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="w-full rounded-[5px] border border-[#1E3A30] bg-[#071611] px-2.5 py-1.75 font-[Inter] text-[12px] leading-normal text-[#E6F2EC] placeholder:text-[#7F9A8E] outline-none focus:border-[#10B981] focus:ring-1 focus:ring-inset focus:ring-[#10B981]"
    />
  );
}
