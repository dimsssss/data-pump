export type ConnectionInputType =
  "text" | "password" | "number" | "checkbox" | "radio" | "file";

export function ConnectionInput({
  type = "text",
}: {
  type?: ConnectionInputType;
}) {
  return (
    <input
      type={type}
      className="w-full rounded-[5px] border border-[#1E3A30] bg-[#071611] px-2.5 py-1.75 font-[Inter] text-[12px] leading-normal text-[#E6F2EC] placeholder:text-[#7F9A8E] outline-none focus:border-[#10B981] focus:ring-1 focus:ring-inset focus:ring-[#10B981]"
    />
  );
}
