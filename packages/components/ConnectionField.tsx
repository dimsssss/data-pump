import { ConnectionInput, ConnectionInputType } from "./ConnectionInput";
import { ConnectionLabel } from "./ConnectionLabel";

export function ConnectionField({
  label,
  inputType,
}: {
  label: string;
  inputType?: ConnectionInputType;
}) {
  return (
    <div className="flex flex-row items-center gap-3">
      <ConnectionLabel text={label} />
      <ConnectionInput type={inputType} />
    </div>
  );
}
