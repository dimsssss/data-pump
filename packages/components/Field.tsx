import { Input, InputType } from "./Input";
import { Label } from "./Label";

export function Field({
  label,
  inputType,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  inputType?: InputType;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-row items-center gap-3">
      <Label text={label} />
      <Input
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        ariaLabel={label.replace(/:$/, "")}
      />
    </div>
  );
}
