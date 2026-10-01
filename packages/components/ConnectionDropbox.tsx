import { Driver } from "./ConnectionItem";
import { ConnectionLabel } from "./ConnectionLabel";

export function ConnectionDropbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Driver;
  onChange: (value: Driver) => void;
}) {
  return (
    <div className="flex flex-row items-center gap-3">
      <ConnectionLabel text={label} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Driver)}
        autoComplete="off"
      >
        <option value="mysql">mysql</option>
        <option value="sqlite">sqlite</option>
      </select>
    </div>
  );
}
