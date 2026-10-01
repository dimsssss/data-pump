import { Field } from "@packages/components";
import type { ConnectionViewModel } from "../view-models/useConnectionViewModel";

export function ConnectionHeader({
  form,
  onChange,
}: {
  form: ConnectionViewModel["form"];
  onChange: ConnectionViewModel["setField"];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <Field
        label={"Name:"}
        value={form.name}
        onChange={(v) => onChange("name", v)}
      />
      <Field
        label={"Comment:"}
        value={form.comment}
        onChange={(v) => onChange("comment", v)}
      />
    </div>
  );
}
