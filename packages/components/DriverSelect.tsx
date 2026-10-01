import type { DriverName } from "./DriverName";
import { Label } from "./Label";

export function DriverSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DriverName;
  onChange: (value: DriverName) => void;
}) {
  return (
    <div className="flex flex-row items-center gap-3">
      <Label text={label} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DriverName)}
        autoComplete="off"
      >
        <option value="mysql">mysql</option>
        <option value="sqlite">sqlite</option>
      </select>
    </div>
  );
}
