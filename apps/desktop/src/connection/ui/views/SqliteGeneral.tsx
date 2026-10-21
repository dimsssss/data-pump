import { Field } from "@packages/components";
import type { ConnectionViewModel } from "../view-models/useConnectionViewModel";

export function SqliteGeneral({
  form,
  onChange,
}: {
  form: ConnectionViewModel["form"];
  onChange: ConnectionViewModel["setField"];
}) {
  return (
    <>
      <Field
        label={"Host"}
        value={form.host}
        onChange={(v) => onChange("host", v)}
      />
      <Field
        label={"Url"}
        value={form.url}
        onChange={(v) => onChange("url", v)}
      />
    </>
  );
}
