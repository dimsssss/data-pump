import { ConnectionField } from "@packages/components";

export function ConnectionHeader() {
  return (
    <div className="flex flex-col gap-2.5">
      <ConnectionField label={"Name:"} />
      <ConnectionField label={"Comment:"} />
    </div>
  );
}
